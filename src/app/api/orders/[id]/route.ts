import { NextRequest, NextResponse } from "next/server";

import { authorize } from "@/lib/auth/guard";

import { db } from "@/lib/db";

import { deleteOrder, updateOrder } from "@/lib/orders/mutations";

import { updateOrderSchema } from "@/lib/orders/schemas";

import { canTransition } from "@/lib/orders/transitions";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const auth = await authorize();

  if (auth.response) return auth.response;

  const { id } = await params;

  const order = db.orders.find((o) => o.id === id);

  if (!order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 },
    );
  }

  const events = db.events
    .filter((e) => e.orderId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ order, events });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const auth = await authorize();

  if (auth.response) return auth.response;

  const { id } = await params;

  const body: unknown = await request.json().catch(() => null);

  const parsed = updateOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  if (
    auth.user.role === "support" &&
    Object.keys(parsed.data).some((k) => k !== "status")
  ) {
    return NextResponse.json(
      { error: "Support can only change status" },
      { status: 403 },
    );
  }

  const current = db.orders.find((o) => o.id === id);

  if (!current) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 },
    );
  }

  if (
    parsed.data.status &&
    parsed.data.status !== current.status &&
    !canTransition(current.status, parsed.data.status)
  ) {
    return NextResponse.json(
      {
        error: `Cannot change status from ${current.status} to ${parsed.data.status}`,
      },
      { status: 409 },
    );
  }

  const order = updateOrder(id, parsed.data, auth.user);

  if (!order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(order);
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const auth = await authorize("admin");

  if (auth.response) return auth.response;

  const { id } = await params;

  if (!deleteOrder(id)) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}