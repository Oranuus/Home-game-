import React, { useState } from 'react';
import { BookOpen, FileText, GitBranch, CheckCircle2, Lock, Sparkles, X, ChevronRight, Skull, Footprints, KeyRound } from 'lucide-react';
import { DiaryEntry, EndingNode, RunNote } from '../game/diaryState';

interface TabbyDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  diaryEntries: DiaryEntry[];
  runNotes: RunNote[];
  endingsTree: EndingNode[];
  initialTab?: 'diary' | 'notes' | 'tree';
}

export const TabbyDiaryModal: React.FC<TabbyDiaryModalProps> = ({
  isOpen,
  onClose,
  diaryEntries,
  runNotes,
  endingsTree,
  initialTab = 'diary',
}) => {
  const [activeTab, setActiveTab] = useState<'diary' | 'notes' | 'tree'>(initialTab);

  if (!isOpen) return null;

  const completedCount = endingsTree.filter((e) => e.isCompleted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#130f17] border-2 border-[#82623a]/70 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Antique Book Spine & Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-[#211728] via-[#1a1221] to-[#211728] border-b border-[#5a4225]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#352219] border border-[#a17846] flex items-center justify-center text-amber-300 shadow-inner">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-pixel text-amber-300 tracking-wide">
                  مذكرات تابي (Tabby's Diary)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-pixel bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {completedCount} / 3 نهايات مكتملة
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                سجل القصة، ملاحظات الدور الحالية، وشجرة النهايات المتفرعة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
            aria-label="إغلاق المذكرات"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex border-b border-slate-800/80 bg-[#16121c]/90 px-4 py-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('diary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-pixel transition-all ${
              activeTab === 'diary'
                ? 'bg-[#4a321d] text-amber-200 border border-[#c4975d] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>المذكرات ({diaryEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-pixel transition-all ${
              activeTab === 'notes'
                ? 'bg-[#4a321d] text-amber-200 border border-[#c4975d] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ملاحظات الدور ({runNotes.length})</span>
            {runNotes.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-pixel transition-all ${
              activeTab === 'tree'
                ? 'bg-[#4a321d] text-amber-200 border border-[#c4975d] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>شجرة النهايات (3)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-gradient-to-b from-[#130f17] to-[#0c0910]">
          {/* TAB 1: PERMANENT DIARY (المذكرات) */}
          {activeTab === 'diary' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-2xl text-[11px] text-amber-200/90 leading-relaxed font-sans">
                🕯️ <strong>المذكرات الدائمة</strong>: صفحات ثابتة تروي قصة تابي وهواجسها داخل هذا البيت الفيكتوري. تكبر وتزداد كتابات تابي مع إنجاز كل نهاية جديدة!
              </div>

              <div className="space-y-3">
                {diaryEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      entry.isEndingRecord
                        ? 'bg-gradient-to-r from-[#2c1d29] to-[#1e1520] border-amber-500/50 shadow-md'
                        : 'bg-[#18131d] border-[#38261e]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-pixel text-xs">{entry.title}</span>
                        {entry.isEndingRecord && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-pixel bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            نهاية مكتملة
                          </span>
                        )}
                      </div>
                      {entry.date && (
                        <span className="text-[10px] text-slate-500 font-mono">{entry.date}</span>
                      )}
                    </div>

                    {/* Exact Quote Container with Vintage Calligraphy Accent */}
                    <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-amber-100 font-mono text-xs sm:text-[13px] leading-relaxed italic border-l-4 border-l-amber-500 my-2">
                      "{entry.quote}"
                    </div>

                    {entry.loreAr && (
                      <p className="text-xs text-slate-400 font-sans leading-normal">
                        {entry.loreAr}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CURRENT RUN NOTES (ملاحظات الدور) */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-2xl text-[11px] text-cyan-200/90 leading-relaxed font-sans">
                🔍 <strong>ملاحظات الدور</strong>: خواطر وإشارات تسجلها تابي تلقائياً عند فحص أو التقاط عناصر معينة أثناء دورك الحالي لإرشادك داخل المنزل.
              </div>

              {runNotes.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-pixel">
                    لا توجد ملاحظات مسجلة في هذا الدور حتى الآن
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans max-w-sm mx-auto">
                    ابحثي داخل المطبخ وخزائن المنزل، وعند العثور على أداة المنبل (النبالة) ستسجل تابي ملاحظتها الأولى هنا!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {runNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-2xl bg-[#141b24] border border-cyan-800/40 space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 text-cyan-400 font-pixel text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ملاحظة تابي النشطة:</span>
                      </div>
                      <div className="p-3 bg-black/50 rounded-xl border border-slate-800 text-cyan-200 font-mono text-xs sm:text-sm italic">
                        "{note.text}"
                      </div>
                      {note.subtextAr && (
                        <p className="text-[11px] text-slate-400 font-sans">
                          {note.subtextAr}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BRANCHING ENDINGS TREE (شجرة النهايات المتفرعة) */}
          {activeTab === 'tree' && (
            <div className="space-y-5">
              <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-2xl text-[11px] text-purple-200/90 leading-relaxed font-sans">
                🌿 <strong>نظام النهايات المتفرعة</strong>: بعض النهايات يمكن إنجازها مباشرة، بينما نهايات أخرى تظل مقفلة حتى تنهي مسارات سابقة لفتحها!
              </div>

              {/* Visual Branching Nodes */}
              <div className="relative pl-2 sm:pl-4 space-y-6">
                {/* Root node */}
                <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-2xl max-w-md flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-300 font-pixel text-xs">
                    00
                  </div>
                  <div>
                    <h4 className="text-xs font-pixel text-slate-200">بداية الليلة: 11:50 PM</h4>
                    <p className="text-[10px] text-slate-400 font-sans">استيقاظ تابي في السرير وسط الظلام</p>
                  </div>
                </div>

                {/* Branch Connector Lines */}
                <div className="space-y-4 pt-1">
                  {endingsTree.map((node) => {
                    return (
                      <div
                        key={node.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          node.isCompleted
                            ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                            : node.isUnlocked
                            ? 'bg-[#18131d] border-amber-500/40'
                            : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-pixel text-xs font-bold ${
                                node.isCompleted
                                  ? 'bg-emerald-500 text-slate-950'
                                  : node.isUnlocked
                                  ? 'bg-amber-500/80 text-slate-950'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              0{node.number}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xs sm:text-sm font-pixel text-white">
                                  {node.titleAr}
                                </h3>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({node.titleEn})
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-400/90 font-sans">
                                {node.subtitleAr}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {node.isCompleted ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-pixel bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                مكتملة ✅
                              </span>
                            ) : node.isUnlocked ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-pixel bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                متاحة الآن ⚡
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-pixel bg-rose-950/40 text-rose-300 border border-rose-800/50 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5 text-rose-400" />
                                مقفلة 🔒
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 font-sans leading-relaxed mb-2">
                          {node.descriptionAr}
                        </p>

                        <div className="p-2.5 bg-black/40 rounded-xl border border-slate-800/80 text-[11px] font-sans flex items-start gap-1.5 text-slate-300">
                          <span className="text-amber-400 font-bold shrink-0">طريقة الإنجاز:</span>
                          <span>{node.requirementAr}</span>
                        </div>

                        {node.prerequisites.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-purple-300 font-sans">
                            <GitBranch className="w-3 h-3 text-purple-400" />
                            <span>المسار المتفرع: يرتبط بإكمال النهاية 1 أو النهاية 2 أولاً.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#130f17] border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-sans">
            اضغط [ESC] أو الزر العلوي للعودة إلى اللعبة
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-xs font-bold transition-all shadow-md"
          >
            متابعة اللعب
          </button>
        </div>
      </div>
    </div>
  );
};
