import { APP_LOGO_SRC, APP_NAME } from "@/lib/app-config";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
};

export function AppLogo({ className }: AppLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={APP_LOGO_SRC} alt={APP_NAME} className={cn("app-brand__logo-image", className)} />
  );
}
