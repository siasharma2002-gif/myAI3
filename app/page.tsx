// app/page.tsx
'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import Image from 'next/image';

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: number;
  role: Role;
  content: string;
  withActivityCard?: boolean;
}

const initialAssistantMessage: ChatMessage = {
  id: 1,
  role: 'assistant',
  content:
    "Hey, I'm Koa 🐨. Tell me how you're feeling in a line or two, and I'll suggest a tiny 1–2 minute practice to help you reset.",
  withActivityCard: true,
};

const quickMoods = [
  { label: '😵‍💫 Stressed', text: "I'm feeling stressed and overwhelmed." },
  { label: '😴 Tired', text: "I'm tired and low on energy." },
  { label: '🤯 Can’t focus', text: "I can't focus on my work right now." },
  { label: '🙂 Just checking in', text: "I'm okay, just want a gentle check-in." },
];

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    initialAssistantMessage,
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
    };

    // capture current history for payload before state update
    const history = [...messages, userMsg];

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const payloadMessages = history.map(m => ({
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

      const data = await res.json();
      const assistantText: string =
        data?.message ?? data?.content ?? "Here’s a small practice you can try.";

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantText,
        withActivityCard: true,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
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

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  async function handleQuickMood(text: string) {
    await sendMessage(text);
  }

  return (
    <main className="koa-page">
      <div className="koa-shell">
        <header className="koa-header">
          <div className="koa-header-left">
            <div className="koa-logo-wrap">
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
            <span className="koa-status-dot" />
            <span className="koa-status-text">Koa is online · here with you</span>
            <span className="koa-pill">✨ 1–2 min practices</span>
          </div>
        </header>

        <div className="koa-divider" />

        <section className="koa-body">
          <div className="koa-chat">
            <div className="koa-quick-row">
              <p className="koa-quick-label">How are you feeling today?</p>
              <div className="koa-quick-chips">
                {quickMoods.map(mood => (
                  <button
                    key={mood.label}
                    type="button"
                    className="koa-quick-chip"
                    onClick={() => handleQuickMood(mood.text)}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="koa-messages">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`koa-message-row koa-message-row-${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="koa-avatar">
                      <span role="img" aria-label="Koa">
                        🐨
                      </span>
                    </div>
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
                  <div className="koa-avatar">
                    <span role="img" aria-label="Koa">
                      🐨
                    </span>
                  </div>
                  <div className="koa-bubble koa-bubble-assistant">
                    <div className="koa-typing">
                      <span className="koa-dot" />
                      <span className="koa-dot" />
                      <span className="koa-dot" />
                    </div>
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

      {/* Global styles */}
      <style jsx global>{`
        :root {
          --koa-mint: #e6f4ec;
          --koa-mint-soft: #f3fbf7;
          --koa-deep-green: #1f6b4a;
          --koa-sage: #c4dccd;
          --koa-sage-soft: #d5e6da;
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

        /* Warm, rounded fonts */
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');

        body {
          background: radial-gradient(
              circle at top left,
              var(--koa-mint-soft),
              var(--koa-mint)
            );
          font-family: 'Quicksand', system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', sans-serif;
          color: var(--koa-text);
        }

        .koa-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .koa-shell {
          width: 100%;
          max-width: 960px;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          padding: 20px 22px 16px;
          border: 1px solid rgba(196, 220, 205, 0.6);
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
          width: 52px;
          height: 52px;
          border-radius: 999px;
          background: var(--koa-mint);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--koa-sage);
          overflow: hidden;
        }

        .koa-title {
          margin: 0;
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 26px;
          color: var(--koa-deep-green);
          letter-spacing: 0.03em;
        }

        .koa-subtitle {
          margin: 2px 0 0;
          font-size: 13px;
          color: #3f5f4a;
        }

        .koa-header-right {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
        }

        .koa-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #4caf50;
          box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.25);
        }

        .koa-status-text {
          font-size: 12px;
          color: #52715d;
        }

        .koa-pill {
          font-size: 12px;
          padding: 6px 11px;
          border-radius: 999px;
          background: var(--koa-mint);
          color: var(--koa-deep-green);
          border: 1px solid var(--koa-sage);
          white-space: nowrap;
        }

        .koa-divider {
          width: 100%;
          height: 1px;
          background: #edf1eb;
          margin: 14px 0 8px;
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

        .koa-quick-row {
          margin-bottom: 8px;
          padding: 8px 10px 10px;
          border-radius: 16px;
          background: var(--koa-mint-soft);
          border: 1px dashed rgba(196, 220, 205, 0.9);
        }

        .koa-quick-label {
          margin: 0 0 6px 0;
          font-size: 12px;
          color: #607b68;
        }

        .koa-quick-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .koa-quick-chip {
          border-radius: 999px;
          border: 1px solid var(--koa-sage);
          background: #ffffff;
          padding: 6px 10px;
          font-size: 12px;
          cursor: pointer;
          color: #345743;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: background 0.15s ease, box-shadow 0.15s ease,
            transform 0.08s ease;
        }

        .koa-quick-chip:hover {
          background: var(--koa-mint);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
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
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: var(--koa-mint);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--koa-sage);
          font-size: 17px;
        }

        .koa-bubble {
          max-width: 80%;
          border-radius: 20px;
          padding: 10px 13px;
          font-size: 14px;
          line-height: 1.45;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.02);
        }

        .koa-bubble-assistant {
          background: var(--koa-sage);
          color: var(--koa-text);
        }

        .koa-bubble-user {
          background: var(--koa-sand);
          color: var(--koa-text);
          border: 1px solid rgba(31, 107, 74, 0.7);
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
          background: #ffffff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .koa-input:focus {
          border-color: var(--koa-deep-green);
          box-shadow: 0 0 0 2px rgba(31, 107, 74, 0.15);
          background: #ffffff;
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

        /* Mini practice card */
        .koa-mini-card {
          margin-top: 6px;
          border-radius: 16px;
          background: #ffffffd0;
          padding: 10px 12px;
          border: 1px solid var(--koa-sand);
        }

        .koa-mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .koa-mini-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7f71;
        }

        .koa-mini-chip {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 999px;
          background: var(--koa-mint);
          color: #587462;
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

        /* Typing indicator */
        .koa-typing {
          display: inline-flex;
          gap: 4px;
          align-items: center;
          padding: 4px 2px;
        }

        .koa-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(22, 54, 40, 0.9);
          animation: koa-bounce 1s infinite ease-in-out;
        }

        .koa-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .koa-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes koa-bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .koa-shell {
            border-radius: 20px;
            padding: 16px 14px;
          }

          .koa-body {
            min-height: 420px;
          }

          .koa-bubble {
            max-width: 90%;
          }

          .koa-title {
            font-size: 22px;
          }

          .koa-subtitle {
            font-size: 12px;
          }

          .koa-header-right {
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}

function MiniPracticeCard() {
  return (
    <div className="koa-mini-card">
      <div className="koa-mini-header">
        <div className="koa-mini-label">Mini practice · ⏱ 2 mins</div>
        <div className="koa-mini-chip">Soft reset</div>
      </div>
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
