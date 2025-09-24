"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (paymentKey && orderId && amount) {
      // Call your backend API to confirm the payment
      fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.success) {
            console.log('Payment confirmed successfully:', data);

            // Fetch cart items before clearing to create the order
            const cartResponse = await fetch('/api/cart');
            const cartItems = await cartResponse.json();
            const totalAmount = parseFloat(searchParams.get('amount') || '0'); // Get total amount from search params
            const orderName = cartItems.length > 1 ? `${cartItems[0].products.name} 외 ${cartItems.length - 1}개` : cartItems[0].products.name;
            const paymentMethod = data.data.method;
            const paymentKey = data.data.paymentKey;

            console.log('Order details for API:', { cartItems, totalAmount, paymentMethod, orderName, paymentKey });

            // Create the order
            const orderResponse = await fetch('/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ cartItems, totalAmount, paymentMethod, orderName, paymentKey }),
            });
            if (!orderResponse.ok) {
              throw new Error(`Order creation failed: ${orderResponse.status}`);
            }
            console.log('Order created successfully.');

            // Clear the cart after successful order creation
            await fetch('/api/cart/clear', {
              method: 'DELETE',
            });
            console.log('Cart cleared successfully.');

            // Display success message or redirect
            document.getElementById('payment-status').innerText = '결제가 성공적으로 완료되었습니다!';
            document.getElementById('loading-message').style.display = 'none';
            document.getElementById('success-details').style.display = 'block';
          } else {
            console.error('Payment confirmation failed:', data);
            document.getElementById('payment-status').innerText = '결제 확인에 실패했습니다.';
            document.getElementById('loading-message').style.display = 'none';
            document.getElementById('success-details').style.display = 'none';
            router.push(`/payment/fail?message=${data.message || 'Payment confirmation failed'}`);
          }
        })
        .catch((error) => {
          console.error('Error during payment confirmation:', error);
          document.getElementById('payment-status').innerText = '결제 확인 중 오류가 발생했습니다.';
          document.getElementById('loading-message').style.display = 'none';
          document.getElementById('success-details').style.display = 'none';
          router.push(`/payment/fail?message=Error during payment confirmation`);
        });
    } else {
      console.error('Missing payment parameters.');
      document.getElementById('payment-status').innerText = '필수 결제 파라미터가 누락되었습니다.';
      document.getElementById('loading-message').style.display = 'none';
      document.getElementById('success-details').style.display = 'none';
      router.push(`/payment/fail?message=Missing payment parameters`);
    }
  }, [searchParams, router]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1 id="payment-status">결제 성공 처리 중...</h1>
      <p id="loading-message">잠시만 기다려 주세요.</p>
      <div id="success-details" style={{ display: "none" }}>
        <p>주문 번호: {searchParams.get('orderId')}</p>
        <p>결제 금액: {searchParams.get('amount')}</p>
        <p>이용해 주셔서 감사합니다!</p>
        <button onClick={() => router.push('/')} style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          marginTop: "20px"
        }}>메인으로 돌아가기</button>
      </div>
    </div>
  );
}
