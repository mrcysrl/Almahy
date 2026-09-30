import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CreateOrderForm } from "@/components/orders/create-order-form";

export default async function NewOrderPage() {
  const user = await getSession();
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