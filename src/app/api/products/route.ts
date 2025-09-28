import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Next.js의 동적 렌더링을 강제합니다. (캐싱 방지)
export const dynamic = 'force-dynamic';

/**
 * GET 요청을 처리하여 모든 상품 목록을 가져옵니다.
 * @param request - 클라이언트로부터의 HTTP 요청 객체
 * @returns 상품 목록 또는 오류 메시지
 */
export async function GET(request: Request) {
  try {
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

    // 'products' 테이블에서 모든 상품을 조회합니다.
    const { data: products, error } = await supabase.from('products').select('*');

    // 상품 조회 중 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 성공적으로 상품 목록을 가져온 경우 JSON 형태로 반환합니다.
    return NextResponse.json(products);
  } catch (e: unknown) {
    // 예상치 못한 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    console.error('Unexpected error in GET /api/products:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST 요청을 처리하여 새로운 상품을 추가합니다.
 * 이 API는 관리자 권한을 가진 사용자만 호출할 수 있습니다.
 * @param request - 클라이언트로부터의 HTTP 요청 객체
 * @returns 새로 추가된 상품 정보 또는 오류 메시지
 */
export async function POST(request: Request) {
  try {
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
      return NextResponse.json({ error: 'Forbidden: Only administrators can add products' }, { status: 403 });
    }

    // 요청 본문에서 상품 정보를 추출합니다.
    const { name, description, price, image_url } = await request.json();

    // 상품 이름 또는 가격이 누락된 경우 400 Bad Request 응답을 반환합니다.
    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    // 'products' 테이블에 새로운 상품을 삽입합니다.
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price,
        image_url,
        user_id: user.id, // 상품을 등록한 사용자 ID를 기록합니다.
      })
      .select(); // 삽입된 데이터를 반환받습니다.

    // 상품 삽입 중 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다.
    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 성공적으로 상품을 추가한 경우 새로 추가된 상품 정보를 반환합니다.
    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (e: unknown) {
    // 예상치 못한 오류가 발생한 경우 500 Internal Server Error 응답을 반환합니다。
    console.error('Unexpected error in POST /api/products:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}