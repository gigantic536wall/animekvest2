import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, Send, X, ChevronDown, Trash2, 
  Volume2, VolumeX, Sparkles, Smile, Shield
} from "lucide-react";

export interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  nickname: string;
  team: number; // 0..9, or -1 for admin
  isAdmin?: boolean;
  isCaptain: boolean; // true if this user is/was team captain
  timestamp: number;
}

interface GlobalChatWidgetProps {
  user: any;
  teamsData: Record<string, any>;
  restGet: (path: string) => Promise<{ data: any }>;
  restPut: (path: string, body: any) => Promise<any>;
  restDelete: (path: string) => Promise<any>;
}

// Цвета для команд для красивого оформления бейджей
const TEAM_COLORS: string[] = [
  "from-red-500/30 to-rose-600/30 border-rose-500/50 text-rose-300",
  "from-blue-500/30 to-indigo-600/30 border-blue-500/50 text-blue-300",
  "from-emerald-500/30 to-teal-600/30 border-emerald-500/50 text-emerald-300",
  "from-amber-500/30 to-yellow-600/30 border-amber-500/50 text-amber-300",
  "from-purple-500/30 to-fuchsia-600/30 border-purple-500/50 text-purple-300",
  "from-cyan-500/30 to-sky-600/30 border-cyan-500/50 text-cyan-300",
  "from-pink-500/30 to-rose-600/30 border-pink-500/50 text-pink-300",
  "from-lime-500/30 to-green-600/30 border-lime-500/50 text-lime-300",
  "from-orange-500/30 to-amber-600/30 border-orange-500/50 text-orange-300",
  "from-violet-500/30 to-indigo-600/30 border-violet-500/50 text-violet-300"
];

const QUICK_EMOJIS = ["👍", "🔥", "👑", "😂", "😱", "🎯", "👏", "⚡"];

