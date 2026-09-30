import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow focus:ring-2 focus:ring-blue-500"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* Left: brand + desktop nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Order Portal
            </Link>
            <nav aria-label="Main" className="hidden gap-1 text-sm md:flex">
              <Link
                href="/"
                className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Dashboard
              </Link>
              <Link
                href="/orders"
                className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Orders
              </Link>
            </nav>
          </div>

          {/* Right: desktop user info + logout */}
          <div className="hidden items-center gap-3 text-sm text-gray-600 md:flex">
            <span>
              {user.name}{" "}
              <span className="capitalize text-gray-400">({user.role})</span>
            </span>
            <LogoutButton />
          </div>

          {/* Right: mobile avatar + burger */}
          <MobileNav userName={user.name} userRole={user.role} />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}