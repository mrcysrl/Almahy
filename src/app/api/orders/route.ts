import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { createOrder } from "@/lib/orders/mutations";
import { orderQuerySchema, queryOrders } from "@/lib/orders/query";
import { createOrderSchema } from "@/lib/orders/schemas";

export async function GET(request: NextRequest) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  const parsed = orderQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  return NextResponse.json(queryOrders(db.orders, parsed.data));
}

export async function POST(request: NextRequest) {
  const auth = await authorize("admin");
  if (auth.response) return auth.response;

  const body: unknown = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  return NextResponse.json(createOrder(parsed.data, auth.user), {
    status: 201,
  });
}
