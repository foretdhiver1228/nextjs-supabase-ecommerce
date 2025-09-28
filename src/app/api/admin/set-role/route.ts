import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Next.js의 동적 렌더링을 강제합니다. (캐싱 방지)
export const dynamic = 'force-dynamic';

/**
 * POST 요청을 처리하여 특정 사용자의 역할을 업데이트합니다.
 * 이 API는 관리자 권한을 가진 사용자만 호출할 수 있습니다.
 * @param request - 클라이언트로부터의 HTTP 요청 객체
 * @returns 업데이트된 사용자 정보 또는 오류 메시지
 */
export async function POST(request: Request) {
  try {
    // 요청 본문에서 userId와 role을 추출합니다.
    const { userId, role } = await request.json();

    // userId 또는 role이 누락된 경우 400 Bad Request 응답을 반환합니다.
    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // 1. 요청을 보낸 사용자가 관리자인지 인증 및 확인합니다.
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => cookieStore.set(name, value, options),
          remove: (name: string, options: any) => cookieStore.delete(name, options),
        },
      }
    );

    // 현재 로그인된 사용자 정보를 가져옵니다.
    const { data: { user: requester }, error: requesterError } = await supabase.auth.getUser();

    // 사용자 정보를 가져오는 데 실패했거나 로그인되지 않은 경우 401 Unauthorized 응답을 반환합니다.
    if (requesterError || !requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청을 보낸 사용자의 app_metadata에서 역할을 확인하여 관리자인지 검증합니다。
    // app_metadata.roles에 'admin'이 포함되어 있지 않으면 403 Forbidden 응답을 반환합니다。
    if (!requester.app_metadata.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden: Only administrators can set user roles' }, { status: 403 });
    }

    // 2. Supabase Admin 작업을 위한 클라이언트를 생성합니다.
    // SERVICE_ROLE_KEY는 매우 강력한 권한을 가지므로 서버 측에서만 사용해야 합니다.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase URL or Service Role Key is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 서비스 역할 키를 사용하여 Supabase 클라이언트를 생성합니다.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. 대상 사용자의 app_metadata를 업데이트합니다.
    // app_metadata의 'roles' 배열에 지정된 역할을 추가합니다.
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { roles: [role] },
      }
    );

    if (error) {
      console.error('Error updating user metadata:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 성공적으로 역할을 업데이트한 경우 메시지와 함께 업데이트된 사용자 정보를 반환합니다.
    return NextResponse.json({ message: `User ${userId} role set to ${role} in app_metadata`, user: data.user });

  } catch (e: unknown) {
    // 예상치 못한 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    console.error('Unexpected error in /api/admin/set-role:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}