"use client";

import { Building2, LayoutGrid, Store, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import { PremiumOwnerHubNavLink } from "@/components/premium/premium-owner-hub-link";
import { useAuthMe } from "@/hooks/use-auth-me";
import { canUseOwnerHubTools } from "@/lib/premium-access";

const links = [
  {
    href: "/my-games",
    label: "My Games",
    icon: LayoutGrid,
    activeClass: "owner-hub-nav__link--active owner-hub-nav__link--games",
    premiumOnly: false,
  },
  {
    href: "/users",
    label: "Registered players",
    icon: Users,
    activeClass: "owner-hub-nav__link--active owner-hub-nav__link--users",
    premiumOnly: true,
  },
  {
    href: "/my-club",
    label: "My Club",
    icon: Building2,
    activeClass: "owner-hub-nav__link--active owner-hub-nav__link--club",
    premiumOnly: true,
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    icon: Store,
    activeClass: "owner-hub-nav__link--active owner-hub-nav__link--marketplace",
    premiumOnly: true,
  },
] as const;

export function OwnerHubNav() {
  const pathname = usePathname();
  const { data: authData } = useAuthMe();
  const ownerHubToolsEnabled = canUseOwnerHubTools(authData?.user);

  return (
    <nav aria-label="Owner tools" className="owner-hub-nav">
      {links.map(({ href, label, icon, activeClass, premiumOnly }) => {
        const enabled = !premiumOnly || ownerHubToolsEnabled;
        const active = pathname === href;

        return (
          <PremiumOwnerHubNavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={active}
            activeClass={activeClass}
            enabled={enabled}
          />
        );
      })}
    </nav>
  );
}
