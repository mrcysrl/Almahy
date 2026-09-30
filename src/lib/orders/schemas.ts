import { z } from "zod";
import { ORDER_STATUSES } from "./query";

const itemSchema = z.object({
  productName: z.string().trim().min(1).max(100),
  quantity: z.number().int().min(1).max(999),
  unitPriceCents: z.number().int().min(1).max(10_000_000),
});

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(100),
  customerEmail: z.string().trim().email(),
  shippingAddress: z.string().trim().min(5).max(200),
  notes: z.string().trim().max(500).optional(),
  items: z.array(itemSchema).min(1).max(20),
});

export const updateOrderSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    customerName: z.string().trim().min(1).max(100),
    customerEmail: z.string().trim().email(),
    shippingAddress: z.string().trim().min(5).max(200),
    notes: z.string().trim().max(500),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

const idList = z.array(z.string().min(1)).min(1).max(50);

export const bulkSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("delete"), ids: idList }),
  z.object({
    action: z.literal("set_status"),
    ids: idList,
    status: z.enum(ORDER_STATUSES),
  }),
]);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type BulkInput = z.infer<typeof bulkSchema>;
