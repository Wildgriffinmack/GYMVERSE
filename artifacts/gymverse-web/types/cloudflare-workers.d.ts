// Minimal typings for the Cloudflare Workers runtime modules this site imports.
// The real module is provided by workerd at runtime (vinext externalizes it in production builds).
declare module "cloudflare:workers" {
  import type { WaitlistEnv } from "../lib/server/env";
  export const env: WaitlistEnv;
  export function waitUntil(promise: Promise<unknown>): void;
}

declare module "cloudflare:sockets" {
  import type { ConnectFn } from "../lib/server/env";
  export const connect: ConnectFn;
}
