import { describe, it, expect } from "vitest";
import {
  getDashboardData,
  getDefaultRange,
  resolveRange,
} from "./dashboard";
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

describe("resolveRange", () => {
  const fallback = { from: "2026-09-01", to: "2026-09-30" };

  it("rejects non-date strings", () => {
    expect(resolveRange("abcdefghij", "abcdefghij", fallback)).toEqual(fallback);
  });

  it("rejects impossible calendar dates", () => {
    expect(resolveRange("2026-02-30", "2026-02-30", fallback)).toEqual(fallback);
  });

  it("rejects flipped ranges", () => {
    expect(resolveRange("2026-09-15", "2026-09-01", fallback)).toEqual(fallback);
  });

  it("rejects spans above 366 days", () => {
    expect(resolveRange("0001-01-01", "9999-12-31", fallback)).toEqual(fallback);
  });

  it("accepts a 365-day gap and rejects 366", () => {
    expect(resolveRange("2025-09-01", "2026-09-01", fallback)).toEqual({
      from: "2025-09-01",
      to: "2026-09-01",
    });
    expect(resolveRange("2025-09-01", "2026-09-02", fallback)).toEqual(
      fallback,
    );
  });

  it("accepts valid ranges", () => {
    expect(resolveRange("2026-09-01", "2026-09-15", fallback)).toEqual({
      from: "2026-09-01",
      to: "2026-09-15",
    });
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

  it("excludes pending from revenue but counts it separately", () => {
    const orders = [
      makeOrder({ id: "a", totalCents: 1000, status: "pending" }),
      makeOrder({ id: "b", totalCents: 2000, status: "paid" }),
    ];
    const data = getDashboardData(orders, {
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(data.kpis.revenueCents).toBe(2000);
    expect(data.kpis.orderCount).toBe(1);
    expect(data.kpis.pendingCount).toBe(1);
  });

  it("includes both boundary days and excludes orders outside the range", () => {
    const orders = [
      makeOrder({
        id: "before",
        createdAt: "2026-08-31T23:59:59.999Z",
        totalCents: 100,
      }),
      makeOrder({
        id: "start",
        createdAt: "2026-09-01T00:00:00.000Z",
        totalCents: 200,
      }),
      makeOrder({
        id: "end",
        createdAt: "2026-09-30T23:59:59.999Z",
        totalCents: 400,
      }),
      makeOrder({
        id: "after",
        createdAt: "2026-10-01T00:00:00.000Z",
        totalCents: 800,
      }),
    ];
    const data = getDashboardData(orders, {
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(data.kpis.revenueCents).toBe(600);
    expect(data.kpis.orderCount).toBe(2);
  });

  it("returns a zero-filled daily series", () => {
    const orders = [
      makeOrder({
        id: "a",
        createdAt: "2026-09-02T10:00:00.000Z",
        totalCents: 1000,
      }),
      makeOrder({
        id: "b",
        createdAt: "2026-09-04T10:00:00.000Z",
        totalCents: 2000,
      }),
    ];
    const data = getDashboardData(orders, {
      from: "2026-09-01",
      to: "2026-09-05",
    });
    expect(data.daily).toHaveLength(5);
    expect(data.daily.map((d) => d.revenueCents)).toEqual([
      0, 1000, 0, 2000, 0,
    ]);
    expect(data.daily.map((d) => d.orderCount)).toEqual([0, 1, 0, 1, 0]);
  });

  it("returns zeros, not NaN, when no orders qualify", () => {
    const orders = [makeOrder({ id: "a", status: "pending" })];
    const data = getDashboardData(orders, {
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(data.kpis.revenueCents).toBe(0);
    expect(data.kpis.orderCount).toBe(0);
    expect(data.kpis.avgOrderValueCents).toBe(0);
  });
});