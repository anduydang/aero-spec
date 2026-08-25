import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Globe, Key, Sparkles, RefreshCw, Cpu, Zap, ShieldCheck } from 'lucide-react';
import type { HardwareScore, HardwareTelemetryState, LanguageType } from '../types/hardware';
import { soundFx } from '../utils/soundFx';
import { buildAdvisorContext } from '../utils/advisorContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface AiAdvisorModalProps {
  isOpen: boolean;
  telemetry: HardwareTelemetryState;
  score: HardwareScore;
  lang: LanguageType;
  onClose: () => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  telemetry,
  score,
  lang,
  onClose
}) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('aerospec_gemini_key') || '');
  const [draftApiKey, setDraftApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dialogRef = useAccessibleDialog<HTMLDivElement>({ isOpen, onClose });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const saveApiKey = () => {
    const trimmed = draftApiKey.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    localStorage.setItem('aerospec_gemini_key', trimmed);
    setDraftApiKey('');
    setShowKeyInput(false);
    soundFx.playChime();
  };

  const clearApiKey = () => {
    setApiKey('');
    setDraftApiKey('');
    localStorage.removeItem('aerospec_gemini_key');
    soundFx.playClick();
  };

  const quickQuestions = lang === 'EN' ? [
    "What should I upgrade with a $100 budget?",
    "Which GPU upgrades are safe for my detected power and platform limits?",
    "Should I upgrade to 32GB RAM or add an NVMe SSD?",
    "What is the best low-power GPU for this PC?"
  ] : [
    "Có 2 triệu nâng gì cho máy này để chơi game mượt nhất?",
    "Card đồ họa nào an toàn với giới hạn nguồn và nền tảng đã phát hiện?",
    "Nên nâng RAM lên 32GB hay nâng thêm ổ SSD NVMe 500GB trước?",
    "Máy này có gắn được card RTX 3060 không và cần thay gì?"
  ];

  const handleSendMessage = async (queryText?: string) => {
    const text = queryText || inputMessage.trim();
    if (!text || isLoading) return;

    soundFx.playClick();
    const userMsg: Message = {
      id: `user-${messages.length}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputMessage('');

    // Check if API Key is configured
    if (!apiKey.trim()) {
      setMessages(prev => [
        ...prev,
        {
          id: `missing-key-${messages.length}`,
          sender: 'ai',
          text: lang === 'EN'
            ? 'Gemini API Key is not connected yet. Please click the "Connect API Key" button at the top and paste your Google Gemini API Key to chat with the real AI!'
            : 'Chưa kết nối Gemini API Key. Vui lòng bấm nút "Connect API Key" ở góc trên bên phải và dán mã API Key của bạn để trò chuyện trực tiếp với AI thật!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
      setShowKeyInput(true);
      return;
    }

    setIsLoading(true);

    const systemPrompt = `You are AeroSpec Pro AI, a senior PC hardware architecture and upgrade consultant.
Current AeroSpec context:
${buildAdvisorContext(telemetry, score)}

Answer the user question in ${lang === 'VI' ? 'Vietnamese' : 'English'}.
Never infer an exact PSU, sensor reading, connector, motherboard feature, or component that is absent from the context. Clearly identify simulated context. Explain uncertainty before making compatibility claims. Provide concrete, actionable recommendations and label prices as estimates. Format the response with clear Markdown headers, highlights, bullets, and comparison tables where useful.`;

    // Cascade top flagship models first (Gemini 3.7 Flash -> 3.5 Flash -> 3.1 Flash Lite -> 3.5 Flash Lite -> Flash Latest)
    const candidateModels = [
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest'
    ];
    let replyText = '';
    let usedModel = '';
    let success = false;
    let lastErrorMsg = '';

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${text}` }]
              }
            ]
          })
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text;
          usedModel = model;
          success = true;
          break;
        } else if (data?.error?.message) {
          lastErrorMsg = `[${model}] ${data.error.message}`;
          continue;
        }
      } catch (err: unknown) {
        lastErrorMsg = err instanceof Error ? err.message : 'Network error';
      }
    }

    setIsLoading(false);

    if (success && replyText) {
      const modelDisplayName = usedModel.replace('gemini-', 'Gemini ').replace('-flash', ' Flash').replace('-lite', ' Lite');
      setMessages(prev => [
        ...prev,
        {
          id: `reply-${messages.length}`,
          sender: 'ai',
          text: replyText,
          timestamp: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${modelDisplayName}`
        }
      ]);
      soundFx.playChime();
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${messages.length}`,
          sender: 'ai',
          text: `Lỗi kết nối Gemini API: ${lastErrorMsg || 'Không thể gọi AI API. Vui lòng kiểm tra lại API Key hoặc quota tài khoản Google AI Studio.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-advisor-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[88vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="ai-advisor-title" className="text-base font-extrabold text-white">
                    {lang === 'EN' ? 'AeroSpec AI Hardware Upgrade Consultant' : 'Trợ Lý AI Tư Vấn Nâng Cấp Phần Cứng'}
                  </h3>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border flex items-center gap-1 ${
                    apiKey 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60' 
                      : 'bg-amber-950 text-amber-300 border-amber-700/60'
                  }`}>
                    <Globe className="w-3 h-3" />
                    {apiKey ? 'Gemini 3.5 / 3.7 Active' : 'API Key Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {telemetry.telemetry.mode === 'simulated' ? 'Simulated profile' : 'Live hardware'} • {score.score === null ? 'Score unavailable' : `Score ${score.score}/100`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Cài đặt Gemini API Key để trò chuyện với AI"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>{apiKey ? 'API Key Connected' : 'Connect API Key'}</span>
              </button>

              <button
                onClick={onClose}
                aria-label={lang === 'EN' ? 'Close AI advisor' : 'Đóng trợ lý AI'}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* API Key Configuration Dropdown Panel */}
          {showKeyInput && (
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Google Gemini API Key
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline font-mono text-[11px]"
                >
                  Lấy API Key miễn phí tại Google AI Studio →
                </a>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'EN'
                  ? 'Your key is stored locally in this app profile on this PC. It is sent only to the Google Gemini API when you ask a question.'
                  : 'Key được lưu cục bộ trong profile ứng dụng này trên máy của bạn. Key chỉ được gửi tới Google Gemini API khi bạn đặt câu hỏi.'}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  aria-label="Gemini API Key"
                  value={draftApiKey}
                  onChange={(e) => setDraftApiKey(e.target.value)}
                  placeholder="Dán mã API Key (AQ.Ab8... hoặc AIzaSy...)"
                  className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  onClick={saveApiKey}
                  disabled={!draftApiKey.trim()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {lang === 'EN' ? 'Save API Key' : 'Lưu API Key'}
                </button>
                {apiKey && (
                  <button
                    type="button"
                    onClick={clearApiKey}
                    className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {lang === 'EN' ? 'Clear API Key' : 'Xóa API Key'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Live Machine Specs Summary Bar */}
          <div className="px-5 py-2 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              {telemetry.telemetry.capabilities.cpuIdentity && <span className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-sky-400" /> {telemetry.cpu.name}
              </span>}
              {telemetry.telemetry.capabilities.psu && <span className="flex items-center gap-1.5 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> PSU: {telemetry.psu.ratedWattage}W ({telemetry.psu.rating})
              </span>}
              {telemetry.telemetry.capabilities.motherboardIdentity && <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Main: {telemetry.motherboard.name}
              </span>}
              {!telemetry.telemetry.capabilities.cpuIdentity && !telemetry.telemetry.capabilities.motherboardIdentity && (
                <span className="text-amber-300">No native component identity available in browser preview</span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              {telemetry.telemetry.mode === 'simulated' ? 'Simulated context' : 'Capability-filtered live context'}
            </span>
          </div>

          {/* Messages Stream Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 bg-slate-950/40">
            {messages.length === 0 && (
              <div className="m-auto w-full max-w-2xl text-center flex flex-col items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    {lang === 'EN' ? 'Ask with capability-filtered context' : 'Hỏi với ngữ cảnh đã lọc theo khả năng phát hiện'}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-lg">
                    {lang === 'EN'
                      ? 'AeroSpec sends only detected fields to Gemini and clearly marks simulator profiles.'
                      : 'AeroSpec chỉ gửi các trường đã phát hiện tới Gemini và luôn đánh dấu rõ profile giả lập.'}
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-2.5 w-full">
                  {quickQuestions.slice(0, 3).map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => handleSendMessage(question)}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left text-xs text-slate-200 leading-relaxed cursor-pointer"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.sender === 'user' ? 'bg-sky-500 text-white' : (msg.isError ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white')
                }`}>
                  {msg.sender === 'user' ? <span className="font-bold text-xs font-mono">YOU</span> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`p-4 rounded-2xl flex flex-col gap-2 ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : (msg.isError ? 'bg-amber-950/60 border border-amber-800 text-amber-200 rounded-tl-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg')
                }`}>
                  <MarkdownRenderer content={msg.text} />

                  <span className={`text-[10px] font-mono mt-1 ${msg.sender === 'user' ? 'text-sky-200 text-right' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 mr-auto max-w-[80%]">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                  <span className="text-xs font-mono">
                    Đang gửi dữ liệu phần cứng và nhận phản hồi từ Gemini AI...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          {messages.length > 0 && <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 shrink-0 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Gợi ý:
            </span>
            {quickQuestions.slice(0, 3).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-sans whitespace-normal transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>}

          {/* Chat Input Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={lang === 'EN' ? 'Ask any hardware upgrade or compatibility question...' : 'Hỏi về ngân sách nâng cấp, tương thích card đồ họa, nguồn điện, RAM, SSD...'}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-sans"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-sky-500/25 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
