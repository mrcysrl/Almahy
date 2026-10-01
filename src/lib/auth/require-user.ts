import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@/types";
import { getSession } from "./session";

export async function requireUser(): Promise<User> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}