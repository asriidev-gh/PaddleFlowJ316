import { cookies } from "next/headers";

import { HomeAuthenticated } from "@/components/home/home-authenticated";
import { MarketingLandingPage } from "@/components/marketing/marketing-landing-page";
import { clearAuthSessionCookie, getAuthCookieName, getAuthUserFromCookie } from "@/lib/auth";

export default async function Home() {
  const user = await getAuthUserFromCookie();

  if (!user) {
    const cookieStore = await cookies();
    if (cookieStore.get(getAuthCookieName())?.value) {
      await clearAuthSessionCookie();
    }
    return <MarketingLandingPage />;
  }

  return <HomeAuthenticated />;
}
