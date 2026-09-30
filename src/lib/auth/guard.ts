import "server-only";
import { NextResponse } from "next/server";
import type { Role, User } from "@/types";
import { getSession } from "./session";

type Guard =
  | { user: User; response?: never }
  | { user?: never; response: NextResponse };

export async function authorize(...allowed: Role[]): Promise<Guard> {
  const user = await getSession();
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 },
      ),
    };
  }
  if (allowed.length > 0 && !allowed.includes(user.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user };
}
