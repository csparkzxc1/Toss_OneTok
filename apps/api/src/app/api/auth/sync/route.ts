import { NextResponse } from 'next/server';
import { AuthSyncRequestSchema } from '@hanjul-tok/shared';
import { jsonError } from '@/lib/http.js';
import { getSupabaseAdmin } from '@/lib/supabase.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_input', '잘못된 요청입니다.', 400);
  }
  const parsed = AuthSyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_input', '입력값이 올바르지 않습니다.', 400);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .upsert({ toss_user_key: parsed.data.tossUserKey }, { onConflict: 'toss_user_key' })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[auth.sync]', error);
    return jsonError('server_error', '사용자 동기화 실패', 500);
  }

  return NextResponse.json({ userId: data.id });
}
