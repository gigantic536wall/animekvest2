import React, { useRef, useState } from "react";
import { Crown, Shield, Settings, Users, AlertTriangle, Trophy, Upload, ArrowRightLeft } from "lucide-react";
import { compressTeamAvatar } from "./TeamSetupModal";

interface TeamHeaderBannerProps {
  user: any;
  players: Record<string, any>;
  teamsData: Record<string, any>;
  onOpenTeamSetup: () => void;
  onOpenLeaderboard?: () => void;
  isTeamSetupUnlocked?: boolean;
  isScoreVisible?: boolean;
  restPatch?: (path: string, data: any) => Promise<any>;
  onLeaderUpdate?: (leaderId: string | null, leaderNickname: string | null) => void;
}

export default function TeamHeaderBanner({
  user,
  players,
  teamsData,
  onOpenTeamSetup,
  onOpenLeaderboard,
  isTeamSetupUnlocked = true,
  isScoreVisible = false,
  restPatch,
  onLeaderUpdate
}: TeamHeaderBannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [quickNotice, setQuickNotice] = useState("");

  if (!user || user.isAdmin || user.team === undefined || user.team < 0) {
    return null;
  }

  const teamId = user.team;
  const currentTeam = teamsData?.[teamId] || {};
  const teamMembers: any[] = Object.values(players || {}).filter((p: any) => p.team === teamId);
  const isLeader = currentTeam.leaderId === user.id;
  const hasLeader = !!currentTeam.leaderId;
  const leaderMember: any = teamMembers.find((p: any) => p.id === currentTeam.leaderId);
  const leaderName = currentTeam.leaderNickname || leaderMember?.nickname;
  const otherMembers: any[] = teamMembers.filter((p: any) => p.id !== user.id);

  const showNotice = (msg: string) => {
    setQuickNotice(msg);
    setTimeout(() => setQuickNotice(""), 3500);
  };

  const handleQuickAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restPatch) return;
    if (!isLeader) {
      showNotice("🔒 Только капитан может менять аватарку команды");
      return;
    }
    setIsUploading(true);
    try {
      const compressed = await compressTeamAvatar(file, 256);
      await restPatch(`teams/${teamId}`, { avatar: compressed });
      showNotice("✅ Аватарка обновлена!");
    } catch (err) {
      console.error(err);
      showNotice("❌ Ошибка загрузки");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleQuickClaimLeader = async () => {
    if (!restPatch) return;
    try {
      await restPatch(`teams/${teamId}`, {
        leaderId: user.id,
        leaderNickname: user.nickname
      });
      if (onLeaderUpdate) onLeaderUpdate(user.id, user.nickname);
      showNotice("👑 Вы стали капитаном!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickTransfer = async (target: any) => {
    if (!restPatch || !target) return;
    const targetId = target.id || target._id;
    if (!targetId) {
      showNotice("❌ Ошибка: не найден ID игрока");
      return;
    }
    try {
      await restPatch(`teams/${teamId}`, {
        leaderId: targetId,
        leaderNickname: target.nickname
      });
      if (onLeaderUpdate) onLeaderUpdate(targetId, target.nickname);
      showNotice(`👑 Капитан передан: ${target.nickname}!`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 mb-4 relative">
      {/* Hidden file input for fast avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleQuickAvatarUpload}
        className="hidden"
      />

      {/* Left: Avatar + Team Name + Leader Info */}
      <div className="flex items-center gap-3">
        {/* Team Avatar (clickable if unlocked AND captain) */}
        <div 
          onClick={() => {
            if (!isLeader) {
              showNotice("🔒 Только капитан может менять аватарку команды");
              return;
            }
            if (isTeamSetupUnlocked) {
              fileInputRef.current?.click();
            } else {
              showNotice("🔒 Загрузка откроется после старта ведущим");
            }
          }}
          title={!isLeader ? "Только капитан может менять аватарку команды" : isTeamSetupUnlocked ? "Нажмите, чтобы загрузить аватарку команды с ПК" : "Ожидание старта игры"}
          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden border-2 bg-black/60 shrink-0 flex items-center justify-center shadow-lg relative group transition-all ${
            isTeamSetupUnlocked && isLeader ? "cursor-pointer hover:border-purple-400 hover:scale-105 border-purple-500/50" : "border-gray-600 opacity-80"
          }`}
        >
          {currentTeam.avatar ? (
            <img
              src={currentTeam.avatar}
              alt={`Команда ${teamId + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-purple-400 group-hover:text-purple-300">
              <Shield className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase">#{teamId + 1}</span>
            </div>
          )}

          {isTeamSetupUnlocked && isLeader && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
              Команда #{teamId + 1}
            </span>
            <span className="text-[10px] bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" />
              {teamMembers.length}/3
            </span>
            {quickNotice && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {quickNotice}
              </span>
            )}
          </div>

          <div className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap">
            {!isTeamSetupUnlocked ? (
              <span className="text-gray-400 text-[10px] italic">
                🔒 Подготовка команды откроется после старта ведущим
              </span>
            ) : hasLeader ? (
              <span className="flex items-center gap-1 font-bold">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                {isLeader ? (
                  <span className="text-emerald-400 font-black">Вы капитан (отвечаете на вопросы)</span>
                ) : (
                  <span className="text-gray-300">
                    Капитан: <strong className="text-amber-300">{leaderName}</strong>
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Капитан не выбран! (Без капитана нельзя отвечать)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        {/* Quick Avatar Upload button (ONLY FOR CAPTAIN) */}
        {isTeamSetupUnlocked && isLeader && !currentTeam.avatar && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all"
            title="Загрузить аватарку команды с вашего ПК"
          >
            <Upload className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">{isUploading ? "Загрузка..." : "Загрузить аватарку"}</span>
          </button>
        )}

        {/* Quick Claim Leader */}
        {isTeamSetupUnlocked && !hasLeader && (
          <button
            onClick={handleQuickClaimLeader}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Стать капитаном</span>
          </button>
        )}

        {/* Quick Transfer Leader if user is leader and there are teammates */}
        {isTeamSetupUnlocked && isLeader && otherMembers.length > 0 && (
          <div className="flex items-center gap-1">
            {otherMembers.map((m: any) => (
              <button
                key={m.id}
                onClick={() => handleQuickTransfer(m)}
                className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold px-2 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                title={`Передать капитанство игроку ${m.nickname}`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span className="truncate max-w-[80px]">Передать {m.nickname}</span>
              </button>
            ))}
          </div>
        )}

        {/* Leaderboard button (only if score is visible or admin) */}
        {onOpenLeaderboard && (user?.isAdmin || isScoreVisible) && (
          <button
            onClick={onOpenLeaderboard}
            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Открыть таблицу счёта команд"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Счёт команд</span>
          </button>
        )}

        {/* Full Team Setup Modal button */}
        {isTeamSetupUnlocked && (
          <button
            onClick={onOpenTeamSetup}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Штаб команды: полная настройка"
          >
            <Settings className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Штаб</span>
          </button>
        )}
      </div>
    </div>
  );
}
