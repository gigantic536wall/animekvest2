import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Crown, Medal, Shield, Users, X, Sparkles } from "lucide-react";

interface TeamLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Record<string, any>;
  teamsData: Record<string, any>;
  getPlayerScore: (player: any) => number;
  TOTAL_TEAMS: number;
  isAdmin?: boolean;
}

export default function TeamLeaderboardModal({
  isOpen,
  onClose,
  players,
  teamsData,
  getPlayerScore,
  TOTAL_TEAMS,
  isAdmin
}: TeamLeaderboardModalProps) {
  if (!isOpen) return null;

  // Build team leaderboards: only teams with at least 1 player
  const teamsList: Array<{
    teamId: number;
    teamData: any;
    members: any[];
    totalScore: number;
    leaderNickname?: string;
  }> = [];

  for (let t = 0; t < TOTAL_TEAMS; t++) {
    const members: any[] = Object.values(players || {}).filter((p: any) => p.team === t);
    if (members.length === 0) continue;

    const tData = teamsData?.[t] || {};
    const totalScore = members.reduce((sum: number, p: any) => sum + getPlayerScore(p), 0);
    const leaderMember: any = members.find((p: any) => p.id === tData.leaderId);
    const leaderNickname = tData.leaderNickname || leaderMember?.nickname;

    teamsList.push({
      teamId: t,
      teamData: tData,
      members,
      totalScore,
      leaderNickname
    });
  }

  // Sort descending by total score
  teamsList.sort((a, b) => b.totalScore - a.totalScore);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,#7e22ce_0%,transparent_70%)]" />
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative z-10 max-w-4xl w-full bg-slate-900/90 border border-purple-500/40 rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-6 my-auto"
        >
          {/* Header */}
          <div className="text-center relative">
            {isAdmin && (
              <button
                onClick={onClose}
                className="absolute top-0 right-0 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer"
                title="Закрыть"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 px-5 py-1.5 rounded-full border border-purple-500/40 mb-3 shadow-lg"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-purple-300 font-black uppercase tracking-widest text-xs">
                Командная битва
              </span>
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight italic flex items-center justify-center gap-3">
              <span>Таблица Счёта Команд</span>
              <Sparkles className="w-7 h-7 text-amber-400" />
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              Результаты всех команд по итогам раундов
            </p>
          </div>

          {/* Teams Leaderboard List */}
          <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-2 custom-scrollbar">
            {teamsList.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-medium">
                Пока нет зарегистрированных игроков в командах
              </div>
            ) : (
              teamsList.map((team, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                return (
                  <motion.div
                    key={team.teamId}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.07 }}
                    className={`relative p-5 sm:p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                      isFirst
                        ? "bg-gradient-to-r from-amber-950/60 via-purple-950/50 to-slate-900 border-amber-400 shadow-xl shadow-amber-500/10"
                        : isSecond
                        ? "bg-gradient-to-r from-slate-800/80 via-purple-950/40 to-slate-900 border-slate-300 shadow-lg"
                        : isThird
                        ? "bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-600/70 shadow-lg"
                        : "bg-white/5 border-white/10 hover:border-purple-500/30"
                    }`}
                  >
                    {/* Rank + Avatar + Name + Members */}
                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      {/* Rank Badge */}
                      <div className="shrink-0 flex items-center justify-center">
                        {isFirst ? (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30">
                            <Crown className="w-7 h-7 text-black fill-black" />
                          </div>
                        ) : isSecond ? (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-100 text-black flex items-center justify-center font-black text-xl shadow-md">
                            2
                          </div>
                        ) : isThird ? (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                            3
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-white/10 text-gray-400 flex items-center justify-center font-black text-sm">
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Team Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-black/60 shadow-lg ${
                            isFirst
                              ? "border-amber-400 shadow-amber-500/20"
                              : isSecond
                              ? "border-slate-300"
                              : isThird
                              ? "border-amber-600"
                              : "border-purple-500/40"
                          }`}
                        >
                          {team.teamData.avatar ? (
                            <img
                              src={team.teamData.avatar}
                              alt={`Аватарка Команда ${team.teamId + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-purple-400">
                              <Shield className="w-8 h-8" />
                              <span className="text-[10px] font-black mt-0.5">#{team.teamId + 1}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Team Info & Members */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Команда #{team.teamId + 1}
                          </h3>
                          {isFirst && (
                            <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-black shadow-md">
                              Лидер игры
                            </span>
                          )}
                        </div>

                        {/* Player Chips */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {team.members.map((member) => {
                            const isMemberLeader = team.teamData.leaderId === member.id;
                            return (
                              <span
                                key={member.id}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 border transition-all ${
                                  isMemberLeader
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-black shadow-sm"
                                    : "bg-white/10 text-gray-200 border-white/10"
                                }`}
                              >
                                {isMemberLeader && <span>👑</span>}
                                <span>{member.nickname}</span>
                                {isMemberLeader && (
                                  <span className="text-[9px] uppercase tracking-wider opacity-80 font-normal">
                                    (Капитан)
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Team Score */}
                    <div className="sm:text-right shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                      <span className="text-xs uppercase font-bold text-gray-400 sm:hidden">
                        Счёт команды:
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                            isFirst
                              ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500"
                              : isSecond
                              ? "text-slate-200"
                              : isThird
                              ? "text-amber-500"
                              : "text-purple-300"
                          }`}
                        >
                          {team.totalScore}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          б.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-3.5 px-8 rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 cursor-pointer"
            >
              {isAdmin ? "Скрыть таблицу для всех" : "Закрыть просмотр"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
