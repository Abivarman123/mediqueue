import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const STAFF_DASHBOARD = "/staff/dashboard";

function getAfterSignInUrl(redirectUrl: string | undefined): string {
  if (!redirectUrl) return STAFF_DASHBOARD;
  try {
    const parsed = new URL(redirectUrl);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || STAFF_DASHBOARD;
  } catch {
    return redirectUrl.startsWith("/") ? redirectUrl : STAFF_DASHBOARD;
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  const afterSignInUrl = getAfterSignInUrl(redirect_url);

  const { userId, sessionStatus } = await auth();
  if (userId && sessionStatus === "active") {
    redirect(afterSignInUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        path="/sign-in"
        fallbackRedirectUrl={STAFF_DASHBOARD}
        signUpFallbackRedirectUrl={STAFF_DASHBOARD}
        forceRedirectUrl={afterSignInUrl}
      />
    </div>
  );
}
