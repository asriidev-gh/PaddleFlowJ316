import { ClubSignupPage } from "@/components/signup/club-signup-view";

type SignupTab = "new" | "existing";

function resolveSignupTab(tab: string | undefined): SignupTab | undefined {
  if (tab === "existing" || tab === "new") return tab;
  return undefined;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ saveQuickPlay?: string; tab?: string }>;
}) {
  const params = await searchParams;

  return (
    <ClubSignupPage
      saveQuickPlay={params.saveQuickPlay === "1"}
      initialTab={resolveSignupTab(params.tab)}
    />
  );
}
