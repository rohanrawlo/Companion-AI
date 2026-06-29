import React, { useState } from "react";
import { Habit } from "../types";
import { Check, Flame, Plus, Sparkles, Trash2, Calendar, Award } from "lucide-react";
import { motion } from "motion/react";

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (title: string) => void;
  onToggleHabit: (id: string, dateStr: string) => void;
  onDeleteHabit: (id: string) => void;
}

const HABIT_PRESETS = ["Workout", "Meditation", "Reading", "Coding", "Hydrate"];

export default function HabitTracker({
  habits,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit,
}: HabitTrackerProps) {
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const localYear = new Date().getFullYear();
  const localMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const localDay = new Date().getDate().toString().padStart(2, "0");
  const todayStr = `${localYear}-${localMonth}-${localDay}`;

  // Get date strings for the last 7 days
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const localYr = d.getFullYear();
      const localMo = (d.getMonth() + 1).toString().padStart(2, "0");
      const localDy = d.getDate().toString().padStart(2, "0");
      dates.push({
        dateStr: `${localYr}-${localMo}-${localDy}`,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
      });
    }
    return dates;
  };

  const last7Days = getLast7Days();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle.trim());
    setNewHabitTitle("");
  };

  // Generate dynamic, helpful habits advice
  const getAIHabitTip = () => {
    if (habits.length === 0) {
      return "Start small. Pick one habit like 'Meditation' or 'Reading' for just 10 minutes a day. The trick is consistency, not duration.";
    }
    const highestStreak = Math.max(...habits.map((h) => h.streak), 0);
    if (highestStreak >= 5) {
      return `Awesome streak of ${highestStreak}! To lock this in, stack it with another habit: e.g., 'Immediately after meditation, I will read for 10 minutes'.`;
    }
    return "Cluster difficult habits during your highest energy window. For instance, if you are most productive in the morning, schedule coding and workouts then.";
  };

  return (
    <div className="space-y-6">
      {/* Habits Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <h3 className="font-display font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          Habit Streaks & Routines
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Perform routines daily. Habits are independent of tasks and have automated streak calculation.
        </p>

        {/* Quick add custom habit */}
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Build a new habit... e.g., Code for 1 hour"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Presets */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {HABIT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                if (!habits.some((h) => h.title.toLowerCase() === preset.toLowerCase())) {
                  onAddHabit(preset);
                }
              }}
              className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-400 dark:border-slate-800 rounded-full cursor-pointer transition"
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      {/* AI Habit Coach Card */}
      <div className="p-5 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950/40 rounded-2xl flex gap-3">
        <div className="p-2.5 bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-xl h-fit">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-display font-semibold text-xs text-orange-900 dark:text-orange-300">Habit Coach Prompt</h4>
          <p className="text-xs text-orange-700/85 dark:text-orange-400/85 mt-1 leading-relaxed">
            {getAIHabitTip()}
          </p>
        </div>
      </div>

      {/* Habits Checklist Grid */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center">
            <Award className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-400">No habits tracked yet</p>
            <p className="text-[10px] text-slate-400 mt-1">Select one of our preset buttons above or write your own!</p>
          </div>
        ) : (
          habits.map((habit) => {
            const isCompletedToday = !!habit.history[todayStr];
            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center justify-between md:justify-start gap-4 flex-1">
                  <div>
                    <h4 className="font-display font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      {habit.title}
                      {habit.streak > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-500 font-mono text-xs font-bold bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30">
                          <Flame className="w-3.5 h-3.5 fill-orange-500" />
                          {habit.streak}d
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Completed {Object.values(habit.history).filter(Boolean).length} times total
                    </p>
                  </div>

                  {/* Toggle Today checkmark */}
                  <button
                    onClick={() => onToggleHabit(habit.id, todayStr)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                      isCompletedToday
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {isCompletedToday ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Today Done
                      </>
                    ) : (
                      "Check Off"
                    )}
                  </button>
                </div>

                {/* Last 7 Days log row */}
                <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 justify-between">
                  <div className="flex gap-1.5">
                    {last7Days.map((day) => {
                      const isChecked = !!habit.history[day.dateStr];
                      const isDayToday = day.dateStr === todayStr;
                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => onToggleHabit(habit.id, day.dateStr)}
                          className={`w-8 h-10 rounded-lg flex flex-col items-center justify-center transition cursor-pointer border ${
                            isChecked
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                              : isDayToday
                              ? "bg-slate-100 text-slate-700 border-indigo-300 dark:bg-slate-800 dark:text-slate-200 dark:border-indigo-800"
                              : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800"
                          }`}
                          title={`${day.dayName} ${day.dayNum}: ${isChecked ? 'Completed' : 'Pending'}`}
                        >
                          <span className="text-[8px] font-bold uppercase tracking-wide">{day.dayName}</span>
                          <span className="text-xs font-mono font-bold mt-0.5">{day.dayNum}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Delete Button */}
                  {confirmingDeleteId === habit.id ? (
                    <div className="flex items-center gap-1 ml-2 shrink-0 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => {
                          onDeleteHabit(habit.id);
                          setConfirmingDeleteId(null);
                        }}
                        className="px-2 py-1 text-[9px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg cursor-pointer transition shadow-xs"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="px-2 py-1 text-[9px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg cursor-pointer transition border border-slate-200/40 dark:border-slate-700/40"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingDeleteId(habit.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition ml-2 cursor-pointer shrink-0"
                      title="Delete habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
