"use client";

import { Building2, House, LayoutGrid, LogOut, Plus, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { MobileBottomNavButton, MobileBottomNavShell } from "@/components/mobile-bottom-nav";
import { useAuthMe } from "@/hooks/use-auth-me";
import { performClientLogout } from "@/lib/client-logout";
import { canUseOwnerHubTools } from "@/lib/premium-access";

type HomeMobileNavProps = {
  onCreateGame?: () => void;
};

export function HomeMobileNav({ onCreateGame }: HomeMobileNavProps) {
  const pathname = usePathname();
  const { data: authData } = useAuthMe();
  const ownerHubToolsEnabled = canUseOwnerHubTools(authData?.user);

  const isHome = pathname === "/";
  const isMyGames = pathname === "/my-games" || pathname.startsWith("/my-games/");
  const isMyClub = pathname === "/my-club";
  const isMarketplace = pathname === "/marketplace";

  const logout = () => {
    toast.success("Logged out.");
    performClientLogout();
  };

  return (
    <MobileBottomNavShell ariaLabel="Home actions">
      <MobileBottomNavButton
        href="/"
        label="Home"
        active={isHome}
        icon={<House className="h-5 w-5 shrink-0" aria-hidden />}
      />
      {isMyGames && onCreateGame ? (
        <MobileBottomNavButton
          label="Create Game"
          onClick={onCreateGame}
          icon={<Plus className="h-5 w-5 shrink-0" aria-hidden />}
        />
      ) : (
        <MobileBottomNavButton
          href="/my-games"
          label="My Games"
          active={isMyGames}
          icon={<LayoutGrid className="h-5 w-5 shrink-0" aria-hidden />}
        />
      )}
      <MobileBottomNavButton
        href={ownerHubToolsEnabled ? "/my-club" : "/premium"}
        label="My Club"
        active={isMyClub && ownerHubToolsEnabled}
        icon={<Building2 className="h-5 w-5 shrink-0" aria-hidden />}
      />
      <MobileBottomNavButton
        href={ownerHubToolsEnabled ? "/marketplace" : "/premium"}
        label="Marketplace"
        active={isMarketplace && ownerHubToolsEnabled}
        icon={<Store className="h-5 w-5 shrink-0" aria-hidden />}
      />
      <MobileBottomNavButton
        label="Logout"
        onClick={logout}
        icon={<LogOut className="h-5 w-5 shrink-0" aria-hidden />}
      />
    </MobileBottomNavShell>
  );
}
