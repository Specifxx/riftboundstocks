import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotForm } from "@/components/AccountForms";
import { ACCOUNTS_ENABLED, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: `Reset your ${SITE_NAME} password.`,
  alternates: { canonical: `${SITE_URL}/forgot` },
  robots: { index: false, follow: true },
};

export default function ForgotPage() {
  if (!ACCOUNTS_ENABLED) redirect("/login");
  return (
    <div className="mx-auto max-w-md py-10">
      <ForgotForm />
    </div>
  );
}
