import React, { useState, useEffect } from "react";
import { Task, AIHelpContent } from "../types";
import { Sparkles, X, Code, HelpCircle, BookOpen, UserCheck, Briefcase, Copy, Check, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIHelpDrawerProps {
  task: Task | null;
  onClose: () => void;
  occupation: string;
}

const HELP_OPTIONS = [
  { value: "coding", label: "Coding Support", icon: Code, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40" },
  { value: "assignments", label: "Assignments & Research", icon: HelpCircle, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40" },
  { value: "study", label: "Study & Flashcards", icon: BookOpen, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" },
  { value: "interview", label: "Interview Prep", icon: UserCheck, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/40" },
  { value: "business", label: "Business & Copywriting", icon: Briefcase, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40" },
];

export default function AIHelpDrawer({ task, onClose, occupation }: AIHelpDrawerProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<AIHelpContent | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Interactive Elements State
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({});
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (task) {
      // Auto-select type based on task category or simple defaults
      if (task.category === "Study") {
        setSelectedType("study");
      } else if (task.category === "Work") {
        setSelectedType("coding");
      } else if (task.category === "Finance" || task.category === "Personal") {
        setSelectedType("business");
      } else {
        setSelectedType("assignments");
      }
      setContent(null);
      setError("");
      setQuizAnswers({});
      setFlippedCards({});
    }
  }, [task]);

  if (!task) return null;

  const handleFetchHelp = async (helpType: string) => {
    setSelectedType(helpType);
    setIsLoading(true);
    setError("");
    setContent(null);
    setQuizAnswers({});
    setFlippedCards({});

    try {
      const response = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: task.title,
          category: task.category,
          helpType,
          occupation,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI Productivity Assistant");
      }

      const data = await response.json();
      setContent(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating help materials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                AI Productivity Coach
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Contextual workspace helper for: <span className="underline font-semibold">{task.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Help Types Selector (shown always as a fast-tab row) */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Help Category
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {HELP_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleFetchHelp(opt.value)}
                    className={`flex items-center gap-2 p-3 text-left border rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${opt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Consulting Gemini Coach...</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Building customized quizzes, code configurations, flashcards, or outlines suited for {task.title}...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Generation Failed</p>
                  <p className="mt-1 leading-relaxed">{error}</p>
                  <button
                    onClick={() => handleFetchHelp(selectedType)}
                    className="mt-2 text-[10px] font-bold text-rose-700 hover:underline cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !content && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400 rounded-xl flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-400">Click a workspace help card above</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                  We will dynamically request tailored coding, outline notes, or quiz items from the Gemini model.
                </p>
              </div>
            )}

            {!isLoading && content && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {content.isFallback && (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-100/50 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 text-[10px] font-medium rounded-xl flex gap-2 items-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <span>Using Local Heuristic Engine. Content generated successfully locally.</span>
                  </div>
                )}

                {/* Introduction */}
                <div>
                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {content.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-line">
                    {content.introduction}
                  </p>
                </div>

                {/* Code Block if Present */}
                {content.codeBlock && (
                  <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-sm">
                    <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                        {content.codeBlock.language}
                      </span>
                      <button
                        onClick={() => handleCopyCode(content.codeBlock!.code)}
                        className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white font-semibold transition cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-80">
                      <code>{content.codeBlock.code}</code>
                    </pre>
                  </div>
                )}

                {/* Structured Sections */}
                {content.sections.map((sec, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h5 className="font-display font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider mb-2">
                      {sec.heading}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {sec.content}
                    </p>
                    {sec.listItems && sec.listItems.length > 0 && (
                      <ul className="mt-3 space-y-1.5 pl-1.5">
                        {sec.listItems.map((item, lidx) => (
                          <li key={lidx} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {/* Interactive Elements: Flashcards, Quiz, Agenda */}
                {content.interactiveElements && content.interactiveElements.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                    <h5 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">
                      Interactive Practice & Playgrounds
                    </h5>

                    {content.interactiveElements.map((el, eidx) => {
                      // Quiz Type
                      if (el.type === "quiz") {
                        const options = el.answerOrOptions.split(/[,;]/).map((o) => o.trim());
                        const chosen = quizAnswers[eidx];
                        const isCorrect = chosen === el.explanationOrCorrect;

                        return (
                          <div key={eidx} className="bg-indigo-50/20 dark:bg-indigo-950/10 p-5 rounded-2xl border border-indigo-50 dark:border-indigo-950/30">
                            <span className="inline-block text-[9px] font-bold text-indigo-600 uppercase bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-sm mb-2.5">
                              Quiz Question
                            </span>
                            <p className="text-xs font-semibold text-slate-800 dark:text-white leading-relaxed">
                              {el.question}
                            </p>
                            <div className="mt-3 space-y-1.5">
                              {options.map((opt, oidx) => {
                                const optLetter = String.fromCharCode(65 + oidx); // A, B, C, D
                                const isSelected = chosen === opt;
                                return (
                                  <button
                                    key={oidx}
                                    onClick={() => setQuizAnswers({ ...quizAnswers, [eidx]: opt })}
                                    className={`w-full text-left text-xs px-3.5 py-2.5 rounded-xl border font-medium transition cursor-pointer flex items-center justify-between ${
                                      isSelected
                                        ? isCorrect
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                                          : "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300"
                                        : "border-slate-100 hover:border-slate-200 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    <span>{optLetter}. {opt}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                );
                              })}
                            </div>
                            {chosen && (
                              <div className="mt-3.5 pt-3 border-t border-indigo-100/50 dark:border-indigo-950/50">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  {isCorrect ? (
                                    <span className="text-emerald-500">Correct Answer</span>
                                  ) : (
                                    <span className="text-rose-500">Incorrect. Correct: {el.explanationOrCorrect}</span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                  Reasoning: {el.explanationOrCorrect}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Flashcard Type
                      if (el.type === "flashcard" || el.type === "qna") {
                        const isFlipped = !!flippedCards[eidx];
                        return (
                          <div
                            key={eidx}
                            onClick={() => setFlippedCards({ ...flippedCards, [eidx]: !isFlipped })}
                            className="relative min-h-[140px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between cursor-pointer group hover:border-indigo-300 transition-all duration-300 select-none overflow-hidden"
                          >
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">
                              Flashcard • Click to Flip
                            </span>

                            <div className="flex-1 flex items-center justify-center text-center px-4 py-2">
                              {isFlipped ? (
                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono italic animate-fade-in">
                                  {el.answerOrOptions}
                                </p>
                              ) : (
                                <p className="text-xs font-bold text-slate-800 dark:text-white leading-normal">
                                  {el.question}
                                </p>
                              )}
                            </div>

                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 text-center block opacity-60 group-hover:opacity-100 transition-opacity">
                              {isFlipped ? "Show Question" : "Reveal Answer"}
                            </span>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
