export type ClientGeoLocation = {
  city: string;
  region: string;
  country: string;
  /** Display string, e.g. "Manila, National Capital Region, Philippines". */
  label: string;
};

const PRIVATE_OR_LOCAL_IP =
  /^(?:unknown|::1|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[0-1])\.|fc|fd|fe80:)/i;

const geoCache = new Map<string, ClientGeoLocation | null>();

export function isNonPublicIp(ipAddress: string) {
  const ip = ipAddress.trim();
  if (!ip || ip === "unknown") return true;
  return PRIVATE_OR_LOCAL_IP.test(ip);
}

export function formatGeoLabel(parts: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}) {
  return [parts.city, parts.region, parts.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function buildGeo(city: string, region: string, country: string): ClientGeoLocation | null {
  const label = formatGeoLabel({ city, region, country });
  if (!label) return null;
  return { city, region, country, label };
}

function localNetworkGeo(): ClientGeoLocation {
  return { city: "", region: "", country: "", label: "Local network" };
}

/** Prefer edge/platform geo headers when present (Vercel, Cloudflare). */
export function resolveGeoFromRequestHeaders(request: Request): ClientGeoLocation | null {
  const city =
    request.headers.get("x-vercel-ip-city")?.trim() ||
    request.headers.get("cf-ipcity")?.trim() ||
    "";
  const region =
    request.headers.get("x-vercel-ip-country-region")?.trim() ||
    request.headers.get("cf-region")?.trim() ||
    "";
  const country =
    request.headers.get("x-vercel-ip-country")?.trim() ||
    request.headers.get("cf-ipcountry")?.trim() ||
    "";

  // Cloudflare may send country "XX" for unknown.
  if (country.toUpperCase() === "XX") {
    return buildGeo(decodeUriComponentSafe(city), region, "");
  }

  return buildGeo(decodeUriComponentSafe(city), region, country);
}

function decodeUriComponentSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function fetchJson(url: string, timeoutMs = 2500): Promise<unknown | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Best-effort public IP geolocation. Skips private/local IPs.
 * Primary: ipwho.is (HTTPS). Fallback: ipapi.co.
 */
export async function lookupGeoFromIp(ipAddress: string): Promise<ClientGeoLocation | null> {
  const ip = ipAddress.trim();
  if (isNonPublicIp(ip)) return localNetworkGeo();

  if (geoCache.has(ip)) return geoCache.get(ip) ?? null;

  const who = (await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`)) as {
    success?: boolean;
    city?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;

  let geo =
    who?.success === true
      ? buildGeo(who.city?.trim() ?? "", who.region?.trim() ?? "", who.country?.trim() ?? "")
      : null;

  if (!geo) {
    const api = (await fetchJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`)) as {
      error?: boolean;
      city?: string | null;
      region?: string | null;
      country_name?: string | null;
      country?: string | null;
    } | null;
    if (api && !api.error) {
      geo = buildGeo(
        api.city?.trim() ?? "",
        api.region?.trim() ?? "",
        (api.country_name ?? api.country)?.trim() ?? "",
      );
    }
  }

  geoCache.set(ip, geo);
  return geo;
}

export async function resolveClientGeo(
  request: Request,
  ipAddress: string,
): Promise<ClientGeoLocation | null> {
  if (isNonPublicIp(ipAddress)) return localNetworkGeo();

  const fromHeaders = resolveGeoFromRequestHeaders(request);
  if (fromHeaders) return fromHeaders;

  return lookupGeoFromIp(ipAddress);
}

/** Resolve geo for many unique IPs with a small concurrency limit. */
export async function lookupGeoForIpAddresses(
  ipAddresses: string[],
): Promise<Map<string, ClientGeoLocation>> {
  const unique = [...new Set(ipAddresses.map((ip) => ip.trim()).filter(Boolean))];
  const results = new Map<string, ClientGeoLocation>();
  const queue = unique.filter((ip) => {
    if (isNonPublicIp(ip)) {
      results.set(ip, localNetworkGeo());
      return false;
    }
    return true;
  });

  const concurrency = 4;
  let index = 0;

  async function worker() {
    while (index < queue.length) {
      const current = queue[index];
      index += 1;
      const geo = await lookupGeoFromIp(current);
      if (geo) results.set(current, geo);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(queue.length, 0)) }, () => worker()),
  );

  return results;
}
