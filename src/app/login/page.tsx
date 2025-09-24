"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientComponentClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('로그인 성공!');
      router.push('/'); // Redirect to home page on success
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('회원가입 성공! 이메일을 확인하여 계정을 활성화해주세요.');
      // Optionally redirect to a page informing user to check email
    }
    setLoading(false);
  };

  return (
    <div className="p-5 max-w-md mx-auto mt-10 border border-gray-300 rounded-lg shadow-md bg-white">
      <h1 className="text-center text-2xl font-bold mb-5">로그인 / 회원가입</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
        <button type="submit" disabled={loading} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
          {loading ? '로그인 중...' : '로그인'}
        </button>
        <button type="button" onClick={handleSignUp} disabled={loading} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
          {loading ? '회원가입 중...' : '회원가입'}
        </button>
      </form>
      {message && <p className={`mt-5 text-center ${message.includes('성공') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
    </div>
  );
}
