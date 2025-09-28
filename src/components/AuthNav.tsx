"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getClientComponentClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * 사용자 인증 상태에 따라 로그인 또는 로그아웃 버튼을 표시하는 클라이언트 컴포넌트입니다.
 * @returns 로그인/로그아웃 버튼 UI
 */
export default function AuthNav() {
  // useAuth 훅을 사용하여 사용자 인증 상태와 로딩 상태를 가져옵니다.
  const { user, loading } = useAuth();
  // Supabase 클라이언트 컴포넌트 클라이언트를 가져옵니다.
  const supabase = getClientComponentClient();
  // Next.js 라우터 훅을 사용하여 페이지 이동을 처리합니다.
  const router = useRouter();

  /**
   * 로그아웃 버튼 클릭을 처리하는 비동기 함수입니다.
   * Supabase에서 로그아웃하고 로그인 페이지로 리다이렉트합니다.
   */
  const handleLogout = async () => {
    await supabase.auth.signOut(); // Supabase에서 사용자 세션을 종료합니다.
    router.push('/login'); // 로그아웃 후 로그인 페이지로 이동합니다.
  };

  // 로딩 중일 때는 로딩 메시지를 표시합니다.
  if (loading) {
    return <li className="text-gray-500">로딩 중...</li>;
  }

  return (
    <li>
      {/* 사용자가 로그인되어 있으면 로그아웃 버튼을 표시합니다. */}
      {user ? (
        <button
          onClick={handleLogout}
          className="text-blue-600 hover:text-blue-800 no-underline bg-transparent border-none cursor-pointer p-0 font-normal"
        >
          로그아웃
        </button>
      ) : ( // 사용자가 로그인되어 있지 않으면 로그인 링크를 표시합니다.
        <Link href="/login" className="text-blue-600 hover:text-blue-800 no-underline">
          로그인
        </Link>
      )}
    </li>
  );
}
