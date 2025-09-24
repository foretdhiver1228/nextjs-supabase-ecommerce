import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { paymentKey, orderId, amount } = await req.json();

  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json({ message: 'Toss Secret Key is not defined.' }, { status: 500 });
  }

  const encodedSecretKey = Buffer.from(`${secretKey}:`).toString('base64');

  try {
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Payment confirmation failed:', data);
      return NextResponse.json({ message: data.message || 'Payment confirmation failed' }, { status: response.status });
    }

    // Payment confirmed successfully
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
