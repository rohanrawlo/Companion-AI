import React, { useState } from "react";
import { Sparkles, Calendar, Zap, AlertCircle } from "lucide-react";

interface AIPromptCreatorProps {
  onPlanGenerated: (tasks: any[]) => void;
  occupation: string;
  goals: string;
}

const EXAMPLES = [
  "I need to complete my MCA project in five days.",
  "I have three software developer interviews next week.",
  "I want to prepare for AWS cloud practitioner certification.",
  "I have chemistry and maths exams next month.",
];

export default function AIPromptCreator({
  onPlanGenerated,
  occupation,
  goals,
}: AIPromptCreatorProps) {
  const [prompt, setPrompt] = useState("");
  const [days, setDays] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState("");

  const handleGeneratePlan = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim()) return;

    setIsLoading(true);
    setError("");
    setFallbackNotice("");

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt.trim(),
          occupation,
          userGoals: goals,
          durationDays: days,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to contact the AI Planning Engine");
      }

      const data = await res.json();
      if (data && data.tasks) {
        onPlanGenerated(data.tasks);
        if (data.isFallback) {
          setFallbackNotice("The model is running at peak capacity. Companion has automatically designed a custom daily schedule tailored to your goal locally!");
        } else {
          setPrompt("");
        }
      } else {
        throw new Error("Invalid structure returned by AI");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating your plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => handleGeneratePlan(e)} className="space-y-4">
        <div>
          <label htmlFor="ai-prompt" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Describe Your Goal Naturally
          </label>
          <textarea
            id="ai-prompt"
            required
            rows={3}
            placeholder="e.g. 'I want to build a React website for my portfolio before next Monday' or 'Prepare for exams next month'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="ai-days" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Plan Duration (Days: {days})
            </label>
            <input
              id="ai-days"
              type="range"
              min="2"
              max="30"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2.5"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-xs cursor-pointer h-fit self-end mt-1.5"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Planning...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                Generate Plan
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-[11px] rounded-xl flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {fallbackNotice && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/25 border border-amber-100/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 text-[11px] rounded-2xl flex gap-2.5 items-start">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Local Smart Planner Active</p>
            <p className="leading-relaxed opacity-95">{fallbackNotice}</p>
          </div>
        </div>
      )}

      {/* Preset prompt pills */}
      <div>
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Or try a natural prompt example:
        </span>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={(e) => {
                setPrompt(ex);
                handleGeneratePlan(e, ex);
              }}
              className="text-left text-xs p-3 bg-slate-50 hover:bg-slate-100/80 text-slate-600 hover:text-indigo-600 border border-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-400 dark:border-slate-800 rounded-xl transition cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="font-medium line-clamp-1">{ex}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
