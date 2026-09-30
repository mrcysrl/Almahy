import Link from "next/link";

export default function OrderNotFound() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Order not found</h1>
      <p className="text-sm text-gray-600">It may have been deleted.</p>
      <Link href="/orders" className="text-sm underline">
        Back to orders
      </Link>
    </div>
  );
}