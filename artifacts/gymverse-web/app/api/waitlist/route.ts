import { env, waitUntil } from "cloudflare:workers";
import { handleWaitlistPost } from "@/lib/server/handler";

/** Waitlist and founding-coach signups. Storage: Cloudflare D1 (DB binding). */
export async function POST(request: Request): Promise<Response> {
  return handleWaitlistPost(request, env, waitUntil);
}
