import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const supabase = createServerClient();

    const { data: product, error } = await supabase.from('products').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (e) {
    console.error('Unexpected error in GET /api/products/[id]:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
