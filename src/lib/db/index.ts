import type { Order, OrderEvent } from "@/types";
import { generateSeed } from "./seed";

type Db = { orders: Order[]; events: OrderEvent[] };

const globalForDb = globalThis as unknown as { __db?: Db };

export const db: Db = (globalForDb.__db ??= generateSeed());
