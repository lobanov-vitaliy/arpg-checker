import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token } = await searchParams;
  const secret = process.env.CRON_SECRET;

  if (!secret || !token || token !== secret) {
    return <LoginForm invalid={!!token} />;
  }

  return <AdminPanel token={token} />;
}
