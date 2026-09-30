import { NextRequest, NextResponse } from "next/server";

import { authorize } from "@/lib/auth/guard";
import { bulkApply } from "@/lib/orders/mutations";
import { bulkSchema } from "@/lib/orders/schemas";

export async function POST(request: NextRequest) {
  const auth = await authorize("admin");
  if (auth.response) return auth.response;

  const body: unknown = await request.json().catch(() => null);

  const parsed = bulkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  return NextResponse.json(bulkApply(parsed.data, auth.user));
}
