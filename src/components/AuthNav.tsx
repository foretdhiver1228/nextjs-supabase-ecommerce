"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getClientComponentClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthNav() {
  const { user, loading } = useAuth();
  const supabase = getClientComponentClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // Redirect to login page after logout
  };

  if (loading) {
    return <li className="text-gray-500">로딩 중...</li>;
  }

  return (
    <li>
      {user ? (
        <button
          onClick={handleLogout}
          className="text-blue-600 hover:text-blue-800 no-underline bg-transparent border-none cursor-pointer p-0 font-normal"
        >
          로그아웃
        </button>
      ) : (
        <Link href="/login" className="text-blue-600 hover:text-blue-800 no-underline">
          로그인
        </Link>
      )}
    </li>
  );
}
