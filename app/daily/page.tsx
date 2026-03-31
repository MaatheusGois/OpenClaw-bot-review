// app/daily/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface DailyItem {
  time: string;
  content: string;
  status: 'completed' | 'in-progress' | 'pending';
}

function DailyBoard() {
  const [items, setItems] = useState<DailyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    async function fetchDaily() {
      try {
        const res = await fetch('/api/daily');
        const data = await res.json();
        setItems(data.items || []);
      } catch (error) {
        console.error('Failed to fetch daily:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDaily();
  }, []);

  const completedItems = items.filter(i => i.status === 'completed');
  const inProgressItems = items.filter(i => i.status === 'in-progress');
  
  const reportText = completedItems.length > 0
    ? `今日共完成 ${completedItems.length} 项任务。${completedItems.map(i => i.content).join('。')}`
    : '今日暂无完成记录';

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      alert('您的浏览器不支持语音合成');
      return;
    }

    if (speaking && utterance) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const u = new SpeechSynthesisUtterance(reportText);
    u.lang = 'zh-CN';
    u.rate = 1.0;
    
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    
    setUtterance(u);
    window.speechSynthesis.speak(u);
  };

  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 今日播报板</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{today}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={speak}
            disabled={loading || items.length === 0}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              speaking
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {speaking ? (
              <>
                <span>⏹️</span> 停止
              </>
            ) : (
              <>
                <span>🎤</span> 播报
              </>
            )}
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{completedItems.length}</div>
          <div className="text-xs text-[var(--text-muted)]">已完成</div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{inProgressItems.length}</div>
          <div className="text-xs text-[var(--text-muted)]">进行中</div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">
            {items.length - completedItems.length - inProgressItems.length}
          </div>
          <div className="text-xs text-[var(--text-muted)]">待开始</div>
        </div>
      </div>

      {/* 播报列表 */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">加载中...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            今日暂无记录
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.map((item, index) => (
              <div
                key={index}
                className={`p-4 flex items-start gap-3 ${
                  speaking && item.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <span className="text-lg mt-0.5">
                  {item.status === 'completed' ? '✅' : 
                   item.status === 'in-progress' ? '🔄' : '⏳'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${
                    item.status === 'completed' 
                      ? 'text-[var(--text-muted)] line-through' 
                      : ''
                  }`}>
                    {item.content}
                  </p>
                  {item.time && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">{item.time}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 提示 */}
      {speaking && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400">
          🎤 正在语音播报今日完成事项...
        </div>
      )}
    </main>
  );
}

export default function DailyPage() {
  return <DailyBoard />;
}
