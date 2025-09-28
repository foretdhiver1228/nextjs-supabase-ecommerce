import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST 요청을 처리하여 장바구니에서 선택된 항목들을 삭제합니다.
 * @param request - 클라이언트로부터의 HTTP 요청 객체 (body에 itemIds 배열 포함)
 * @returns 삭제 성공 메시지 또는 오류 메시지
 */
export async function POST(request: Request) {
  try {
    // 요청 본문에서 삭제할 장바구니 항목 ID 배열을 추출합니다.
    const { itemIds } = await request.json();

    // itemIds가 배열이 아니거나 비어 있으면 400 Bad Request 응답을 반환합니다.
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty itemIds array' }, { status: 400 });
    }

    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name, options);
          },
        },
      }
    );

    // 현재 로그인된 사용자 정보를 가져옵니다.
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // 사용자 정보를 가져오는 데 실패했거나 로그인되지 않은 경우 401 Unauthorized 응답을 반환합니다.
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 'cart_items' 테이블에서 제공된 itemIds에 해당하는 항목들을 삭제합니다.
    // 현재 로그인된 사용자의 장바구니 항목만 삭제하도록 user_id로 필터링합니다.
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .in('id', itemIds)
      .eq('user_id', user.id);

    // 삭제 중 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    if (error) {
      console.error('Error deleting cart items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 성공적으로 항목들을 삭제한 경우 메시지를 반환합니다.
    return NextResponse.json({ message: 'Selected cart items deleted successfully' }, { status: 200 });

  } catch (e: unknown) {
    // 예상치 못한 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    console.error('Unexpected error in /api/cart/delete-selected:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}