// app/page.tsx
'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import Image from 'next/image';

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: number;
  role: Role;
  content: string;
  // optional flag to show a mini-practice card with this message
  withActivityCard?: boolean;
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        "Hey, I'm Koa 🐨. Tell me how you're feeling in a line or two, and I'll suggest a tiny 1–2 minute practice to help you reset.",
      withActivityCard: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e?: FormEvent) {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build a minimal chat history payload for the /api/chat endpoint.
      const payloadMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      // This assumes your API returns JSON like { message: "..." }
      // Adjust if your route.ts uses a different shape / streaming.
      const data = await res.json();
      const assistantText: string =
        data?.message ?? data?.content ?? "Here’s a small practice you can try.";

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantText,
        // you can later set this based on model output / tags:
        withActivityCard: true,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content:
          "Hmm, something went wrong while talking to my brain in the cloud. Can you try again in a moment? 💭",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="koa-page">
      <div className="koa-shell">
        <header className="koa-header">
          <div className="koa-header-left">
            <div className="koa-logo-wrap">
              {/* Make sure you add /public/koa-logo.png */}
              <Image
                src="/koa-logo.png"
                alt="Koa koala logo"
                width={40}
                height={40}
              />
            </div>
            <div>
              <h1 className="koa-title">Koa</h1>
              <p className="koa-subtitle">Micro-practices for busy minds</p>
            </div>
          </div>
          <div className="koa-header-right">
            <span className="koa-pill">✨ 1–2 min practices</span>
          </div>
        </header>

        <div className="koa-divider" />

        <section className="koa-body">
          <div className="koa-chat">
            <div className="koa-messages">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`koa-message-row koa-message-row-${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="koa-avatar">🐨</div>
                  )}
                  <div
                    className={`koa-bubble koa-bubble-${msg.role}`}
                  >
                    <p className="koa-bubble-text">{msg.content}</p>

                    {msg.role === 'assistant' && msg.withActivityCard && (
                      <MiniPracticeCard />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="koa-message-row koa-message-row-assistant">
                  <div className="koa-avatar">🐨</div>
                  <div className="koa-bubble koa-bubble-assistant">
                    <p className="koa-bubble-text">Koa is thinking…</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form className="koa-input-row" onSubmit={handleSend}>
              <input
                className="koa-input"
                placeholder="Tell Koa how you’re feeling in one line…"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="koa-send-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Styled-JSX so this file is self-contained */}
      <style jsx global>{`
        :root {
          --koa-mint: #e6f4ec;
          --koa-deep-green: #1f6b4a;
          --koa-sage: #c4dccd;
          --koa-sand: #f7eee2;
          --koa-coral: #f28b82;
          --koa-text: #163628;
        }

        html,
        body {
          padding: 0;
          margin: 0;
          height: 100%;
        }

        body {
          background: var(--koa-mint);
          font-family: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', sans-serif;
          color: var(--koa-text);
        }

        /* Import Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&family=Playfair+Display:wght@500;600&display=swap');

        .koa-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .koa-shell {
          width: 100%;
          max-width: 900px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 16px 45px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          padding: 20px 20px 16px;
        }

        .koa-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .koa-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .koa-logo-wrap {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: var(--koa-mint);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--koa-sage);
        }

        .koa-title {
          margin: 0;
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 24px;
          color: var(--koa-deep-green);
        }

        .koa-subtitle {
          margin: 2px 0 0;
          font-size: 13px;
          color: #3f5f4a;
        }

        .koa-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .koa-pill {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--koa-mint);
          color: var(--koa-deep-green);
          border: 1px solid var(--koa-sage);
        }

        .koa-divider {
          width: 100%;
          height: 1px;
          background: #edf1eb;
          margin: 12px 0 8px;
        }

        .koa-body {
          display: flex;
          gap: 16px;
          min-height: 500px;
        }

        .koa-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .koa-messages {
          flex: 1;
          overflow-y: auto;
          padding: 6px 2px 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .koa-message-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .koa-message-row-assistant {
          justify-content: flex-start;
        }

        .koa-message-row-user {
          justify-content: flex-end;
        }

        .koa-avatar {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: var(--koa-mint);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--koa-sage);
          font-size: 16px;
        }

        .koa-bubble {
          max-width: 80%;
          border-radius: 18px;
          padding: 10px 12px;
          font-size: 14px;
          line-height: 1.4;
        }

        .koa-bubble-assistant {
          background: var(--koa-sage);
          color: var(--koa-text);
        }

        .koa-bubble-user {
          background: var(--koa-sand);
          color: var(--koa-text);
          border: 1px solid var(--koa-deep-green);
        }

        .koa-bubble-text {
          margin: 0 0 6px 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .koa-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #edf1eb;
        }

        .koa-input {
          flex: 1;
          border-radius: 999px;
          border: 1px solid var(--koa-sage);
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .koa-input:focus {
          border-color: var(--koa-deep-green);
          box-shadow: 0 0 0 2px rgba(31, 107, 74, 0.16);
        }

        .koa-send-btn {
          border-radius: 999px;
          border: none;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 600;
          background: var(--koa-coral);
          color: white;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.08s ease,
            box-shadow 0.15s ease;
        }

        .koa-send-btn:hover:not(:disabled) {
          background: #e36d62;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);
          transform: translateY(-1px);
        }

        .koa-send-btn:disabled {
          opacity: 0.6;
          cursor: default;
          box-shadow: none;
          transform: none;
        }

        /* Mini practice card styles */
        .koa-mini-card {
          margin-top: 6px;
          border-radius: 14px;
          background: #ffffffb8;
          padding: 10px 12px;
          border: 1px solid var(--koa-sand);
        }

        .koa-mini-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7f71;
          margin-bottom: 4px;
        }

        .koa-mini-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .koa-mini-list {
          margin: 0 0 6px 16px;
          padding: 0;
          font-size: 13px;
        }

        .koa-mini-list li {
          margin-bottom: 2px;
        }

        .koa-mini-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          padding: 6px 10px;
          border: none;
          background: var(--koa-deep-green);
          color: white;
          font-size: 12px;
          cursor: pointer;
        }

        .koa-mini-btn span {
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .koa-shell {
            border-radius: 18px;
            padding: 16px 14px;
          }

          .koa-body {
            min-height: 420px;
          }

          .koa-bubble {
            max-width: 90%;
          }

          .koa-title {
            font-size: 20px;
          }

          .koa-subtitle {
            font-size: 12px;
          }
        }
      `}</style>
    </main>
  );
}

function MiniPracticeCard() {
  return (
    <div className="koa-mini-card">
      <div className="koa-mini-label">Mini practice · ⏱ 2 mins</div>
      <h4 className="koa-mini-title">60-second box breathing</h4>
      <ul className="koa-mini-list">
        <li>Inhale through your nose for 4 seconds.</li>
        <li>Hold your breath gently for 4 seconds.</li>
        <li>Exhale slowly for 4 seconds.</li>
        <li>Pause for 4 seconds, then repeat 3 times.</li>
      </ul>
      <button className="koa-mini-btn" type="button">
        <span>Start now</span> 🌿
      </button>
    </div>
  );
}
