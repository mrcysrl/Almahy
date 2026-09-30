import "server-only";
import bcrypt from "bcryptjs";
import { users } from "@/lib/db/seed";
import type { User } from "@/types";

// Demo-only passwords for the assessment.
const DEMO_PASSWORDS: Record<string, string> = {
  "admin@example.com": "admin123",
  "support@example.com": "support123",
};

const hashes = new Map(
  Object.entries(DEMO_PASSWORDS).map(([email, pw]) => [
    email,
    bcrypt.hashSync(pw, 10),
  ]),
);
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const user = users.find((u) => u.email === email.toLowerCase());
  // Always run a compare so response time doesn't reveal whether the email exists
  const hash = (user && hashes.get(user.email)) ?? DUMMY_HASH;
  const ok = await bcrypt.compare(password, hash);
  return ok && user ? user : null;
}
