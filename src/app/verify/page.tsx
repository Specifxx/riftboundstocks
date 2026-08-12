import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyClient } from "@/components/AccountForms";
import { ACCOUNTS_ENABLED } from "@/lib/site";

export const metadata: Metadata = { title: "Confirm Email", robots: { index: false, follow: true } };

export default function VerifyPage({ searchParams }: { searchParams: { token?: string } }) {
  if (!ACCOUNTS_ENABLED) redirect("/login");
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  return (
    <div className="mx-auto max-w-md py-10">
      <VerifyClient token={token} />
    </div>
  );
}
