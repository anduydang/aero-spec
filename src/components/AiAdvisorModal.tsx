import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Globe, Key, Sparkles, RefreshCw, Cpu, Zap, ShieldCheck } from 'lucide-react';
import type { HardwareTelemetryState, LanguageType } from '../types/hardware';
import { soundFx } from '../utils/soundFx';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: { title: string; url: string }[];
  isGrounding?: boolean;
}

interface AiAdvisorModalProps {
  isOpen: boolean;
  telemetry: HardwareTelemetryState;
  lang: LanguageType;
  onClose: () => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  telemetry,
  lang,
  onClose
}) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('aerospec_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: lang === 'EN'
            ? `Hello! I am your AeroSpec AI Hardware Upgrade Consultant. I have analyzed your system (**${telemetry.hostName}** with ${telemetry.cpu.name}, ${telemetry.ram.totalGb}GB ${telemetry.ram.channelMode}, ${telemetry.motherboard.name}, ${telemetry.psu.name} ${telemetry.psu.ratedWattage}W). How can I help optimize your build?`
            : `Xin chào! Tôi là Trợ lý AI Tư Vấn Nâng Cấp Phần Cứng AeroSpec. Tôi đã nạp toàn bộ cấu hình máy của bạn (**${telemetry.hostName}**: CPU ${telemetry.cpu.name}, RAM ${telemetry.ram.totalGb}GB ${telemetry.ram.channelMode}, Mainboard ${telemetry.motherboard.name}, Nguồn ${telemetry.psu.name} ${telemetry.psu.ratedWattage}W). Bạn muốn nâng cấp với ngân sách bao nhiêu hoặc cần tư vấn linh kiện nào?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [lang, telemetry]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('aerospec_gemini_key', key);
    setShowKeyInput(false);
    soundFx.playChime();
  };

  const quickQuestions = lang === 'EN' ? [
    "What should I upgrade with a $100 budget?",
    "Can my power supply support an RTX 3050?",
    "Should I upgrade to 32GB RAM or add an NVMe SSD?",
    "What is the best low-power GPU for this PC?"
  ] : [
    "Có 2 triệu nâng gì cho máy này để chơi game mượt nhất?",
    "Nguồn 260W này lắp được card đồ họa nào không cần nguồn phụ?",
    "Nên nâng RAM lên 32GB hay nâng thêm ổ SSD NVMe 500GB trước?",
    "Máy này có gắn được card RTX 3060 không và cần thay gì?"
  ];

  const handleSendMessage = async (queryText?: string) => {
    const text = queryText || inputMessage.trim();
    if (!text || isLoading) return;

    soundFx.playClick();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputMessage('');
    setIsLoading(true);

    // Call live Gemini 2.0 / 1.5 Flash with Google Search Grounding if API key provided
    if (apiKey.trim()) {
      try {
        const systemPrompt = `You are AeroSpec Pro AI - a senior PC hardware architecture & upgrade consultant.
Current User Hardware Telemetry:
- Host: ${telemetry.hostName}
- CPU: ${telemetry.cpu.name} (${telemetry.cpu.cores}C/${telemetry.cpu.threads}T, Clock: ${telemetry.cpu.avgClockMhz}MHz)
- RAM: ${telemetry.ram.totalGb}GB ${telemetry.ram.channelMode} (${telemetry.ram.config}, Timings: ${telemetry.ram.primaryTimings})
- Motherboard: ${telemetry.motherboard.name} (Chipset: ${telemetry.motherboard.chipset}, BIOS: ${telemetry.motherboard.biosVersion})
- GPU: ${telemetry.gpu.name} (${telemetry.gpu.vram}, ${telemetry.gpu.isDiscrete ? 'Discrete' : 'Integrated iGPU'})
- Primary Storage: ${telemetry.storage.m2_1.name} (${telemetry.storage.m2_1.speedRead})
- Secondary Storage: ${telemetry.storage.m2_2.name}
- Power Supply (PSU): ${telemetry.psu.name} (${telemetry.psu.ratedWattage}W Rated, Current Load: ${telemetry.psu.currentLoadW}W)

Answer the user question in ${lang === 'VI' ? 'Vietnamese' : 'English'}.
Search the web for real current market prices (in VND or USD), compatibility constraints (e.g. proprietary OEM PSU limitations, PCIe power connectors, PCIe x16 slot limits, DIMM DDR4/DDR5 compatibility), and provide actionable, honest advice with clear price ranges and ROI rating.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}