export default function GlobalChatWidget({
  user,
  teamsData,
  restGet,
  restPut,
  restDelete
}: GlobalChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastKnownMsgIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);

  // Вычисляем, является ли текущий пользователь капитаном своей команды
  const isCurrentUserCaptain = Boolean(
    user &&
    !user.isAdmin &&
    user.team !== undefined &&
    user.team >= 0 &&
    (teamsData?.[user.team]?.leaderId === user.id || teamsData?.[String(user.team)]?.leaderId === user.id)
  );

  // Синхронизация сообщений из Firebase каждые 1.2 секунды
  useEffect(() => {
    let isSubscribed = true;

    const fetchMessages = async () => {
      try {
        const { data } = await restGet("gameState/chat");
        if (!isSubscribed) return;

        if (data && typeof data === "object") {
          const rawList: ChatMessage[] = Object.values(data);
          // Сортируем по времени (старые -> новые)
          rawList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

          // Ограничиваем историю последними 80 сообщениями
          const latestList = rawList.slice(-80);

          setMessages(prev => {
            const lastPrevId = prev.length > 0 ? prev[prev.length - 1].id : null;
            const lastNewId = latestList.length > 0 ? latestList[latestList.length - 1].id : null;

            if (lastNewId && lastNewId !== lastPrevId) {
              // Если чат закрыт и это не первая загрузка — увеличиваем счетчик непрочитанных
              if (!isOpen && !isFirstLoadRef.current) {
                const prevIds = new Set(prev.map(m => m.id));
                const newItems = latestList.filter(m => !prevIds.has(m.id) && m.authorId !== user?.id);
                if (newItems.length > 0) {
                  setUnreadCount(c => c + newItems.length);
                  if (soundEnabled) {
                    playNotificationBeep();
                  }
                }
              }
            }
            return latestList;
          });

          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
          }
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.warn("Error fetching chat:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1200);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [restGet, isOpen, soundEnabled, user?.id]);

  // Сброс счетчика непрочитанных при открытии чата
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen]);

  // Автоскролл вниз при добавлении сообщений
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Простой звуковой сигнал через Web Audio API
  const playNotificationBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // AudioContext may be blocked before user interaction
    }
  };

  // Отправка сообщения
  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || !user || isSending) return;

    if (textToSend.length > 250) {
      alert("Сообщение слишком длинное (максимум 250 символов)");
      return;
    }

    setIsSending(true);
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newMsg: ChatMessage = {
      id: msgId,
      text: textToSend,
      authorId: user.id || `anon_${Date.now()}`,
      nickname: user.nickname || "Гость",
      team: user.isAdmin ? -1 : (user.team !== undefined && user.team >= 0 ? user.team : -1),
      isAdmin: Boolean(user.isAdmin),
      isCaptain: isCurrentUserCaptain,
      timestamp: Date.now()
    };

    // Оптимистичное обновление
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
    setShowEmojiPicker(false);

    try {
      await restPut(`gameState/chat/${msgId}`, newMsg);
      scrollToBottom();
    } catch (err) {
      console.error("Error sending chat message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Очистка чата ведущим
  const handleClearChat = async () => {
    if (!user?.isAdmin) return;
    if (!confirm("Вы уверены, что хотите полностью очистить историю сообщений общего чата?")) return;
    try {
      setMessages([]);
      await restDelete("gameState/chat");
    } catch (err) {
      console.error("Error clearing chat:", err);
    }
  };

  const formatTime = (ts: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* КНОПКА-ТРИГГЕР (ЕСЛИ ЧАТ ЗАКРЫТ) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative group bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-4 sm:px-5 py-3 rounded-full shadow-2xl shadow-purple-900/50 border-2 border-purple-400/60 flex items-center gap-2.5 cursor-pointer backdrop-blur-md transition-all"
          title="Открыть общий чат игроков"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce shadow-md">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs uppercase tracking-wider font-extrabold hidden sm:inline">
            Общий чат
          </span>
          {messages.length > 0 && (
            <span className="text-[10px] font-mono opacity-80 bg-black/30 px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </motion.button>
      )}

      {/* РАСКРЫТОЕ ОКНО ЧАТА */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-2rem)] sm:w-96 max-w-[420px] h-[520px] max-h-[82vh] bg-slate-950/95 border-2 border-purple-500/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* ШАПКА ЧАТА */}
            <div className="p-3.5 bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border-b border-purple-500/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-200 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
                      Общий чат викторины
                    </h3>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="В сети" />
                  </div>
                  <span className="text-[10px] text-gray-400 block truncate">
                    {user?.isAdmin ? "Режим ведущего 👑" : user ? `Вы: ${user.nickname} ${isCurrentUserCaptain ? "★ (Капитан)" : ""}` : "Гость"}
                  </span>
                </div>
              </div>

              {/* Кнопки управления шапки */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    soundEnabled
                      ? "text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                      : "text-gray-500 border-white/5 hover:bg-white/5"
                  }`}
                  title={soundEnabled ? "Звук уведомлений включен" : "Звук уведомлений выключен"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {user?.isAdmin && (
                  <button
                    onClick={handleClearChat}
                    className="p-1.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
                    title="Очистить всю историю чата"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Свернуть чат"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* СПИСОК СООБЩЕНИЙ */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                    <Sparkles className="w-6 h-6 text-purple-400/60" />
                  </div>
                  <p className="font-bold text-gray-300">Чат пока пуст</p>
                  <p className="text-[11px] text-gray-400 max-w-[200px]">
                    Напишите первое сообщение или поприветствуйте команды!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = user?.id && msg.authorId === user.id;
                  const isMsgAdmin = Boolean(msg.isAdmin || msg.team === -1);
                  const teamColorClass = !isMsgAdmin && msg.team >= 0
                    ? TEAM_COLORS[msg.team % TEAM_COLORS.length]
                    : "from-purple-900/40 to-pink-900/40 border-purple-500/40 text-purple-200";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${isMe ? "items-end" : "items-start"}`}
                    >
                      {/* Строка автора: Команда, Звездочка (если капитан), Никнейм, Время */}
                      <div className="flex items-center gap-1.5 text-[10px] px-1 flex-wrap">
                        {/* 1. Бейдж команды */}
                        {isMsgAdmin ? (
                          <span className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-pink-200 border border-pink-500/40 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-0.5">
                            👑 Ведущий
                          </span>
                        ) : msg.team >= 0 ? (
                          <span className={`bg-gradient-to-r ${teamColorClass} px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 border shadow-sm`}>
                            <Shield className="w-2.5 h-2.5 shrink-0" />
                            <span>{(teamsData?.[msg.team]?.name || teamsData?.[String(msg.team)]?.name) || `Команда ${msg.team + 1}`}</span>
                          </span>
                        ) : (
                          <span className="bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                            Лобби
                          </span>
                        )}

                        {/* 2. Звездочка капитана команды */}
                        {msg.isCaptain && !isMsgAdmin && (
                          <span
                            className="text-amber-300 font-black text-sm inline-flex items-center gap-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse"
                            title="Капитан команды"
                          >
                            ★ <span className="text-[9px] font-bold uppercase text-amber-200">Капитан</span>
                          </span>
                        )}

                        {/* 3. Никнейм */}
                        <span className={`font-black ${isMe ? "text-purple-300" : isMsgAdmin ? "text-amber-300 font-extrabold" : "text-white"}`}>
                          {msg.nickname}{isMe && " (Вы)"}:
                        </span>

                        {/* 4. Время */}
                        <span className="text-[9px] text-gray-400 font-mono">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Текст сообщения */}
                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl break-words text-xs leading-relaxed shadow-md ${
                          isMe
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm border border-purple-400/40 shadow-purple-900/30"
                            : isMsgAdmin
                            ? "bg-gradient-to-r from-amber-950/70 via-purple-950/70 to-slate-900 border border-amber-500/40 text-amber-100 rounded-tl-sm shadow-amber-950/30"
                            : "bg-slate-900/90 text-gray-200 border border-white/10 rounded-tl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* БЫСТРЫЕ ЭМОДЗИ */}
            {showEmojiPicker && (
              <div className="px-3 py-1.5 bg-black/60 border-t border-white/10 flex items-center justify-between gap-1 overflow-x-auto shrink-0">
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleSendMessage(emoji)}
                    className="p-1 hover:bg-white/10 rounded-lg text-sm transition-all hover:scale-125 cursor-pointer"
                    title={`Отправить ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* ПОЛЕ ВВОДА СООБЩЕНИЯ */}
            <div className="p-3 bg-slate-900/90 border-t border-purple-500/30 shrink-0">
              {user ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                      showEmojiPicker
                        ? "bg-purple-600/40 border-purple-400 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Быстрые эмодзи"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isCurrentUserCaptain
                        ? "★ Написать в чат от капитана..."
                        : "Написать сообщение в общий чат..."
                    }
                    maxLength={250}
                    className="flex-1 bg-black/60 border border-purple-500/40 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:hover:from-purple-600 disabled:hover:to-pink-600 text-white p-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Отправить (Enter)"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="text-center py-1.5 text-[11px] text-gray-400">
                  🔒 Войдите под ником, чтобы писать в чат
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
