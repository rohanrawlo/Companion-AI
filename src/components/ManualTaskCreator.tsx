import React, { useState } from "react";
import { Task } from "../types";
import { Calendar, Clock, AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import { timeToMinutes } from "../lib/planner";

interface ManualTaskCreatorProps {
  onAddTask: (taskData: {
    title: string;
    category: "Study" | "Work" | "Personal" | "Health" | "Finance";
    priority: "Low" | "Medium" | "High" | "Critical";
    estimatedDurationHours: number;
    deadlineDate: string;
    subtasks: string[];
    customScheduleSlot?: {
      date: string;
      start: string;
      end: string;
    } | null;
  }) => void;
}

const CATEGORIES = ["Study", "Work", "Personal", "Health", "Finance"] as const;
const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;

export default function ManualTaskCreator({ onAddTask }: ManualTaskCreatorProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Work");
  const [priorityIdx, setPriorityIdx] = useState(1); // Default to Medium (index 1)
  const [hours, setHours] = useState(1);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    const localYear = d.getFullYear();
    const localMonth = (d.getMonth() + 1).toString().padStart(2, "0");
    const localDay = d.getDate().toString().padStart(2, "0");
    return `${localYear}-${localMonth}-${localDay}`;
  });
  
  // Custom optional schedule slot state
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [slotDate, setSlotDate] = useState(() => {
    const d = new Date();
    const localYear = d.getFullYear();
    const localMonth = (d.getMonth() + 1).toString().padStart(2, "0");
    const localDay = d.getDate().toString().padStart(2, "0");
    return `${localYear}-${localMonth}-${localDay}`;
  });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [timeError, setTimeError] = useState("");

  // Subtasks list state
  const [subtasksText, setSubtasksText] = useState("");

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    setTimeError("");
    // Automatically advance end time if it becomes equal or prior
    const startMins = timeToMinutes(val);
    const endMins = timeToMinutes(endTime);
    if (endMins <= startMins) {
      const newEndMins = Math.min(23 * 60 + 59, startMins + 60);
      const h = Math.floor(newEndMins / 60).toString().padStart(2, "0");
      const m = (newEndMins % 60).toString().padStart(2, "0");
      setEndTime(`${h}:${m}`);
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    setTimeError("");
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(val);
    if (endMins <= startMins) {
      setTimeError("End time must be after start time");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (useCustomTime) {
      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);
      if (endMins <= startMins) {
        setTimeError("End time must be after start time");
        return;
      }
    }

    // Split subtasks by line
    const subtaskLines = subtasksText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let calculatedHours = Math.max(0.5, Number(hours));
    if (useCustomTime) {
      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);
      calculatedHours = (endMins - startMins) / 60;
    }

    onAddTask({
      title: title.trim(),
      category,
      priority: PRIORITIES[priorityIdx],
      estimatedDurationHours: calculatedHours,
      deadlineDate: useCustomTime ? slotDate : deadline,
      subtasks: subtaskLines,
      customScheduleSlot: useCustomTime ? {
        date: slotDate,
        start: startTime,
        end: endTime
      } : null,
    });

    // Reset Form
    setTitle("");
    setHours(1);
    setSubtasksText("");
    setCategory("Work");
    setPriorityIdx(1);
    setUseCustomTime(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task-title" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Task Name
        </label>
        <input
          id="task-title"
          type="text"
          required
          placeholder="e.g., Prepare resume and portfolio"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="task-category" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            id="task-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-100"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-deadline" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Deadline Date
          </label>
          <input
            id="task-deadline"
            type="date"
            required
            disabled={useCustomTime}
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              setSlotDate(e.target.value);
            }}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Optional Custom Schedule Slot */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="toggle-custom-time" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer">
            <Clock className="w-4 h-4 text-indigo-500" />
            Set Specific Time Slot (Optional)
          </label>
          <input
            id="toggle-custom-time"
            type="checkbox"
            checked={useCustomTime}
            onChange={(e) => setUseCustomTime(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded-md focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {useCustomTime && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="custom-slot-date" className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Scheduled Date
                </label>
                <input
                  id="custom-slot-date"
                  type="date"
                  required
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="custom-slot-start" className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Start Time
                </label>
                <input
                  id="custom-slot-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="custom-slot-end" className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  End Time
                </label>
                <input
                  id="custom-slot-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {timeError && (
              <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{timeError}</span>
              </div>
            )}

            <div className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg flex items-center justify-between">
              <span>Auto-Calculated Duration:</span>
              <span className="font-bold">
                {(() => {
                  const startMins = timeToMinutes(startTime);
                  const endMins = timeToMinutes(endTime);
                  const diff = endMins - startMins;
                  if (diff <= 0) return "0 hours";
                  const hr = Math.floor(diff / 60);
                  const mn = diff % 60;
                  return `${hr > 0 ? `${hr}h ` : ""}${mn > 0 ? `${mn}m` : ""}`;
                })()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="task-hours" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Est. Hours {useCustomTime ? "(Auto)" : `(${hours}h)`}
          </label>
          <input
            id="task-hours"
            type="range"
            min="0.5"
            max="12"
            step="0.5"
            disabled={useCustomTime}
            value={useCustomTime ? (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60 : hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-3 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Priority: <span className="font-bold text-indigo-600 dark:text-indigo-400">{PRIORITIES[priorityIdx]}</span>
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={priorityIdx}
            onChange={(e) => setPriorityIdx(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-3"
          />
        </div>
      </div>

      <div>
        <label htmlFor="task-subtasks" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Actionable Subtasks (One per line)
        </label>
        <textarea
          id="task-subtasks"
          placeholder="e.g.&#10;Draft layout wireframes&#10;Select theme colors&#10;Code navbar components"
          rows={3}
          value={subtasksText}
          onChange={(e) => setSubtasksText(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
        />
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Task Slot
      </button>
    </form>
  );
}
