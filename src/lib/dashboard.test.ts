import { describe, it, expect } from "vitest";
import { getDashboardData, getDefaultRange } from "./dashboard";
import type { Order } from "@/types";

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: "o1",
    customerName: "Ada",
    customerEmail: "ada@example.com",
    shippingAddress: "1 Main St",
    status: "paid",
    items: [],
    totalCents: 1000,
    notes: "",
    giftMessage: "",
    createdAt: "2026-09-10T10:00:00.000Z",
    updatedAt: "2026-09-10T10:00:00.000Z",
    ...overrides,
  };
}

describe("getDefaultRange", () => {
  it("ends at the most recent order and spans 30 days", () => {
    const orders = [
      makeOrder({ id: "a", createdAt: "2026-09-10T10:00:00.000Z" }),
      makeOrder({ id: "b", createdAt: "2026-09-01T10:00:00.000Z" }),
    ];
    const range = getDefaultRange(orders);
    expect(range.to).toBe("2026-09-10");
    expect(range.from).toBe("2026-08-12");
  });

  it("falls back to today when there are no orders", () => {
    const range = getDefaultRange([]);
    expect(range.from < range.to).toBe(true);
  });
});

describe("getDashboardData", () => {
  it("excludes cancelled orders from revenue and count", () => {
    const orders = [
      makeOrder({ id: "a", totalCents: 1000, status: "paid" }),
      makeOrder({ id: "b", totalCents: 2000, status: "delivered" }),
      makeOrder({ id: "c", totalCents: 9000, status: "cancelled" }),
    ];
    const data = getDashboardData(orders, {
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(data.kpis.orderCount).toBe(2);
    expect(data.kpis.revenueCents).toBe(3000);
    expect(data.kpis.avgOrderValueCents).toBe(1500);
  });

  it("counts pending orders separately", () => {
    const orders = [
      makeOrder({ id: "a", status: "pending" }),
      makeOrder({ id: "b", status: "pending" }),
      makeOrder({ id: "c", status: "paid" }),
    ];
    const data = getDashboardData(orders, {
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(data.kpis.pendingCount).toBe(2);
  });
});