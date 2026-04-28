import { NextResponse } from 'next/server';

export type ErrorCode =
  | 'invalid_input'
  | 'rate_limit'
  | 'usage_exhausted'
  | 'auth_required'
  | 'premium_required'
  | 'server_error';

export function jsonError(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