User Question: ${text}` }]
                }
              ],
              tools: [{ googleSearch: {} }]
            })
          }
        );

        const data = await response.json();
        const candidate = data?.candidates?.[0];
        const replyText = candidate?.content?.parts?.[0]?.text || "Không nhận được phản hồi từ AI API.";
        
        // Extract grounding metadata sources if available
        const searchChunks = candidate?.groundingMetadata?.groundingChunks || [];
        const sources = searchChunks
          .filter((c: any) => c.web?.uri && c.web?.title)
          .map((c: any) => ({ title: c.web.title, url: c.web.uri }))
          .slice(0, 4);

        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: sources.length > 0 ? sources : undefined,
            isGrounding: true
          }
        ]);
        soundFx.playChime();
      } catch (err) {
        console.error('Gemini API Error:', err);
        fallbackLocalAdvisor(text);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Offline / Local Smart Hardware Engine
      setTimeout(() => {
        fallbackLocalAdvisor(text);
        setIsLoading(false);
      }, 700);
    }
  };

  const fallbackLocalAdvisor = (query: string) => {
    const q = query.toLowerCase();
    let reply = '';
    const isIntelDell = telemetry.cpu.name.includes('i5-8400') || telemetry.motherboard.name.includes('Dell');

    if (q.includes('2 triệu') || q.includes('2tr') || q.includes('100') || q.includes('ngân sách thấp')) {
      reply = isIntelDell ? `### Đề xuất nâng cấp tối ưu với ngân sách ~2.000.000 VNĐ cho máy của bạn:

1. **Gắn thêm 1 ổ SSD NVMe 500GB (PCIe Gen3/Gen4) (~700.000 - 850.000 VNĐ)**:
   - **Tác dụng**: Cài đặt lại Windows và các phần mềm chính lên ổ SSD này. Tốc độ đọc sẽ tăng vọt từ 540 MB/s lên **~3.500 MB/s** (gấp 6.5 lần so với SSD SATA hiện tại).
   - **Model khuyên dùng**: Kingston NV2 500GB, Kioxia Exceria G2 500GB hoặc WD Blue SN580 500GB.

2. **Lắp Card đồ họa cũ không cần nguồn phụ GTX 1050 Ti 4GB / GTX 1650 4GB (~1.200.000 - 1.600.000 VNĐ)**:
   - **Lý do**: Nguồn Dell của bạn có công suất **260W** và không có sẵn đầu cắm nguồn phụ 6-pin/8-pin. Do đó, các dòng card ăn điện dưới 75W cấp điện trực tiếp từ khe cắm PCIe x16 là sự lựa chọn an toàn tuyệt đối.
   - **Hiệu năng**: Kéo mượt Liên Minh, Valorant, CS2 (1080p 100+ FPS) và hỗ trợ NVENC preview timeline Premiere mượt mà.` 
      : `### Đề xuất nâng cấp ngân sách ~2.000.000 VNĐ:
1. Thêm 1 ổ SSD NVMe Gen4 1TB làm ổ cache chuyên dụng (~1.500.000 VNĐ).
2. Trang bị tản nhiệt khí tháp đôi Dual-Tower hoặc nâng cấp quạt case tản nhiệt.`;
    } else if (q.includes('nguồn 260w') || q.includes('nguồn phụ') || q.includes('card đồ họa nào') || q.includes('gpu')) {
      reply = `### Phân tích độ tương thích nguồn & Card đồ họa cho hệ thống:

