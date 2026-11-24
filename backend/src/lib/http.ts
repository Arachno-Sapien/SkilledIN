import type { NextFunction, Request, RequestHandler, Response } from "express";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "AREA_NOT_FOUND"
  | "NOT_FOUND"
  | "CONFLICT"
  | "EXPIRED"
  | "AI_FAILED"
  | "VIDEO_MISSING"
  | "INTERNAL";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export function sendJson<T>(res: Response, status: number, data: T): void {
  res.status(status).json(data);
}

export function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string
): void {
  res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

/**
 * Express 4 ignores a rejected promise from an async handler, so a DynamoDB or S3 error left the
 * request hanging until the Lambda timed out. ah() hands the rejection to errorHandler instead.
 */
// Express 4 named params ("/:id") are always strings; the v5 typings also allow string[] for wildcards we don't use.
type Params = Record<string, string>;
export function ah(
  fn: (req: Request<Params>, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler<Params> {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Registered last in handler.ts: every thrown or rejected route error becomes JSON the client can show. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const e = err as { message?: string; status?: number; statusCode?: number };
  // Path and message only: request bodies hold phone numbers and audio.
  console.error(JSON.stringify({ level: "error", msg: "route_error", path: req.path, error: e?.message }));
  if (res.headersSent) return;
  // express.json() errors (malformed JSON, body too large) carry a 4xx status: the client's fault, not ours.
  const status = e?.status ?? e?.statusCode;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return sendError(res, status, "BAD_REQUEST", "Invalid request body");
  }
  sendError(res, 500, "INTERNAL", "Something went wrong. Please try again.");
}

export function setCorsHeaders(res: Response, origin?: string): void {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
