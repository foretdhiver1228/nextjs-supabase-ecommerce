"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  order_name: string;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (e: any) {
      console.error('Failed to fetch orders:', e);
      setError(e.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (loading || authLoading || !user) {
    return <div className="p-5 text-center">{loading || authLoading ? '로딩 중...' : '로그인이 필요합니다.'}</div>;
  }

  if (error) {
    return <div className="p-5 text-center text-red-500">오류: {error}</div>;
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">내 주문 내역</h1>

      {orders.length === 0 && !loading && !error && <p className="text-center text-gray-600">주문 내역이 없습니다.</p>}

      <div className="grid grid-cols-1 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-200 p-6 rounded-lg shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">주문 번호: {order.id.substring(0, 8)}...</h2>
              <span className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">총 금액: {order.total_amount.toLocaleString()}원</p>
            <p className="text-sm text-gray-700 mb-4">결제 수단: {order.payment_method}</p>

            <h3 className="text-lg font-semibold mb-3">주문 상품</h3>
            <div className="grid grid-cols-1 gap-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-t border-gray-100 pt-4">
                  {item.products.image_url && (
                    <Image
                      src={item.products.image_url}
                      alt={item.products.name}
                      width={60}
                      height={60}
                      className="object-cover rounded-md"
                    />
                  )}
                  <div>
                    <Link href={`/products/${item.products.id}`} className="text-md font-medium text-blue-600 hover:underline">
                      {item.products.name}
                    </Link>
                    <p className="text-sm text-gray-600">수량: {item.quantity}개</p>
                    <p className="text-sm text-gray-600">개당 가격: {item.price_at_purchase.toLocaleString()}원</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
