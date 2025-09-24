"use client";

import { useSearchParams } from 'next/navigation';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '결제에 실패했습니다.';
  const code = searchParams.get('code');

  return (
    <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
      <h1>결제 실패</h1>
      <p>{message}</p>
      {code && <p>오류 코드: {code}</p>}
      <p>다시 시도해 주세요.</p>
    </div>
  );
}
