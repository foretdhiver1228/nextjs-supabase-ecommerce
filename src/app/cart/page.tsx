"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadTossPayments, TossPaymentsSDK } from "@tosspayments/tosspayments-sdk";

interface TossPaymentRequestOptions {
  method: string;
  amount: { value: number; currency: string; };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerName?: string;
  customerEmail?: string;
}

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
  };
}

// Helper function to validate URL
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e: unknown) {
    return false;
  }
};

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tossPayments, setTossPayments] = useState<TossPaymentsSDK | null>(null);
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("카드"); // Default to Card
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // 선택된 장바구니 항목 ID

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchTossPayments() {
      if (!clientKey) {
        console.error("Toss Client Key is not defined.");
        return;
      }
      try {
        const loadedTossPayments = await loadTossPayments(clientKey);
        setTossPayments(loadedTossPayments);
      } catch (e: unknown) {
        console.error("Error loading Toss Payments SDK:", e);
      }
    }
    fetchTossPayments();
  }, [clientKey]);

  const fetchCartItems = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CartItem[] = await response.json();
      setCartItems(data);
      setSelectedItems([]); // 장바구니 항목을 새로 가져올 때 선택된 항목 초기화
    } catch (e: unknown) {
      console.error('Failed to fetch cart items:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch cart items');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!tossPayments) {
      alert('결제 시스템 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (cartItems.length === 0) {
      alert('장바구니가 비어 있습니다.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const totalAmount = calculateTotalPrice();
      const orderName = cartItems.length > 1 ? `${cartItems[0].products.name} 외 ${cartItems.length - 1}개` : cartItems[0].products.name;

      const paymentOptions = {
        amount: { value: totalAmount, currency: "KRW" },
        orderId: `order-${Date.now()}-${user?.id}`,
        orderName: orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      };

      if (selectedPaymentMethod === "가상계좌") {
        if (!customerName) {
          alert("이름을 입력해주세요.");
          setCheckoutLoading(false);
          return;
        }
        paymentOptions.customerName = customerName;
        if (customerEmail) {
          paymentOptions.customerEmail = customerEmail;
        }
      }

      const paymentMethodMap: { [key: string]: string } = {
        "카드": "CARD",
        "계좌이체": "TRANSFER",
        "가상계좌": "VIRTUAL_ACCOUNT",
      };
      const tossMethod = paymentMethodMap[selectedPaymentMethod];

      if (!tossMethod) {
        alert('유효하지 않은 결제 수단입니다.');
        setCheckoutLoading(false);
        return;
      }

      const payment = tossPayments.payment({
        customerKey: user?.id, // Use user's Supabase ID as customerKey
      });

      await payment.requestPayment({
        method: tossMethod,
        ...paymentOptions,
      });

      // Payment success is handled by redirect to /payment/success
    } catch (e: unknown) {
      console.error('Checkout failed:', e);
      alert(`결제 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSelectItem = (itemId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    if (!confirm('선택된 항목을 장바구니에서 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cart/delete-selected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds: selectedItems }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert('선택된 항목이 삭제되었습니다.');
      fetchCartItems(); // 장바구니 목록 새로고침
    } catch (e: unknown) {
      console.error('Failed to delete selected items:', e);
      setError(e instanceof Error ? e.message : 'Failed to delete selected items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.products.price * item.quantity, 0);
  };

  const calculateTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading || authLoading || !user) {
    return <div className="p-5 text-center">{loading || authLoading ? '로딩 중...' : '로그인이 필요합니다.'}</div>;
  }

  if (error) {
    return <div className="p-5 text-center text-red-500">오류: {error}</div>;
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">장바구니</h1>

      {cartItems.length === 0 && !loading && !error && <p className="text-center text-gray-600">장바구니가 비어 있습니다.</p>}

      {cartItems.length > 0 && (
        <div className="mb-4 flex justify-between items-center">
          <p className="text-lg font-semibold">총 수량: {calculateTotalQuantity()}개</p>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedItems.length === 0 || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            선택 상품 삭제
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-8">
        {cartItems.map((item) => (
          <div key={item.id} className="border border-gray-200 p-4 rounded-lg shadow-sm bg-white flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedItems.includes(item.id)}
              onChange={(e) => handleSelectItem(item.id, e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            {item.products.image_url && isValidUrl(item.products.image_url) ? (
              <Image
                src={item.products.image_url}
                alt={item.products.name}
                width={80}
                height={80}
                className="object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-md text-gray-500 text-xs flex-shrink-0">
                이미지 없음
              </div>
            )}
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-800">{item.products.name}</h3>
              <p className="text-sm text-gray-600">수량: {item.quantity}</p>
              <p className="text-md font-bold text-gray-900">가격: {(item.products.price * item.quantity).toLocaleString()}원</p>
            </div>
          </div>
        ))}
      </div>

      {cartItems.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">결제 수단 선택</h2>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="카드"
                  checked={selectedPaymentMethod === "카드"}
                  onChange={() => setSelectedPaymentMethod("카드")}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">카드</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="계좌이체"
                  checked={selectedPaymentMethod === "계좌이체"}
                  onChange={() => setSelectedPaymentMethod("계좌이체")}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">계좌이체</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="가상계좌"
                  checked={selectedPaymentMethod === "가상계좌"}
                  onChange={() => setSelectedPaymentMethod("가상계좌")}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">무통장입금 (가상계좌)</span>
              </label>
            </div>
          </div>

          {selectedPaymentMethod === "가상계좌" && (
            <div className="mb-6 flex flex-col gap-3">
              <input
                type="text"
                placeholder="이름 (필수)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="이메일 (선택)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="text-right">
            <h2 className="text-xl font-bold mb-4 text-gray-800">총 가격: {calculateTotalPrice().toLocaleString()}원</h2>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || cartItems.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-bold disabled:opacity-50"
            >
              {checkoutLoading ? '결제 중...' : '결제하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}