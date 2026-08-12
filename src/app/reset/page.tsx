import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetForm } from "@/components/AccountForms";
import { ACCOUNTS_ENABLED } from "@/lib/site";

export const metadata: Metadata = { title: "Reset Password", robots: { index: false, follow: true } };

export default function ResetPage({ searchParams }: { searchParams: { token?: string } }) {
  if (!ACCOUNTS_ENABLED) redirect("/login");
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  return (
    <div className="mx-auto max-w-md py-10">
      <ResetForm token={token} />
    </div>
  );
}