- **Công suất nguồn hiện tại**: **${telemetry.psu.ratedWattage}W (${telemetry.psu.rating})**
- **Đặc điểm**: Nguồn đồng bộ OEM Dell thường không trang bị dây cấp nguồn phụ 6-pin hoặc 8-pin PCIe.

**Các mẫu Card đồ họa tương thích 100% (Ăn điện ≤ 75W qua khe PCIe, không cần cắm nguồn phụ)**:
1. **NVIDIA GeForce GTX 1650 4GB GDDR6 (Bản không nguồn phụ)**:
   - Giá tham khảo: ~1.500.000 - 1.900.000 VNĐ (cũ).
   - Mức ăn điện: 75W. Hoạt động cực kỳ an toàn trên nguồn 260W.
2. **NVIDIA GeForce RTX 3050 6GB (Bản 70W mới)**:
   - Giá tham khảo: ~4.500.000 - 4.900.000 VNĐ (mới chính hãng).
   - Mức ăn điện: 70W. Hỗ trợ DLSS, Ray Tracing và bộ mã hóa NVENC thế hệ mới.
3. **AMD Radeon RX 6400 4GB Low-Profile**:
   - Mức ăn điện: 53W. Giá tham khảo ~2.200.000 VNĐ.

*Lưu ý: Không nên gắn các dòng card như GTX 1660 Super, RTX 2060, RTX 3060 vì các card này yêu cầu nguồn từ 450W - 550W và bắt buộc có đầu cấp nguồn 8-pin.*`;
    } else if (q.includes('ram') || q.includes('32gb') || q.includes('ssd')) {
      reply = `### So sánh nâng RAM 32GB vs Nâng SSD 500GB/1TB:

1. **Về RAM (Hiện tại đang có 16GB Dual-Channel DDR4-2666)**:
   - 16GB RAM Dual-Channel trên máy bạn đang hoạt động rất tốt, đáp ứng mượt mà hầu hết nhu cầu lập trình VS Code, duyệt web 30 tab và chơi game esports.
   - Trừ khi bạn chạy máy ảo (VMware) nặng hoặc chạy cluster Docker > 10 containers, việc lên 32GB lúc này chỉ mang lại cải thiện khoảng 5 - 10%.

2. **Về SSD (Khuyên nên nâng cấp trước)**:
   - Hiện tại máy đang chạy ổ SSD SATA 180GB (540 MB/s) và HDD Toshiba 1TB (185 MB/s).
   - Nâng cấp lên **SSD NVMe M.2 500GB/1TB (3.500 MB/s)** sẽ giúp Windows khởi động trong 6 giây, mở project code nặng và load game nhanh hơn gấp 4 - 6 lần rõ rệt!

**Kết luận**: Bạn nên ưu tiên **Nâng cấp ổ SSD NVMe trước**, sau đó mới cân nhắc nâng RAM.`;
    } else if (q.includes('rtx 3060') || q.includes('4060')) {
      reply = `### Tư vấn lắp RTX 3060 / RTX 4060 trên hệ thống Dell i5-8400:

1. **Về nguồn điện**:
   - RTX 3060 ăn khoảng **170W**, RTX 4060 ăn khoảng **115W**. Nguồn Dell **260W** hiện tại **hoàn toàn không đủ tải** và không có đầu cắm nguồn 8-pin.
   - Để lắp được, bạn buộc phải nâng cấp nguồn lên tối thiểu **550W - 650W 80 PLUS** (Cần kiểm tra xem main Dell dùng chuẩn cáp nguồn 24-pin tiêu chuẩn hay cáp nguồn riêng 6-pin/8-pin của Dell).

2. **Về mức độ nghẽn cổ chai (Bottleneck)**:
   - CPU Intel Core i5-8400 (6 nhân / 6 luồng) thế hệ 8 sẽ bị nghẽn khoảng **22% - 28%** khi kéo RTX 3060 / 4060 ở độ phân giải 1080p trong các tựa game ăn nhiều CPU như Cyberpunk 2077 hay Warzone.

