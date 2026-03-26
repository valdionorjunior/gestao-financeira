import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Sparkles } from 'lucide-react';
import { aiService } from '../services/finance.service';
import { useAuthStore } from '../stores/auth.store';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'Como está minha saúde financeira este mês?',
  'Onde posso economizar mais?',
  'Qual é minha maior despesa?',
  'Estou no caminho certo com minhas metas?',
];

export function AIChatPanel() {
  const user = useAuthStore(s => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || thinking) return;

    setMessages(prev => [...prev, { role: 'user', content: message, timestamp: new Date() }]);
    setInput('');
    setThinking(true);

    try {
      const data = await aiService.chat(message);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response, timestamp: new Date() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Desculpe, não consegui processar sua solicitação. Tente novamente em instantes.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat area */}
      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto rounded-xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col gap-4 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">
                Olá, {user?.firstName ?? 'usuário'}!
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Posso ajudar você a entender suas finanças. Experimente uma sugestão:
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={thinking}
                  className="text-sm bg-gray-50 hover:bg-cyan-50 hover:text-cyan-700 border border-gray-200 hover:border-cyan-200 rounded-full px-4 py-2 transition-all text-gray-500 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-sm shadow-md shadow-blue-100'
                      : 'bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1 text-cyan-600">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-xs font-medium">FinanceAI</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 150, 300].map(delay => (
                      <span
                        key={delay}
                        className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={thinking}
          placeholder="Digite sua pergunta sobre suas finanças..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400
            disabled:opacity-50 transition-all shadow-sm"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || thinking}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white
            hover:from-cyan-600 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          {!thinking && <span className="hidden sm:inline">Enviar</span>}
        </button>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            disabled={thinking}
            title="Limpar conversa"
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-400
              hover:border-red-200 hover:text-red-400 hover:bg-red-50
              disabled:opacity-40 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
