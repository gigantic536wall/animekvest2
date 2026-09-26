
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  X,
  Trophy,
  Flame,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Award,
  Trash2,
  Sparkles,
  ShieldCheck,
  Ban
} from "lucide-react";

interface BingoRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BingoRulesModal: React.FC<BingoRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-purple-500/40 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Gradient Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 shrink-0" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 shrink-0 bg-white/5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl shadow-lg shadow-purple-900/50">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Раунд 8 • Официальный регламент
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                  <span>Правила «Аниме-Бинго (4×4)»</span>
                  <Sparkles className="w-5 h-5 text-amber-400 hidden sm:inline" />
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors border border-white/10"
              title="Закрыть правила"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-sm text-slate-200 custom-scrollbar">
            {/* Quick Summary Pill Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-purple-300 font-bold uppercase tracking-wider">Размер карточки</div>
                <div className="text-lg font-black text-white mt-0.5">4 × 4 (16 ячеек)</div>
              </div>
              <div className="bg-pink-950/40 border border-pink-500/30 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-pink-300 font-bold uppercase tracking-wider">Выдача ведущего</div>
                <div className="text-lg font-black text-white mt-0.5">По 2 аниме (из 32)</div>
              </div>
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Первая линия</div>
                <div className="text-lg font-black text-amber-300 mt-0.5">+12 баллов</div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Всё поле (Фулл)</div>
                <div className="text-lg font-black text-emerald-300 mt-0.5">+24 балла</div>
              </div>
            </div>

            {/* Mechanics Section Grid */}
            <div className="space-y-4">
              {/* 1. Поле и критерии */}
              <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2.5 text-base font-black text-purple-300">
                  <LayoutGrid className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>1. Карточка команды и критерии (4×4)</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-xs sm:text-sm pl-7 list-disc">
                  <li>
                    Каждой команде генерируется <strong className="text-white">уникальная карточка 4×4 (16 ячеек)</strong> из сбалансированного банка в 50 аниме-критериев (жанры, студии, особенности персонажей, сеттинг, тропы).
                  </li>
                  <li>
                    <strong className="text-white">Никакого ручного набора текста!</strong> Игроки кликают по аниме из доступного списка и затем кликают по ячейке с подходящим критерием.
                  </li>
                </ul>
              </div>

              {/* 2. Выдача и СГОРАНИЕ ТАЙТЛОВ */}
              <div className="bg-pink-950/20 p-4 sm:p-5 rounded-2xl border border-pink-500/30 space-y-2 relative overflow-hidden">
                <div className="flex items-center gap-2.5 text-base font-black text-pink-300">
                  <Flame className="w-5 h-5 text-pink-400 shrink-0 animate-pulse" />
                  <span>2. Выдача тайтлов и механика СГОРАНИЯ</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 ml-auto">
                    Важно
                  </span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-xs sm:text-sm pl-7 list-disc">
                  <li>
                    Всего за игру ведущий открывает случайный пул из <strong className="text-white">32 аниме</strong>.
                  </li>
                  <li>
                    Ведущий нажимает кнопку и открывает <strong className="text-pink-300 font-bold">ровно по 2 аниме за раз</strong> (всего 16 ходов).
                  </li>
                  <li>
                    <span className="text-pink-200 font-bold bg-pink-500/20 px-1.5 py-0.5 rounded">МЕХАНИКА СГОРАНИЯ:</span> Для расстановки командам доступна <strong className="text-white">ТОЛЬКО текущая активная пара из 2 аниме</strong>!
                  </li>
                  <li>
                    Если ведущий нажимает «Выдать следующие 2 аниме», а команда не успела поставить тайтл из предыдущей пары — этот тайтл <strong className="text-rose-400">безвозвратно СГОРАЕТ</strong> из списка доступных! Действовать нужно синхронно и решительно.
                  </li>
                </ul>
              </div>

              {/* 3. Правила расстановки и ячеек */}
              <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2.5 text-base font-black text-blue-300">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                  <span>3. Правила расстановки в ячейки</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-xs sm:text-sm pl-7 list-disc">
                  <li>
                    <strong className="text-white">Одно аниме — одна ячейка:</strong> один тайтл может быть использован в карточке вашей команды только 1 раз (нельзя дублировать тайтл в разные клетки).
                  </li>
                  <li>
                    <strong className="text-white">Занятая ячейка защищена:</strong> если в ячейку уже помещено аниме, поверх него ничего нельзя поставить или перетащить.
                  </li>
                  <li>
                    <strong className="text-white">Удаление (кнопка 🗑️):</strong> если вы передумали, аниме можно удалить из ячейки. <em>Но внимание:</em> поставить его обратно или в другую клетку можно только в том случае, если этот тайтл всё ещё входит в текущую активную пару!
                  </li>
                </ul>
              </div>

              {/* 4. Начисление баллов (Линии и Фулл) */}
              <div className="bg-amber-950/20 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2.5 text-base font-black text-amber-300">
                  <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>4. Начисление баллов и условия победы</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-xs sm:text-sm pl-7 list-disc">
                  <li>
                    <strong className="text-amber-300">Учитываются ТОЛЬКО строки и столбцы!</strong> Горизонтальные ряды (4 ячейки) и вертикальные колонки (4 ячейки).
                  </li>
                  <li>
                    <span className="text-rose-300 font-bold flex items-center gap-1.5 inline-flex">
                      <Ban className="w-3.5 h-3.5" /> Диагонали НЕ считаются!
                    </span>
                  </li>
                  <li>
                    <strong className="text-white">Первая закрытая линия (строка или столбец):</strong> даёт <strong className="text-amber-400 font-bold">+12 баллов</strong>. Баллы за линию начисляются один раз.
                  </li>
                  <li>
                    <strong className="text-white">Игра НЕ заканчивается после первой линии!</strong> Команда продолжает собирать оставшиеся клетки.
                  </li>
                  <li>
                    <strong className="text-white">Полное закрытие карточки (все 16 ячеек):</strong> даёт дополнительно <strong className="text-pink-400 font-black">+24 балла</strong>! После подтверждения полного закрытия раунд для команды завершается.
                  </li>
                </ul>
              </div>

              {/* 5. Проверка ведущим и ШТРАФЫ */}
              <div className="bg-rose-950/20 p-4 sm:p-5 rounded-2xl border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2.5 text-base font-black text-rose-300">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>5. Проверка ведущим и штрафы за ошибки</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-xs sm:text-sm pl-7 list-disc">
                  <li>
                    Собрав линию или всё поле, команда нажимает кнопку <strong className="text-white">«Отправить на проверку»</strong>. Карточка блокируется на время инспекции.
                  </li>
                  <li>
                    Ведущий проверяет соответствие аниме критериям ячеек. При обнаружении ошибок ведущий может выбрать <strong className="text-white">сразу несколько ошибочных ячеек</strong>.
                  </li>
                  <li>
                    <strong className="text-rose-400">Штраф за ошибку:</strong> за каждую неправильную ячейку со счёта команды списывается <strong className="text-rose-300 font-bold">−3 балла</strong>.
                  </li>
                  <li>
                    Неверные аниме удаляются из указанных ячеек, карточка возвращается команде, а ячейки снова становятся пустыми — туда можно будет поставить подходящие аниме из будущих раздач.
                  </li>
                </ul>
              </div>

              {/* 6. Окончание раунда */}
              <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2.5 text-base font-black text-slate-300">
                  <Layers className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>6. Окончание раунда</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 pl-7">
                  Раунд продолжается до тех пор, пока не будут открыты все 32 аниме из пула, либо пока ведущий не переведёт игру к следующему этапу.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>💡 Правила всегда можно открыть снова по кнопке</span>
              <span className="font-bold text-purple-300">«📖 Правила раунда»</span>
              <span>в шапке экрана.</span>
            </div>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-lg shadow-purple-950/60 transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Всё понятно, к игре!</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
