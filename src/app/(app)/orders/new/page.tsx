import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { CreateOrderForm } from "@/components/orders/create-order-form";

export default async function NewOrderPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/orders");

  return (
    <div className="space-y-4">
      <Link href="/orders" className="text-sm underline">
        Back to orders
      </Link>
      <h1 className="text-2xl font-semibold">Create order</h1>
      <CreateOrderForm userId={user.id} />
    </div>
  );
}