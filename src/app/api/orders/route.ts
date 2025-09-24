import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient(cookies());
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total_amount,
        status,
        payment_method,
        order_name,
        order_items (
          id,
          quantity,
          price_at_purchase,
          products (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(orders);
  } catch (e) {
    console.error('Unexpected error in GET /api/orders:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient(cookies());
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cartItems, totalAmount, paymentMethod, orderName, paymentKey } = await request.json();

    if (!cartItems || cartItems.length === 0 || !totalAmount || !paymentMethod || !orderName || !paymentKey) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    // 1. Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'completed', // Assuming payment is already confirmed
        payment_method: paymentMethod,
        order_name: orderName,
        payment_key: paymentKey,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 2. Create order items
    const orderItemsToInsert = cartItems.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.products.id,
      quantity: item.quantity,
      price_at_purchase: item.products.price,
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      return NextResponse.json({ error: orderItemsError.message }, { status: 500 });
    }

    // 3. Clear the cart (already handled by /api/cart/clear, but can be done here too if needed)
    // This API route will be called after cart is cleared on client side

    return NextResponse.json({ message: 'Order created successfully', order: orderData }, { status: 201 });
  } catch (e) {
    console.error('Unexpected error in POST /api/orders:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
