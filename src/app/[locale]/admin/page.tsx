import { AdminPanel } from "@/components/admin/AdminPanel";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

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
