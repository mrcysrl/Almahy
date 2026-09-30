import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { formatCents, formatDate } from "@/lib/format";
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
      (o) =>
        o.customerEmail === order.customerEmail && o.id !== order.id,
    )
    .slice(0, 5);

  const user = await getSession();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/orders" className="text-sm underline">
          Back to orders
        </Link>

        <h1 className="text-2xl font-semibold">{order.id}</h1>

        <p className="text-sm text-gray-600">
          Created {formatDate(order.createdAt)}
        </p>

        {order.giftMessage && (
          <p className="text-sm">Gift message: {order.giftMessage}</p>
        )}

        <StatusControl
          orderId={order.id}
          status={order.status}
        />
      </div>

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

      <section aria-labelledby="items-heading">
        <h2 id="items-heading" className="mb-2 text-lg font-semibold">
          Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Items in order {order.id}
            </caption>

            <thead className="border-b">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">
                  Product
                </th>

                <th scope="col" className="px-3 py-2 text-right">
                  Qty
                </th>

                <th scope="col" className="px-3 py-2 text-right">
                  Unit price
                </th>

                <th scope="col" className="px-3 py-2 text-right">
                  Line total
                </th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-3 py-2">
                    {item.productName}
                  </td>

                  <td className="px-3 py-2 text-right">
                    {item.quantity}
                  </td>

                  <td className="px-3 py-2 text-right">
                    {formatCents(item.unitPriceCents)}
                  </td>

                  <td className="px-3 py-2 text-right">
                    {formatCents(
                      item.quantity * item.unitPriceCents,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th
                  scope="row"
                  colSpan={3}
                  className="px-3 py-2 text-right"
                >
                  Total
                </th>

                <td className="px-3 py-2 text-right font-semibold">
                  {formatCents(order.totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section aria-labelledby="activity-heading">
        <h2
          id="activity-heading"
          className="mb-2 text-lg font-semibold"
        >
          Activity
        </h2>

        <OrderTimeline events={events} />
      </section>

      <section aria-labelledby="related-heading">
        <h2
          id="related-heading"
          className="mb-2 text-lg font-semibold"
        >
          Related orders
        </h2>

        {related.length === 0 ? (
          <p className="text-sm text-gray-600">
            No other orders from this customer.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {related.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="underline"
                >
                  {o.id}
                </Link>{" "}
                <span className="capitalize">
                  ({o.status})
                </span>
                , {formatCents(o.totalCents)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}