'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ChatRole = 'user' | 'ai';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

function MarkdownMessage({ content, variant }: { content: string; variant: ChatRole }) {
  const baseTextClass = variant === 'user' ? 'text-white' : 'text-gray-900';
  return (
    <div className={`markdown leading-relaxed ${baseTextClass}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          a: ({ children, ...props }) => (
            <a
              {...props}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-inside list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="list-inside list-decimal">{children}</ol>,
          li: ({ children }) => <li className="whitespace-pre-wrap">{children}</li>,
          code: ({ children }) => (
            <code className="font-mono text-xs">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md">
              {children}
            </pre>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-gray-200 pl-3">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatWidget({
  fileId,
  title,
}: {
  fileId: string;
  title?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const headerTitle = useMemo(() => {
    if (title && title.trim().length > 0) return title;
    return 'Dataset Agent';
  }, [title]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'You are not logged in. Please log in again.' },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/${fileId}/chat`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: trimmed }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Request failed');
      }

      const data = (await res.json()) as { answer?: string };
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: data.answer ?? 'No response.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: 'Sorry — I ran into an error while answering that.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open chat"
        >
          <span className="text-2xl leading-none">💬</span>
        </button>
      ) : (
        <div className="flex h-[630px] w-[510px] flex-col overflow-hidden rounded-lg bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="text-sm font-semibold text-gray-900">{headerTitle}</div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              aria-label="Minimize chat"
            >
              <span className="block h-0.5 w-4 bg-gray-600" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-3"
          >
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500">
                Ask a question about this dataset.
              </div>
            ) : null}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === 'user'
                    ? 'flex justify-end'
                    : 'flex justify-start'
                }
              >
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[80%] rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white'
                      : 'max-w-[80%] rounded-2xl bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200'
                  }
                >
                  <MarkdownMessage content={m.content} variant={m.role} />
                </div>
              </div>
            ))}

            {isTyping ? (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  <span className="animate-pulse">Agent is typing...</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isTyping}
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isTyping || input.trim().length === 0}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
