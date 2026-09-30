export type Role = "admin" | "support";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
};

export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  items: OrderItem[];
  totalCents: number;
  shippingAddress: string;
  notes?: string;
  giftMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type FieldChange = {
  field: string;
  from: string;
  to: string;
};

type OrderEventBase = {
  id: string;
  orderId: string;
  actorId: string;
  actorName: string;
  createdAt: string;
};

export type OrderEvent = OrderEventBase &
  (
    | { type: "created" }
    | { type: "status_changed"; from: OrderStatus; to: OrderStatus }
    | { type: "edited"; changes: FieldChange[] }
    | { type: "note_added"; note: string }
  );
