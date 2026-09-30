import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:bg-white focus:p-2"
      >
        Skip to content
      </a>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <nav aria-label="Main" className="flex gap-4">
          <Link href="/">Dashboard</Link>
          <Link href="/orders">Orders</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {user.name} ({user.role})
          </span>
          <LogoutButton />
        </div>
      </header>
      <main id="main" className="p-4">
        {children}
      </main>
    </div>
  );
}