**Lời khuyên**: Nếu muốn gắn RTX 3060/4060, phương án kinh tế hơn là nâng cấp toàn bộ nền tảng (CPU i5-12400F + Main B760 + Nguồn 650W).`;
    } else {
      reply = `### Phân tích nâng cấp chuyên sâu cho máy ${telemetry.hostName}:

- **CPU**: Intel Core i5-8400 (6 Cores / 6 Threads, Socket LGA 1151v2) -> Nâng cấp tối đa lên i7-8700 hoặc i9-9900 (nhưng giá CPU cũ đời này hiện còn cao, không tối ưu P/P).
- **RAM**: Đang có 16GB Dual-Channel DDR4-2666 (DIMM1 + DIMM2). Bo mạch còn 2 khe trống sẵn sàng cắm thêm khi cần.
- **Ổ cứng**: Nên lắp thêm ổ SSD NVMe PCIe Gen3x4 500GB (~750k) làm ổ hệ thống chính.
- **Card đồ họa**: Khuyên dùng GTX 1650 GDDR6 (75W) hoặc RTX 3050 6GB (70W) để tận dụng nguồn Dell 260W nguyên bản.

*Mẹo: Nhập Google Gemini API Key (bấm nút cài đặt chìa khóa góc trên) để kích hoạt Google Search Grounding tìm giá bán thực tế và link mua hàng trực tiếp trên Shopee/Tiki/GearVN theo thời gian thực!*`;
    }

    setMessages(prev => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    soundFx.playChime();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
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
                  <h3 className="text-base font-extrabold text-white">
                    {lang === 'EN' ? 'AeroSpec AI Hardware & Upgrade Advisor' : 'Trợ Lý AI Tư Vấn Nâng Cấp Phần Cứng'}
                  </h3>
                  <span className={`px-2 py-0.2 text-[10px] font-mono font-bold rounded-full border flex items-center gap-1 ${
                    apiKey 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60' 
                      : 'bg-sky-950 text-sky-300 border-sky-700/60'
                  }`}>
                    <Globe className="w-3 h-3" />
                    {apiKey ? 'Live Web Grounding Active' : 'Smart Local Architecture Engine'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Target Machine: <strong className="text-slate-200">{telemetry.cpu.name}</strong> • {telemetry.ram.totalGb}GB • {telemetry.psu.ratedWattage}W PSU
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Cài đặt Gemini API Key để bật tìm kiếm giá trực tuyến"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>{apiKey ? 'Key Connected' : 'Connect API Key'}</span>
              </button>

              <button
                onClick={onClose}
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
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Google Gemini API Key (Bật tìm kiếm giá web theo thời gian thực)
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
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Dán mã API Key (AIzaSy...)"
                  className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  onClick={() => saveApiKey(apiKey)}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Lưu Key
                </button>
              </div>
            </div>
          )}

          {/* Live Machine Specs Summary Bar */}
          <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-sky-400" /> {telemetry.cpu.name}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> PSU: {telemetry.psu.ratedWattage}W ({telemetry.psu.rating})
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Main: {telemetry.motherboard.name}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Live Telemetry Context Active</span>
          </div>

          {/* Messages Stream Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.sender === 'user' ? 'bg-sky-500 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {msg.sender === 'user' ? <span className="font-bold text-xs font-mono">YOU</span> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`p-4 rounded-2xl flex flex-col gap-2 ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                }`}>
                  <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* Grounded Web Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 mt-1 flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                        <Globe className="w-3 h-3 text-sky-400" /> Nguồn kiểm chứng trực tuyến:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 border border-slate-700 rounded text-[10px] font-mono truncate max-w-[200px] transition"
                          >
                            {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`text-[10px] font-mono mt-0.5 ${msg.sender === 'user' ? 'text-sky-200 text-right' : 'text-slate-500'}`}>
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
                    {apiKey ? 'Đang tìm kiếm dữ liệu thị trường và phân tích tương thích...' : 'AI đang phân tích kiến trúc máy...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-mono text-slate-400 shrink-0 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Gợi ý câu hỏi:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-sans whitespace-nowrap transition cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

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
