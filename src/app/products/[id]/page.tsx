"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/products/${id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: Product = await response.json();
          setProduct(data);
        } catch (e: any) {
          console.error('Failed to fetch product:', e);
          setError(e.message || 'Failed to fetch product');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    if (!product) return;

    setAddingToCart(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert('상품이 장바구니에 추가되었습니다!');
    } catch (e: any) {
      console.error('Failed to add to cart:', e);
      alert(`장바구니 추가 실패: ${e.message || '알 수 없는 오류'}`);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || authLoading || !user) {
    return <div className="p-5 text-center">{loading || authLoading ? '로딩 중...' : '로그인이 필요합니다.'}</div>;
  }

  if (error) {
    return <div className="p-5 text-center text-red-500">오류: {error}</div>;
  }

  if (!product) {
    return <div className="p-5 text-center">상품을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="p-5 max-w-4xl mx-auto border border-gray-200 rounded-lg shadow-md bg-white">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">{product.name}</h1>
      <div className="flex justify-center mb-6">
        {product.image_url && isValidUrl(product.image_url) && (
          <Image
            src={product.image_url}
            alt={product.name}
            width={400}
            height={300}
            className="object-contain rounded-lg"
          />
        )}
      </div>
      <p className="text-lg leading-relaxed mb-6 text-gray-700">{product.description}</p>
      <p className="text-2xl font-bold text-right mb-6 text-gray-900">가격: {product.price.toLocaleString()}원</p>
      <p className="text-sm text-gray-500 text-right">등록일: {new Date(product.created_at).toLocaleDateString()}</p>
      <p className="text-sm text-gray-500 text-right">등록자 ID: {product.user_id.substring(0, 8)}...</p>
      <div className="text-center mt-8">
        <button
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-bold disabled:opacity-50"
        >
          {addingToCart ? '추가 중...' : '장바구니에 추가'}
        </button>
      </div>
    </div>
  );
}
