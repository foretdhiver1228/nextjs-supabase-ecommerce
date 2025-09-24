"use client";

import { useState, useEffect } from 'react';
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

export default function ProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | string>('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchProducts = async () => {
    setError(null);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (e: any) {
      console.error('Failed to fetch products:', e);
      setError(e.message || 'Failed to fetch products');
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) {
      alert('상품 이름과 가격은 필수입니다.');
      return;
    }
    setFormLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProductName,
          description: newProductDescription,
          price: Number(newProductPrice),
          image_url: newProductImageUrl,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      setNewProductImageUrl('');
      fetchProducts(); // Refresh the list
    } catch (e: any) {
      console.error('Failed to add product:', e);
      setError(e.message || 'Failed to add product');
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  if (loading || !user) {
    return <div className="p-5 text-center">{loading ? '로딩 중...' : '로그인이 필요합니다.'}</div>;
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">상품 관리</h1>

      <div className="mb-10 border border-gray-200 p-6 rounded-lg shadow-sm bg-white">
        <h2 className="text-2xl font-semibold mb-5">새 상품 추가</h2>
        <form onSubmit={addProduct} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="상품 이름 (필수)"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            required
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="상품 설명"
            value={newProductDescription}
            onChange={(e) => setNewProductDescription(e.target.value)}
            rows={4}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          <input
            type="number"
            placeholder="가격 (필수)"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            required
            min="0"
            step="0.01"
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="이미지 URL (선택)"
            value={newProductImageUrl}
            onChange={(e) => setNewProductImageUrl(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={formLoading} className="p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {formLoading ? '추가 중...' : '상품 추가'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">오류: {error}</p>}
      </div>

      <h2 className="text-2xl font-semibold mb-5">등록된 상품</h2>
      {products.length === 0 && !formLoading && !error && <p className="text-gray-600">등록된 상품이 없습니다. 새 상품을 추가해보세요!</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border border-gray-200 p-4 rounded-lg shadow-sm bg-white">
            {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-md mb-3" />}
            <h3 className="text-lg font-semibold mb-2 text-gray-800">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
            <p className="text-md font-bold text-gray-900">가격: {product.price.toLocaleString()}원</p>
            <p className="text-xs text-gray-500 mt-2">등록자: {product.user_id.substring(0, 8)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}
