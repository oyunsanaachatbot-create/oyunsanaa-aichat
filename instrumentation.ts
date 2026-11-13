import type { Instrumentation } from "next";

export function register() {
  // OpenTelemetry disabled — no Vercel OTel configured
}

/**
 * Next.js calls this for every unhandled server error (route handlers,
 * server components, server actions). Writes the error + request context to
 * logs/app-YYYY-MM-DD.log so failures are visible beyond pm2's console dump.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const { logger, serializeError } = await import("@/lib/logger");
  await logger.error("unhandled_request_error", {
    error: serializeError(error),
    method: request.method,
    path: request.path,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
