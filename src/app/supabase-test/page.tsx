"use client";

import { useState, useEffect } from 'react';

interface TestItem {
  id: string;
  name: string;
}

export default function SupabaseTestPage() {
  const [items, setItems] = useState<TestItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/supabase-test');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: TestItem[] = await response.json();
      setItems(data);
    } catch (e: any) {
      console.error('Failed to fetch items:', e);
      setError(e.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItemName.trim()) {
      alert('항목 이름을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/supabase-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItemName }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewItemName('');
      fetchItems(); // Refresh the list
    } catch (e: any) {
      console.error('Failed to add item:', e);
      setError(e.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Supabase 연결 테스트</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="새 항목 이름"
          style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          onClick={addItem}
          disabled={loading}
          style={{
            padding: '8px 15px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {loading ? '추가 중...' : '항목 추가'}
        </button>
      </div>

      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>오류: {error}</p>}

      <h2>현재 항목</h2>
      {items.length === 0 && !loading && !error && <p>항목이 없습니다. 추가해보세요!</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: '5px' }}>
            {item.name} (ID: {item.id})
          </li>
        ))}
      </ul>
    </div>
  );
}
