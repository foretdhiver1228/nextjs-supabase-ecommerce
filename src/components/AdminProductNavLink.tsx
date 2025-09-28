"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/**
 * 관리자 권한이 있는 사용자에게만 상품 링크를 표시하는 클라이언트 컴포넌트입니다.
 * @returns 관리자에게만 보이는 상품 링크 또는 null
 */
export default function AdminProductNavLink() {
  // useAuth 훅을 사용하여 사용자 인증 상태와 로딩 상태를 가져옵니다.
  const { user, loading } = useAuth();

  // 로딩 중일 때는 아무것도 렌더링하지 않습니다.
  if (loading) {
    return null; // 또는 로딩 스피너를 표시할 수 있습니다.
  }

  // 사용자의 app_metadata에서 'roles' 배열에 'admin'이 포함되어 있는지 확인하여 관리자 여부를 판단합니다.
  // user가 없거나 app_metadata, roles가 없으면 isAdmin은 false가 됩니다.
  const isAdmin = user?.app_metadata?.roles?.includes('admin');

  // 관리자일 경우에만 상품 링크를 렌더링합니다.
  if (isAdmin) {
    return (
      <li>
        <Link href="/products" className="text-blue-600 hover:text-blue-800 no-underline">
          상품
        </Link>
      </li>
    );
  }

  // 관리자가 아니면 아무것도 렌더링하지 않습니다.
  return null;
}
