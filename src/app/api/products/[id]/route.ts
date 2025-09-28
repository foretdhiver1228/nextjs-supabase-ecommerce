import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET 요청을 처리하여 특정 ID의 상품 정보를 가져옵니다.
 * @param request - 클라이언트로부터의 HTTP 요청 객체
 * @param params - URL 파라미터 (id 포함)
 * @returns 상품 정보 또는 오류 메시지
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
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

    // 'products' 테이블에서 ID에 해당하는 상품을 조회합니다.
    const { data: product, error } = await supabase.from('products').select('*').eq('id', id).single();

    // 상품 조회 중 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    if (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 상품을 찾을 수 없는 경우 404 Not Found 응답을 반환합니다.
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 성공적으로 상품 정보를 가져온 경우 JSON 형태로 반환합니다.
    return NextResponse.json(product);
  } catch (e: unknown) {
    // 예상치 못한 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    console.error('Unexpected error in GET /api/products/[id]:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE 요청을 처리하여 특정 ID의 상품을 삭제합니다.
 * 이 API는 관리자 권한을 가진 사용자만 호출할 수 있습니다.
 * @param request - 클라이언트로부터의 HTTP 요청 객체
 * @param params - URL 파라미터 (id 포함)
 * @returns 삭제 성공 메시지 또는 오류 메시지
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // 사용자 정보를 가져오는 데 실패했거나 로그인되지 않은 경우 401 Unauthorized 응답을 반환합니다.
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청을 보낸 사용자의 app_metadata에서 역할을 확인하여 관리자인지 검증합니다.
    // app_metadata.roles에 'admin'이 포함되어 있지 않으면 403 Forbidden 응답을 반환합니다.
    if (!user.app_metadata.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden: Only administrators can delete products' }, { status: 403 });
    }

    // 'products' 테이블에서 ID에 해당하는 상품을 삭제합니다.
    const { error } = await supabase.from('products').delete().eq('id', id);

    // 상품 삭제 중 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 성공적으로 상품을 삭제한 경우 메시지를 반환합니다.
    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (e: unknown) {
    // 예상치 못한 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    console.error('Unexpected error in DELETE /api/products/[id]:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}