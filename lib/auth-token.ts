import jwt from "jsonwebtoken";

export function tryVerifyAuthToken(token: string | undefined | null) {
  if (!token?.trim()) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}
