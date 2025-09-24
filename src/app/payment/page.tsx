"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useEffect, useState } from "react";

export default function PaymentPage() {
  const [tossPayments, setTossPayments] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

  useEffect(() => {
    async function fetchTossPayments() {
      if (!clientKey) {
        console.error("Toss Client Key is not defined.");
        return;
      }
      try {
        const loadedTossPayments = await loadTossPayments(clientKey);
        setTossPayments(loadedTossPayments);
      } catch (error) {
        console.error("Error loading Toss Payments SDK:", error);
      }
    }
    fetchTossPayments();
  }, [clientKey]);

  const requestPayment = async () => {
    if (!tossPayments) {
      console.error("Toss Payments SDK not loaded yet.");
      return;
    }

    try {
      const payment = tossPayments.payment({
        customerKey: "ANONYMOUS", // 또는 사용자 고유의 customerKey
      });

      const paymentOptions: any = {
        amount: { value: 100000, currency: "KRW" },
        orderId: `order-${Date.now()}`,
        orderName: "Example Product",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      };

      if (paymentMethod === "CARD") {
        paymentOptions.method = "CARD";
      } else if (paymentMethod === "VIRTUAL_ACCOUNT") {
        if (!customerName) {
          alert("이름을 입력해주세요.");
          return;
        }
        paymentOptions.method = "VIRTUAL_ACCOUNT";
        paymentOptions.customerName = customerName;
        if (customerEmail) {
          paymentOptions.customerEmail = customerEmail;
        }
      }

      await payment.requestPayment(paymentOptions);
    } catch (error) {
      console.error("Payment request failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>토스페이먼츠 결제 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>
          <input
            type="radio"
            value="CARD"
            checked={paymentMethod === "CARD"}
            onChange={() => setPaymentMethod("CARD")}
          />
          카드 결제
        </label>
        <label>
          <input
            type="radio"
            value="VIRTUAL_ACCOUNT"
            checked={paymentMethod === "VIRTUAL_ACCOUNT"}
            onChange={() => setPaymentMethod("VIRTUAL_ACCOUNT")}
          />
          무통장 입금
        </label>
      </div>

      {paymentMethod === "VIRTUAL_ACCOUNT" && (
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="이름 (필수)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{ padding: "8px", marginRight: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          <input
            type="email"
            placeholder="이메일 (선택)"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>
      )}

      <button
        onClick={requestPayment}
        disabled={!tossPayments}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        토스페이먼츠로 100,000원 결제하기
      </button>
    </div>
  );
}
