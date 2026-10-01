import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Upload, Shield, Users, CheckCircle2, AlertCircle, ArrowRightLeft, X, Trash2 } from "lucide-react";

export const compressTeamAvatar = (file: File, maxSize = 256): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
  });
};

interface TeamSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  players: any;
  teamsData: Record<string, any>;
  restPatch: (path: string, data: any) => Promise<any>;
  onLeaderUpdate?: (leaderId: string | null, leaderNickname: string | null) => void;
}

export default function TeamSetupModal({
  isOpen,
  onClose,
  user,
  players,
  teamsData,
  restPatch,
  onLeaderUpdate
}: TeamSetupModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("");

  if (!isOpen || !user || user.isAdmin || user.team === undefined || user.team < 0) {
    return null;
  }

  const teamId = user.team;
  const currentTeam = teamsData?.[teamId] || {};
  const teamMembers: any[] = Object.values(players || {}).filter((p: any) => p.team === teamId);
  const isLeader = currentTeam.leaderId === user.id;
  const hasLeader = !!currentTeam.leaderId;
  const leaderPlayer: any = teamMembers.find((p: any) => p.id === currentTeam.leaderId);
  const otherMembers = teamMembers.filter((p: any) => p.id !== user.id);

  const showTempStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3500);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressedDataUrl = await compressTeamAvatar(file, 256);
      await restPatch(`teams/${teamId}`, { avatar: compressedDataUrl });
      showTempStatus("✅ Аватарка команды успешно обновлена!");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      showTempStatus("❌ Ошибка при загрузке картинки");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await restPatch(`teams/${teamId}`, { avatar: null });
      showTempStatus("Аватарка удалена");
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimLeader = async () => {
    try {
      await restPatch(`teams/${teamId}`, {
        leaderId: user.id,
        leaderNickname: user.nickname
      });
      if (onLeaderUpdate) onLeaderUpdate(user.id, user.nickname);
      showTempStatus("👑 Вы стали лидером команды!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async (targetId: string) => {
    const target = teamMembers.find((p: any) => p.id === targetId || p._id === targetId);
    if (!target) return;
    const finalTargetId = target.id || targetId;
    try {
      await restPatch(`teams/${teamId}`, {
        leaderId: finalTargetId,
        leaderNickname: target.nickname
      });
      if (onLeaderUpdate) onLeaderUpdate(finalTargetId, target.nickname);
      setTransferTargetId("");
      showTempStatus(`👑 Лидерство передано игроку ${target.nickname}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResign = async () => {
    try {
      await restPatch(`teams/${teamId}`, {
        leaderId: null,
        leaderNickname: null
      });
      if (onLeaderUpdate) onLeaderUpdate(null, null);
      showTempStatus("Вы сложили полномочия лидера");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
              Командный штаб
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Команда #{teamId + 1}
            </h2>
            <p className="text-xs text-gray-400">
              Состав: {teamMembers.length} / 3 игроков
            </p>
          </div>

          {statusMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-purple-600/30 border border-purple-500/50 rounded-2xl text-center text-xs font-bold text-white shadow-lg"
            >
              {statusMsg}
            </motion.div>
          )}

          {/* Section 1: Team Avatar */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-black/50 shadow-lg shadow-purple-900/30 flex items-center justify-center">
                {currentTeam.avatar ? (
                  <img
                    src={currentTeam.avatar}
                    alt={`Аватарка Команды ${teamId + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-purple-400">
                    <Shield className="w-10 h-10 mb-1" />
                    <span className="text-[10px] font-black">#{teamId + 1}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <h4 className="text-sm font-black text-white">Аватарка команды</h4>
              <p className="text-[11px] text-gray-400">
                Загрузите картинку с вашего ПК. Её будут видеть все игроки в таблице лидеров.
              </p>
              {isLeader ? (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? "Загрузка..." : "Загрузить с ПК"}</span>
                  </button>
                  {currentTeam.avatar && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="text-gray-400 hover:text-red-400 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                      title="Удалить аватар"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-1">
                  <span className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Только капитан команды может менять аватарку</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Team Leader */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                Капитан команды
              </span>
              {hasLeader ? (
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Назначен
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  Свободно
                </span>
              )}
            </div>

            {hasLeader ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👑</span>
                    <div>
                      <span className="text-sm font-black text-white">
                        {currentTeam.leaderNickname || leaderPlayer?.nickname || "Игрок"}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {isLeader ? "Это вы (вы отправляете ответы команды)" : "Отвечает за отправку ответов"}
                      </span>
                    </div>
                  </div>
                  {isLeader && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                      Вы капитан
                    </span>
                  )}
                </div>

                {/* Leader Controls: Transfer or Resign */}
                {isLeader && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-[11px] font-bold text-gray-300">
                      Передать лидерство сокоманднику:
                    </p>
                    {otherMembers.length === 0 ? (
                      <p className="text-[10px] text-gray-500 italic">
                        В вашей команде пока нет других игроков для передачи лидерства.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {otherMembers.map((member: any) => (
                          <button
                            key={member.id}
                            onClick={() => handleTransfer(member.id)}
                            className="bg-purple-600/30 hover:bg-purple-600/60 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Передать {member.nickname}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="pt-1">
                      <button
                        onClick={handleResign}
                        className="text-[11px] text-gray-400 hover:text-red-400 underline transition-all cursor-pointer"
                      >
                        Снять с себя роль капитана
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center space-y-3">
                <p className="text-xs text-amber-200 font-medium">
                  В вашей команде ещё не выбран капитан! Без капитана команда не сможет отправлять ответы на вопросы викторины.
                </p>
                <button
                  onClick={handleClaimLeader}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 mx-auto shadow-lg shadow-amber-900/40 active:scale-95 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Стать капитаном команды</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Members list */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Игроки в команде ({teamMembers.length} из 3):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {teamMembers.map((member: any) => {
                const isMemberLeader = currentTeam.leaderId === member.id;
                const isMe = member.id === user.id;
                return (
                  <div
                    key={member.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-1 text-xs font-bold ${
                      isMemberLeader
                        ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
                        : "bg-black/30 border-white/10 text-white"
                    }`}
                  >
                    <span className="truncate">
                      {member.nickname} {isMe && "(Вы)"}
                    </span>
                    {isMemberLeader && <span>👑</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Close button at bottom */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Закрыть окно
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
