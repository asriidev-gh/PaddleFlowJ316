import { HomeAuthenticated } from "@/components/home/home-authenticated";
import { MarketingLandingPage } from "@/components/marketing/marketing-landing-page";
import { getAuthUserFromCookie } from "@/lib/auth";

export default async function Home() {
  const user = await getAuthUserFromCookie();

  if (!user) {
    return <MarketingLandingPage />;
  }

  return <HomeAuthenticated />;
}
