import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Order Portal</h1>
        <p className="mb-6 text-sm text-gray-600">
          Demo: admin@example.com / admin123, support@example.com / support123
        </p>
        <LoginForm />
      </div>
    </main>
  );
}