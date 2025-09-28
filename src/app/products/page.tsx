"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Product 인터페이스 정의: 상품 객체의 구조를 명시합니다.
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  user_id: string;
  created_at: string;
}

// URL 유효성을 검사하는 헬퍼 함수입니다.
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 상품 목록을 표시하고 관리자에게는 상품 추가 폼을 제공하는 페이지 컴포넌트입니다.
 * @returns 상품 페이지 UI
 */
export default function ProductsPage() {
  // useAuth 훅을 사용하여 사용자 인증 상태와 로딩 상태를 가져옵니다.
  const { user, loading } = useAuth();
  // Next.js 라우터 훅을 사용하여 페이지 이동을 처리합니다.
  const router = useRouter();

  // 상품 목록 상태
  const [products, setProducts] = useState<Product[]>([]);
  // 새 상품 추가 폼의 입력 필드 상태
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | string>('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  // 폼 제출 로딩 상태
  const [formLoading, setFormLoading] = useState(false);
  // 오류 메시지 상태
  const [error, setError] = useState<string | null>(null);

  // 사용자 인증 상태 변경 시 로그인 여부를 확인하고 리다이렉트합니다.
  useEffect(() => {
    // 로딩 중이 아니고, 사용자가 로그인되어 있지 않으면 로그인 페이지로 이동합니다.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]); // user, loading, router가 변경될 때마다 실행됩니다.

  /**
   * API를 호출하여 상품 목록을 가져오는 비동기 함수입니다.
   */
  const fetchProducts = async () => {
    setError(null);
    try {
      // /api/products 엔드포인트로 GET 요청을 보냅니다.
      const response = await fetch('/api/products');
      // 응답이 성공적이지 않으면 오류를 발생시킵니다.
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // 응답 데이터를 JSON 형태로 파싱하여 상품 목록 상태를 업데이트합니다.
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (e: unknown) {
      // 상품 가져오기 중 오류 발생 시 콘솔에 기록하고 오류 메시지 상태를 업데이트합니다.
      console.error('Failed to fetch products:', e);
      // 오류 객체가 Error 인스턴스인지 확인하여 메시지를 가져옵니다.
      setError(e instanceof Error ? e.message : 'Failed to fetch products');
    }
  };

  /**
   * 새 상품을 추가하는 비동기 함수입니다.
   * @param e - 폼 제출 이벤트 객체
   */
  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼 기본 제출 동작을 방지합니다.
    // 상품 이름 또는 가격이 입력되지 않았으면 경고 메시지를 표시합니다.
    if (!newProductName.trim() || !newProductPrice) {
      alert('상품 이름과 가격은 필수입니다.');
      return;
    }
    setFormLoading(true); // 폼 제출 로딩 상태를 활성화합니다.
    setError(null); // 기존 오류 메시지를 초기화합니다.
    try {
      // /api/products 엔드포인트로 POST 요청을 보냅니다.
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 입력된 상품 정보를 JSON 형태로 요청 본문에 담아 보냅니다.
        body: JSON.stringify({
          name: newProductName,
          description: newProductDescription,
          price: Number(newProductPrice),
          image_url: newProductImageUrl,
        }),
      });
      // 응답이 성공적이지 않으면 오류를 발생시킵니다.
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // 상품 추가 성공 시 입력 필드를 초기화합니다.
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      setNewProductImageUrl('');
      fetchProducts(); // 상품 목록을 새로고침합니다.
    } catch (e: unknown) {
      // 상품 추가 중 오류 발생 시 콘솔에 기록하고 오류 메시지 상태를 업데이트합니다.
      console.error('Failed to add product:', e);
      // 오류 객체가 Error 인스턴스인지 확인하여 메시지를 가져옵니다.
      setError(e instanceof Error ? e.message : 'Failed to add product');
    }
    finally {
      setFormLoading(false); // 폼 제출 로딩 상태를 비활성화합니다.
    }
  };

  /**
   * 상품을 삭제하는 비동기 함수입니다.
   * @param productId - 삭제할 상품의 ID
   */
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${productId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert('상품이 성공적으로 삭제되었습니다.');
      fetchProducts(); // 상품 목록 새로고침
    } catch (e: unknown) {
      console.error('Failed to delete product:', e);
      setError(e instanceof Error ? e.message : 'Failed to delete product');
    } finally {
      setFormLoading(false);
    }
  };

  // user 객체가 변경될 때마다 상품 목록을 가져옵니다.
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]); // user가 변경될 때마다 실행됩니다.

  // 로딩 중이거나 사용자가 로그인되어 있지 않으면 로딩 메시지 또는 로그인 필요 메시지를 표시합니다.
  if (loading || !user) {
    return <div className="p-5 text-center">{loading ? '로딩 중...' : '로그인이 필요합니다.'}</div>;
  }

  // 사용자의 app_metadata에서 'admin' 역할이 있는지 확인합니다.
  const isAdmin = user?.app_metadata?.roles?.includes('admin');

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">상품 관리</h1>

      {/* 관리자에게만 상품 추가 폼을 렌더링합니다. */}
      {isAdmin && (
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
      )}

      <h2 className="text-2xl font-semibold mb-5">등록된 상품</h2>
      {products.length === 0 && !formLoading && !error && <p className="text-gray-600">등록된 상품이 없습니다. 새 상품을 추가해보세요!</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link href={`/products/${product.id}`} key={product.id} className="block no-underline text-inherit">
            <div className="border border-gray-200 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white">
              {/* 상품 이미지를 조건부로 렌더링합니다. 유효한 URL이 없으면 플레이스홀더를 표시합니다. */}
              {product.image_url && isValidUrl(product.image_url) ? (
                <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-md mb-3" />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-md mb-3 text-gray-500 text-sm">
                  이미지 없음
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              <p className="text-md font-bold text-gray-900">가격: {product.price.toLocaleString()}원</p>
              <p className="text-xs text-gray-500 mt-2">등록자: {product.user_id.substring(0, 8)}...</p>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault(); // Link 이동 방지
                    handleDeleteProduct(product.id);
                  }}
                  className="mt-3 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  삭제
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
