import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          description,
          price,
          image_url
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching cart items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(cartItems);
  } catch (e) {
    console.error('Unexpected error in GET /api/cart:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id, quantity = 1 } = await request.json();

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if item already exists in cart for this user
    const { data: existingCartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing cart item:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let newCartItem;
    if (existingCartItem) {
      // Update quantity if item already exists
      const { data, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingCartItem.quantity + quantity })
        .eq('id', existingCartItem.id)
        .select();
      if (updateError) {
        console.error('Error updating cart item quantity:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      newCartItem = data[0];
    } else {
      // Insert new item
      const { data, error: insertError } = await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id, quantity })
        .select();
      if (insertError) {
        console.error('Error adding item to cart:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      newCartItem = data[0];
    }

    return NextResponse.json(newCartItem, { status: 201 });
  } catch (e) {
    console.error('Unexpected error in POST /api/cart:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}