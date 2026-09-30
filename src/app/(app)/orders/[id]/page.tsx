import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { formatCents, formatDate } from "@/lib/format";
import { STATUS_BADGE } from "@/lib/status-colors";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { StatusControl } from "@/components/orders/status-control";
import { CustomerSection } from "@/components/orders/customer-section";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = db.orders.find((o) => o.id === id);
  if (!order) notFound();

  const events = db.events
    .filter((e) => e.orderId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const related = db.orders
    .filter(
      (o) => o.customerEmail === order.customerEmail && o.id !== order.id
    )
    .slice(0, 5);

  const user = await getSession();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/orders"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to orders
        </Link>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              Order {order.id}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Created {formatDate(order.createdAt)}
            </p>
          </div>

          <span
            className={`badge ${STATUS_BADGE[order.status]} capitalize self-start sm:self-auto`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Status control */}
      <section aria-labelledby="status-heading" className="card p-4 sm:p-6">
        <h2
          id="status-heading"
          className="text-base font-semibold text-gray-900"
        >
          Status
        </h2>
        <div className="mt-3">
          <StatusControl orderId={order.id} status={order.status} />
        </div>
      </section>

      {/* Customer */}
      <CustomerSection
        orderId={order.id}
        canEdit={user?.role === "admin"}
        initial={{
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          shippingAddress: order.shippingAddress,
          notes: order.notes ?? "",
        }}
      />

      {/* Items */}
      <section aria-labelledby="items-heading" className="card p-4 sm:p-6">
        <h2
          id="items-heading"
          className="text-base font-semibold text-gray-900"
        >
          Items
        </h2>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Items in order {order.id}</caption>

            <thead className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="py-2 pr-4">
                  Product
                </th>
                <th scope="col" className="py-2 pr-4 text-right">
                  Qty
                </th>
                <th scope="col" className="py-2 pr-4 text-right">
                  Unit price
                </th>
                <th scope="col" className="py-2 text-right">
                  Line total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 font-medium text-gray-900">
                    {item.productName}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-600">
                    {formatCents(item.unitPriceCents)}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatCents(item.quantity * item.unitPriceCents)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot className="border-t border-gray-200">
              <tr>
                <th
                  scope="row"
                  colSpan={3}
                  className="py-3 pr-4 text-right text-sm font-normal text-gray-500"
                >
                  Total
                </th>
                <td className="py-3 text-right text-base font-semibold">
                  {formatCents(order.totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.giftMessage && (
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm">
            <span className="font-medium text-blue-900">Gift message: </span>
            <span className="text-blue-800">{order.giftMessage}</span>
          </div>
        )}
      </section>

      {/* Activity */}
      <section aria-labelledby="activity-heading" className="card p-4 sm:p-6">
        <h2
          id="activity-heading"
          className="text-base font-semibold text-gray-900"
        >
          Activity
        </h2>
        <div className="mt-4">
          <OrderTimeline events={events} />
        </div>
      </section>

      {/* Related orders */}
      <section aria-labelledby="related-heading" className="card p-4 sm:p-6">
        <h2
          id="related-heading"
          className="text-base font-semibold text-gray-900"
        >
          Related orders
        </h2>

        {related.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No other orders from this customer.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {related.map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/orders/${o.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {o.id}
                </Link>

                <div className="flex items-center gap-3">
                  <span className={`badge ${STATUS_BADGE[o.status]} capitalize`}>
                    {o.status}
                  </span>
                  <span className="text-gray-500">
                    {formatCents(o.totalCents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}