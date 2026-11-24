import type { Response } from "express";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "AREA_NOT_FOUND"
  | "NOT_FOUND"
  | "CONFLICT"
  | "EXPIRED"
  | "AI_FAILED"
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

export function setCorsHeaders(res: Response, origin?: string): void {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
