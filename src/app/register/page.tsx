"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientComponentClient } from '@/lib/supabase/client';
import Link from 'next/link';

/**
 * 사용자 회원가입 기능을 제공하는 페이지 컴포넌트입니다.
 * @returns 회원가입 페이지 UI
 */
export default function RegisterPage() {
  // 이메일 입력 필드 상태
  const [email, setEmail] = useState('');
  // 비밀번호 입력 필드 상태
  const [password, setPassword] = useState('');
  // 회원가입 처리 중 로딩 상태
  const [loading, setLoading] = useState(false);
  // 사용자에게 표시할 메시지 상태 (성공/실패)
  const [message, setMessage] = useState<string | null>(null);
  // Next.js 라우터 훅을 사용하여 페이지 이동을 처리합니다.
  const router = useRouter();
  // Supabase 클라이언트 컴포넌트 클라이언트를 가져옵니다.
  const supabase = getClientComponentClient();

  /**
   * 회원가입 폼 제출을 처리하는 비동기 함수입니다.
   * @param e - 폼 제출 이벤트 객체
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼 기본 제출 동작을 방지합니다.
    setLoading(true); // 로딩 상태를 활성화합니다.
    setMessage(null); // 기존 메시지를 초기화합니다.

    // Supabase의 signUp 메서드를 사용하여 회원가입 시도를 합니다.
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    // 회원가입 시도 후 오류가 발생한 경우 메시지를 설정합니다.
    if (error) {
      setMessage(error.message);
    } else {
      // 회원가입 성공 시 메시지를 설정합니다. (이메일 확인 필요)
      setMessage('회원가입 성공! 이메일을 확인하여 계정을 활성화해주세요.');
      // 필요하다면 이메일 확인을 안내하는 페이지로 리다이렉트할 수 있습니다.
    }
    setLoading(false); // 로딩 상태를 비활성화합니다.
  };

  return (
    <div className="p-5 max-w-md mx-auto mt-10 border border-gray-300 rounded-lg shadow-md bg-white">
      <h1 className="text-center text-2xl font-bold mb-5">회원가입</h1>
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={loading} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
          {loading ? '회원가입 중...' : '회원가입'}
        </button>
      </form>
      {message && <p className={`mt-5 text-center ${message.includes('성공') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
      <p className="mt-4 text-center text-sm text-gray-600">
        이미 계정이 있으신가요? {' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
