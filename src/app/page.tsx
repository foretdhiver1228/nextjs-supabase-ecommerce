"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getClientComponentClient } from "@/lib/supabase/client";
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  user_id: string;
  created_at: string;
}

// Helper function to validate URL
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export default function Home() {
  const { user, loading } = useAuth();
  const supabase = getClientComponentClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (e: any) {
      console.error('Failed to fetch products:', e);
      setProductsError(e.message || 'Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>로딩 중...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center justify-center gap-8 w-full max-w-4xl">
        {user ? (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">환영합니다, {user.email}님!</h2>
          </div>
        ) : (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">로그인이 필요합니다.</h2>
            <Link href="/login">
              <button
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                로그인 / 회원가입
              </button>
            </Link>
          </div>
        )}

        <h2 className="text-3xl font-bold mb-6 text-center w-full">상품 목록</h2>
        {productsLoading && <p className="text-center text-gray-600">상품 로딩 중...</p>}
        {productsError && <p className="text-red-500 text-center">오류: {productsError}</p>}
        {products.length === 0 && !productsLoading && !productsError && <p className="text-center text-gray-600">등록된 상품이 없습니다.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {products.map((product) => (
            <Link href={`/products/${product.id}`} key={product.id} className="block no-underline text-inherit">
              <div className="border border-gray-200 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white">
                {product.image_url && isValidUrl(product.image_url) ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-md mb-3" />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-md mb-3 text-gray-500 text-sm">
                    이미지 없음
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-1 text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                <p className="text-md font-bold text-gray-900">가격: {product.price.toLocaleString()}원</p>
                <p className="text-xs text-gray-500 mt-2">등록자: {product.user_id.substring(0, 8)}...</p>
              </div>
            </Link>
          ))}
        </div>


      </main>
      <footer className="mt-10 text-center text-gray-500 text-sm">
        <p>&copy; 2025 My Shop. All rights reserved.</p>
      </footer>
    </div>
  );
}
