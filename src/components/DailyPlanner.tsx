import React from "react";
import { Task, CalendarEvent, UserProfile } from "../types";
import { CheckCircle2, Circle, AlertCircle, Play, Sparkles, HelpCircle, Calendar, Clock } from "lucide-react";
import { motion } from "motion/react";

function formatTo12Hour(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

interface DailyPlannerProps {
  profile: UserProfile;
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  onToggleTaskCompletion: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskIndex: number) => void;
  onStartSession: (task: Task) => void;
  onOpenHelp: (task: Task) => void;
  selectedDate: string; // YYYY-MM-DD
  currentTime: Date;
}

export default function DailyPlanner({
  profile,
  tasks,
  calendarEvents,
  onToggleTaskCompletion,
  onToggleSubtask,
  onStartSession,
  onOpenHelp,
  selectedDate,
  currentTime,
}: DailyPlannerProps) {
  // Filter and parse calendar events for this specific day timezone-safely
  const [selYear, selMonthOneIndexed, selDay] = selectedDate.split("-").map(Number);
  const selMonth = selMonthOneIndexed - 1;

  const todayEvents = calendarEvents.filter((event) => {
    const eStart = new Date(event.start);
    return (
      eStart.getFullYear() === selYear &&
      eStart.getMonth() === selMonth &&
      eStart.getDate() === selDay
    );
  }).map((event) => {
    const eStart = new Date(event.start);
    const eEnd = new Date(event.end);
    const startStr = eStart.toTimeString().substring(0, 5);
    const endStr = eEnd.toTimeString().substring(0, 5);
    return {
      id: event.id,
      title: event.summary || "Busy Slot",
      start: startStr,
      end: endStr,
      isCalendarEvent: true,
      category: "Calendar" as const,
      completed: false,
      rawItem: event,
    };
  });

  // Filter and parse tasks scheduled for today
  const todayTasks = tasks.filter((task) => {
    return task.scheduleSlot && task.scheduleSlot.date === selectedDate;
  }).map((task) => {
    return {
      id: task.id,
      title: task.title,
      start: task.scheduleSlot!.start,
      end: task.scheduleSlot!.end,
      isCalendarEvent: false,
      category: task.category,
      completed: task.completed,
      priority: task.priority,
      rawItem: task,
    };
  });

  // Combine both and sort by start time
  const timelineItems = [...todayEvents, ...todayTasks].sort((a, b) => {
    return a.start.localeCompare(b.start);
  });

  // Calculate high priority focus task
  const criticalTasks = tasks.filter((t) => !t.completed && (t.priority === "Critical" || t.priority === "High"));
  const primaryFocus = criticalTasks.length > 0 ? criticalTasks[0] : tasks.find((t) => !t.completed);

  const getPriorityColor = (p?: string) => {
    switch (p) {
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900";
      case "High":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900";
      case "Medium":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Study":
        return "bg-purple-100/60 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50";
      case "Work":
        return "bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50";
      case "Personal":
        return "bg-blue-100/60 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50";
      case "Health":
        return "bg-pink-100/60 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50";
      case "Finance":
        return "bg-amber-100/60 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";
      default:
        return "bg-indigo-100/60 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50";
    }
  };

  const localYear = new Date().getFullYear();
  const localMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const localDay = new Date().getDate().toString().padStart(2, "0");
  const todayStr = `${localYear}-${localMonth}-${localDay}`;
  const isTodaySelected = todayStr === selectedDate;

  const getGreeting = () => {
    const hr = currentTime.getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    if (hr < 21) return "Good Evening";
    return "Good Night";
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Greetings Card */}
      {isTodaySelected && (
        <div className="p-6 bg-linear-to-r from-indigo-500 to-purple-600 rounded-3xl text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
                Daily Planner
              </span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold">
                {getGreeting()}, {profile.name}
              </h2>
              <p className="text-white/80 text-xs mt-1 font-medium">
                Occupation: <span className="underline">{profile.occupation}</span>
              </p>
            </div>

            {/* Live Clock, Day, Date, Year Details for user convenience */}
            <div className="bg-white/10 dark:bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-emerald-300 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-base font-mono font-extrabold tracking-tight">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/70 tracking-wider leading-none mt-1">
                    Live System Clock
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:border-l sm:border-white/15 sm:pl-4">
                <Calendar className="w-4.5 h-4.5 text-indigo-200" />
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold tracking-tight">
                    {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-white/70 tracking-wider leading-none mt-1">
                    {currentTime.toLocaleDateString([], { weekday: 'long' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <p className="text-[11px] text-white/90 font-medium">
                I've synced your Google Calendar. Below is your optimized route for today.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Priority Focus */}
      {primaryFocus && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Priority Focus Task
            </h3>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getPriorityColor(primaryFocus.priority)}`}>
              {primaryFocus.priority} Priority
            </span>
          </div>
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleTaskCompletion(primaryFocus.id)}
              className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-500 transition cursor-pointer shrink-0 mt-0.5"
              title={primaryFocus.completed ? "Mark Incomplete" : "Mark Completed"}
            >
              {primaryFocus.completed ? (
                <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500" />
              ) : (
                <Circle className="w-5.5 h-5.5 text-slate-300 hover:text-emerald-400" />
              )}
            </button>
            <div className="w-full">
              <h4 className={`font-display font-semibold text-base leading-snug ${primaryFocus.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                {primaryFocus.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Estimated duration: {primaryFocus.estimatedDurationHours} hours • Category: {primaryFocus.category}
              </p>
              {primaryFocus.subtasks.length > 0 && (
                <div className="mt-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subtasks Progress (Click to Toggle)</p>
                  <div className="space-y-1.5">
                    {primaryFocus.subtasks.map((st, sidx) => (
                      <button
                        key={sidx}
                        onClick={() => onToggleSubtask(primaryFocus.id, sidx)}
                        className="w-full text-left flex items-center gap-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-900/40 p-1.5 rounded-lg transition cursor-pointer"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${st.completed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                        <span className={`${st.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                          {st.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
              <span>Task Progress</span>
              <span className="font-bold">{primaryFocus.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${primaryFocus.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Chronological Timeline */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-indigo-500" />
            Schedule Timeline ({timelineItems.length})
          </h3>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {selectedDate === todayStr ? "Today" : selectedDate}
          </span>
        </div>

        {timelineItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 mb-3 border border-slate-100 dark:border-slate-800">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No events scheduled on this day</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Create a manual task or ask Gemini using AI Prompt to fill this day with adaptive sessions!</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-100 dark:border-slate-800 pl-6 ml-3 space-y-6">
            {timelineItems.map((item, index) => {
              const isTask = !item.isCalendarEvent;
              return (
                <div key={item.id} className="relative group">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 ${
                    isTask 
                      ? item.completed 
                        ? 'bg-emerald-500 border-white dark:border-slate-900' 
                        : 'bg-indigo-500 border-white dark:border-slate-900 shadow-xs'
                      : 'bg-slate-300 border-white dark:border-slate-900'
                  }`}></span>

                  <div className={`p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 transition-all duration-200 hover:shadow-xs ${
                    isTask 
                      ? item.completed 
                        ? 'bg-slate-50/50 opacity-70 dark:bg-slate-900/30' 
                        : 'bg-white hover:border-slate-200 dark:bg-slate-900 dark:hover:border-slate-700/80'
                      : 'bg-slate-50/60 dark:bg-slate-950/30 border-dashed hover:border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {/* Time interval */}
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTo12Hour(item.start)} - {formatTo12Hour(item.end)}</span>
                          {!isTask && (
                            <span className="ml-2 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded-sm">
                              Google Calendar
                            </span>
                          )}
                          {isTask && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded-sm border ${getCategoryColor(item.category)}`}>
                              {item.category}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className={`font-display font-semibold text-sm ${
                          isTask && item.completed 
                            ? "line-through text-slate-400" 
                            : "text-slate-800 dark:text-white"
                        }`}>
                          {item.title}
                        </h4>

                        {/* Subtasks inside Timeline list item */}
                        {isTask && item.rawItem && (item.rawItem as Task).subtasks && (item.rawItem as Task).subtasks.length > 0 && (
                          <div className="mt-2 space-y-1 pl-1">
                            {(item.rawItem as Task).subtasks.map((st, sidx) => (
                              <button
                                key={sidx}
                                onClick={() => onToggleSubtask(item.id, sidx)}
                                className="flex items-center gap-2 text-[11px] text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 px-1 py-0.5 rounded transition cursor-pointer"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.completed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                                <span className={`${st.completed ? 'line-through text-slate-400' : 'text-slate-500 dark:text-slate-300'}`}>
                                  {st.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Interactive Controls for Tasks */}
                      {isTask && (
                        <div className="flex items-center gap-1.5">
                          {/* Toggle Completion */}
                          <button
                            onClick={() => onToggleTaskCompletion(item.id)}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                            title={item.completed ? "Mark Incomplete" : "Mark Completed"}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          {/* Quick AI Help */}
                          {!item.completed && (
                            <button
                              onClick={() => onOpenHelp(item.rawItem as Task)}
                              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition cursor-pointer"
                              title="Ask AI Coach for help"
                            >
                              <HelpCircle className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
