import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AI_URL = 'https://functions.poehali.dev/1613cc32-756b-445e-94f1-0ab1fe0278f4';

const EXAMPLES = [
  'Сколько контактов у Ирины Миморовой сегодня?',
  'Топ-5 промоутеров по контактам за эту неделю',
  'Сколько смен отработала Дана Горбунова всего?',
  'Какие промоутеры сейчас стажёры?',
  'Среднее количество контактов за смену по всем промоутерам',
];

const CHART_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];

function ChartBlock({ data, chartType }: { data: Record<string, unknown>[]; chartType: string }) {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  const labelKey = keys[0];
  const valueKey = keys[1] || keys[0];

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={valueKey} fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey={valueKey} stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey={labelKey} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  data?: Record<string, unknown>[];
  chartType?: string | null;
  loading?: boolean;
}

export default function AssistantTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я умный помощник по данным команды. Задавай любые вопросы о промоутерах, сменах, контактах и статистике.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSql, setShowSql] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { role: 'user', content: question };
    const loadingMsg: Message = { role: 'assistant', content: '', loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);

    const history = messages
      .filter(m => !m.loading)
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: data.answer || 'Не удалось получить ответ.',
          sql: data.sql,
          data: data.data,
          chartType: data.chart_type,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Ошибка соединения. Попробуй ещё раз.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Шапка */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
          <Icon name="Sparkles" size={18} className="text-violet-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Умный помощник</p>
          <p className="text-xs text-gray-400">Задавай вопросы о промоутерах и статистике</p>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? '' : 'w-full max-w-2xl'}`}>
              {msg.loading ? (
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : msg.role === 'user' ? (
                <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm space-y-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>

                  {/* График */}
                  {msg.data && msg.data.length > 0 && msg.chartType && (
                    <div className="pt-1">
                      <ChartBlock data={msg.data} chartType={msg.chartType} />
                    </div>
                  )}

                  {/* Таблица данных (если нет графика или данных много) */}
                  {msg.data && msg.data.length > 0 && !msg.chartType && (
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="text-xs w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            {Object.keys(msg.data[0]).map(col => (
                              <th key={col} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.data.map((row, ri) => (
                            <tr key={ri} className="border-t border-gray-50">
                              {Object.values(row).map((val, ci) => (
                                <td key={ci} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                  {val === null ? '—' : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SQL */}
                  {msg.sql && (
                    <div>
                      <button
                        onClick={() => setShowSql(showSql === i ? null : i)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        <Icon name="Code" size={12} />
                        {showSql === i ? 'Скрыть SQL' : 'Показать SQL'}
                      </button>
                      {showSql === i && (
                        <pre className="mt-2 bg-gray-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                          {msg.sql}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Примеры (показываем только если одно приветственное сообщение) */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2 flex-shrink-0">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => send(ex)}
              className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-3 py-1.5 hover:border-violet-300 hover:text-violet-600 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Ввод */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Задай вопрос о промоутерах..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-violet-400 disabled:opacity-50 min-h-[42px] max-h-32"
            style={{ lineHeight: '1.5' }}
          />
          <Button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-[42px] px-4 flex-shrink-0"
          >
            <Icon name="Send" size={16} />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">Enter — отправить · Shift+Enter — новая строка</p>
      </div>
    </div>
  );
}