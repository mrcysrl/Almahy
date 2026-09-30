import { z } from "zod";
import { ORDER_STATUSES } from "./query";

/* ---------- create order (shared by the form and POST /api/orders) ---------- */

const itemSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required").max(100),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity is too high"),
  unitPriceCents: z
    .number()
    .int()
    .min(1, "Enter a price above 0, e.g. 12.50")
    .max(10_000_000, "Price is too high"),
});

const customerShape = {
  customerName: z.string().trim().min(1, "Name is required").max(100),
  customerEmail: z.string().trim().email("Enter a valid email"),
  notes: z.string().trim().max(500, "Notes are too long").optional(),
};

const detailsShape = {
  shippingAddress: z.string().trim().min(5, "Address is too short").max(200),
  isGift: z.boolean(),
  giftMessage: z.string().trim().max(200, "Gift message is too long").optional(),
  items: z
    .array(itemSchema)
    .min(1, "Add at least one item")
    .max(20, "Maximum 20 items"),
};

// Conditional rule: a gift order needs a message
const giftCheck = (v: { isGift: boolean; giftMessage?: string }) =>
  !v.isGift || (v.giftMessage ?? "").length > 0;
const giftIssue = { message: "Add a gift message", path: ["giftMessage"] };

export const customerStepSchema = z.object(customerShape);
export const detailsStepSchema = z.object(detailsShape).refine(giftCheck, giftIssue);
export const createOrderSchema = z
  .object({ ...customerShape, ...detailsShape })
  .refine(giftCheck, giftIssue);

/* ---------- edit order ---------- */

const customerFields = {
  customerName: z.string().trim().min(1, "Name is required").max(100),
  customerEmail: z.string().trim().email("Enter a valid email"),
  shippingAddress: z.string().trim().min(5, "Address is too short").max(200),
  notes: z.string().trim().max(500, "Notes are too long"),
};

export const customerEditSchema = z.object(customerFields);

export const updateOrderSchema = z
  .object({ status: z.enum(ORDER_STATUSES), ...customerFields })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

/* ---------- bulk ---------- */

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