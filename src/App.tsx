import React, { useState, useEffect } from "react";
import { Task, Habit, CalendarEvent, UserProfile, SubTask } from "./types";
import { initAuth, logout, auth, googleSignIn } from "./auth";
import { onAuthStateChanged, User } from "firebase/auth";
import { scheduleTaskSlots, getFreeSlotsForDay, getDateStringOffset, calculateSmartPriority, toLocalISOString } from "./lib/planner";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Calendar, 
  HelpCircle, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  CheckSquare, 
  Moon, 
  Sun, 
  LogOut, 
  Play, 
  Clock, 
  User as UserIcon, 
  Check, 
  RefreshCw, 
  ArrowRight,
  Download,
  Sparkle,
  ChevronRight
} from "lucide-react";

// Sub-components
import WelcomeScreen from "./components/WelcomeScreen";
import DailyPlanner from "./components/DailyPlanner";
import HabitTracker from "./components/HabitTracker";
import ProductivityAnalytics from "./components/ProductivityAnalytics";
import AIHelpDrawer from "./components/AIHelpDrawer";
import ManualTaskCreator from "./components/ManualTaskCreator";
import AIPromptCreator from "./components/AIPromptCreator";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // App Core State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    toLocalISOString(new Date())
  );
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Active Interactive Sessions
  const [activeSessionTask, setActiveSessionTask] = useState<Task | null>(null);
  const [activeSessionSeconds, setActiveSessionSeconds] = useState(0);
  const [activeSessionInterval, setActiveSessionInterval] = useState<any>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<number | null>(null);

  // Notification / Conversation System
  const [notification, setNotification] = useState<{
    text: string;
    type: "info" | "success" | "warning";
    action?: () => void;
    actionLabel?: string;
  } | null>(null);

  // Help Drawer
  const [helpTask, setHelpTask] = useState<Task | null>(null);

  // Evening Reflection Modal
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionAIAdvice, setReflectionAIAdvice] = useState("");
  
  // Logout Confirmation Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isReflectionLoading, setIsReflectionLoading] = useState(false);

  // Overlap Modal States
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);
  const [overlappingTask, setOverlappingTask] = useState<Task | null>(null);

  // Active Panel Tab (Daily, Habits, Analytics)
  const [activeTab, setActiveTab] = useState<"daily" | "habits" | "analytics">("daily");
  const [taskCreationTab, setTaskCreationTab] = useState<"manual" | "ai">("manual");

  // Live Clock & Date State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsPWAInstalled(true);
    }

    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setDeferredPrompt(null);
      console.log('Companion AI was installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handlePWAInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome: ${outcome}`);
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
  };

  // Sync dark mode class on documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Track Firebase Auth State & localStorage
  useEffect(() => {
    // Check dark mode preference
    const savedDark = localStorage.getItem("companion_dark_mode") === "true";
    setDarkMode(savedDark);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Load data from localStorage
        const uid = currentUser.uid;
        const savedProfile = localStorage.getItem(`companion_profile_${uid}`);
        const savedTasks = localStorage.getItem(`companion_tasks_${uid}`);
        const savedHabits = localStorage.getItem(`companion_habits_${uid}`);

        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
        if (savedHabits) {
          setHabits(JSON.parse(savedHabits));
        }

        // Fetch calendar events
        const token = getAccessTokenFromURL() || localStorage.getItem(`companion_google_token_${uid}`);
        if (token) {
          setAccessToken(token);
          await loadCalendar(token, currentUser.uid);
        } else {
          // Fallback to defaults
          setCalendarEvents(getDefaultCalendarEvents());
        }
      } else {
        setUser(null);
        setProfile(null);
        setAccessToken(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Save changes to localStorage whenever core states are modified
  useEffect(() => {
    if (user && profile) {
      localStorage.setItem(`companion_profile_${user.uid}`, JSON.stringify(profile));
    }
  }, [profile, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`companion_tasks_${user.uid}`, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`companion_habits_${user.uid}`, JSON.stringify(habits));
    }
  }, [habits, user]);

  // Handle active session timer
  useEffect(() => {
    if (activeSessionTask) {
      const interval = setInterval(() => {
        setActiveSessionSeconds((prev) => prev + 1);
      }, 1000);
      setActiveSessionInterval(interval);
      return () => clearInterval(interval);
    } else {
      setActiveSessionSeconds(0);
    }
  }, [activeSessionTask]);

  // Automatically check for free slot triggers & suggest tasks conversational
  useEffect(() => {
    if (tasks.length > 0 && user) {
      const pending = tasks.filter((t) => !t.completed && t.scheduleSlot?.date === selectedDate);
      if (pending.length > 0) {
        const nextTask = pending[0];
        setNotification({
          text: `You have some free hours in your calendar right now. Let's finish the "${nextTask.title}" section. It should take about ${Math.round(nextTask.estimatedDurationHours * 60)} minutes.`,
          type: "info",
          actionLabel: "Start Task",
          action: () => handleStartWorkSession(nextTask),
        });
      }
    }
  }, [tasks, selectedDate]);

  // Load default calendar events template
  const getDefaultCalendarEvents = (): CalendarEvent[] => {
    const today = new Date();
    const events: CalendarEvent[] = [];

    // Setup 5 days of realistic schedule templates
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = toLocalISOString(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      if (!isWeekend) {
        // Typical College lecture or meeting
        events.push({
          id: `default-lecture-${dateStr}`,
          summary: "MCA Core Alignment & Lectures",
          start: `${dateStr}T09:00:00`,
          end: `${dateStr}T12:00:00`,
          isGoogleCalendarEvent: false,
        });
        // Group study session
        events.push({
          id: `default-gym-${dateStr}`,
          summary: "Mindfulness & Gym Session",
          start: `${dateStr}T17:00:00`,
          end: `${dateStr}T18:00:00`,
          isGoogleCalendarEvent: false,
        });
      } else {
        events.push({
          id: `default-leisure-${dateStr}`,
          summary: "Weekly Review & Reflection",
          start: `${dateStr}T10:00:00`,
          end: `${dateStr}T11:30:00`,
          isGoogleCalendarEvent: false,
        });
      }
    }
    return events;
  };

  const getAccessTokenFromURL = () => {
    return null; // Not parsing URL parameters directly
  };

  const loadCalendar = async (token: string, uid: string) => {
    try {
      const today = new Date();
      const past3Days = new Date();
      past3Days.setDate(today.getDate() - 3);

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
          past3Days.toISOString()
        )}&singleEvents=true&orderBy=startTime&maxResults=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let fetched: CalendarEvent[] = [];
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          fetched = data.items.map((item: any) => ({
            id: item.id,
            summary: item.summary || "Busy Slot",
            start: item.start.dateTime || `${item.start.date}T00:00:00`,
            end: item.end.dateTime || `${item.end.date}T23:59:59`,
            isGoogleCalendarEvent: true,
          }));
        }
      }

      // Merge fetched events with default occupation slots to populate beautiful UI
      const defaults = getDefaultCalendarEvents();
      // Filter defaults to avoid overlapping on precise hours if we have real items
      const combined = [...fetched, ...defaults];
      setCalendarEvents(combined);
    } catch (err) {
      console.warn("Failed live Google Calendar integration. Falling back to calendar slots.", err);
      setCalendarEvents(getDefaultCalendarEvents());
    }
  };

  // Onboard Onboarding On Complete
  const handleOnboardComplete = async (userProfile: UserProfile, token: string) => {
    setProfile(userProfile);
    setAccessToken(token);

    if (user) {
      localStorage.setItem(`companion_profile_${user.uid}`, JSON.stringify(userProfile));
      localStorage.setItem(`companion_google_token_${user.uid}`, token);
      await loadCalendar(token, user.uid);
      
      // Auto populate an initial task to make the dashboard look active
      const initialTask: Task = {
        id: "mca-init-task",
        title: "Setup and Architecture of MCA Project",
        category: "Work",
        priority: "High",
        estimatedDurationHours: 1.5,
        subtasks: [
          { title: "Initialize Git and Boilerplate", completed: true },
          { title: "Review requirements specification", completed: false }
        ],
        completed: false,
        progress: 50,
        daysFromTodayStart: 0,
        deadlineDate: getDateStringOffset(0),
        scheduleSlot: null,
        postponedCount: 0
      };
      
      const scheduled = scheduleTaskSlots([initialTask], calendarEvents, userProfile.occupation);
      setTasks(scheduled);

      // Create pre-populated habits
      const initialHabits: Habit[] = [
        { id: "habit-workout", title: "Daily Gym Routine", streak: 2, history: { [getDateStringOffset(-1)]: true } },
        { id: "habit-code", title: "Code for 1 hour", streak: 1, history: { [getDateStringOffset(-1)]: true } }
      ];
      setHabits(initialHabits);
    }
  };

  // Theme Switch
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("companion_dark_mode", String(next));
  };

  // Google Sign out execution
  const executeLogout = async () => {
    const uid = user?.uid;
    const token = accessToken;

    // Try to revoke the Google OAuth token
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
      } catch (err) {
        console.warn("Could not revoke Google OAuth token:", err);
      }
    }

    if (uid) {
      localStorage.removeItem(`companion_google_token_${uid}`);
    }

    await logout();
    setUser(null);
    setProfile(null);
    setAccessToken(null);
    setCalendarEvents([]); // Completely clear Google Calendar events from the UI
    setTasks([]);
    setHabits([]);
    setShowLogoutModal(false);
  };

  // Open Google Sign out confirmation modal
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Task Creation: Manual addition
  const handleManualTaskAdd = (taskData: {
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
  }) => {
    const daysOffset = Math.max(
      0,
      Math.round(
        (new Date(taskData.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      category: taskData.category,
      priority: taskData.priority,
      estimatedDurationHours: taskData.estimatedDurationHours,
      subtasks: taskData.subtasks.map((st) => ({ title: st, completed: false })),
      completed: false,
      progress: 0,
      daysFromTodayStart: daysOffset,
      deadlineDate: taskData.deadlineDate,
      scheduleSlot: taskData.customScheduleSlot ? {
        date: taskData.customScheduleSlot.date,
        start: taskData.customScheduleSlot.start,
        end: taskData.customScheduleSlot.end
      } : null,
      postponedCount: 0,
      isFixedSlot: !!taskData.customScheduleSlot
    };

    if (taskData.customScheduleSlot) {
      const timeToMin = (timeStr: string) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
      };

      const newStart = timeToMin(taskData.customScheduleSlot.start);
      const newEnd = timeToMin(taskData.customScheduleSlot.end);

      // Find an overlapping existing task (not completed) scheduled on the same date
      const overlap = tasks.find((t) => {
        if (t.completed || !t.scheduleSlot) return false;
        if (t.scheduleSlot.date !== taskData.customScheduleSlot?.date) return false;

        const exStart = timeToMin(t.scheduleSlot.start);
        const exEnd = timeToMin(t.scheduleSlot.end);

        return newStart < exEnd && exStart < newEnd;
      });

      if (overlap) {
        setPendingTask(newTask);
        setOverlappingTask(overlap);
        setShowOverlapModal(true);
        return;
      }
    }

    const updatedTasks = [...tasks, newTask];
    const rescheduled = scheduleTaskSlots(
      updatedTasks,
      calendarEvents,
      profile?.occupation || "Freelancer"
    );
    setTasks(rescheduled);

    setNotification({
      text: taskData.customScheduleSlot
        ? `Successfully scheduled and locked "${taskData.title}" at ${taskData.customScheduleSlot.start} - ${taskData.customScheduleSlot.end}.`
        : `Successfully added and chronologically optimized "${taskData.title}" into your free calendar slots.`,
      type: "success",
    });
  };

  const handleConfirmReplace = () => {
    if (!pendingTask || !overlappingTask) return;

    // Displace the overlapping task: clear its fixed/manual slot status
    const updatedTasks = tasks.map((t) => {
      if (t.id === overlappingTask.id) {
        return {
          ...t,
          isFixedSlot: false,
          scheduleSlot: null
        };
      }
      return t;
    });

    // Add the new task
    const finalTasks = [...updatedTasks, pendingTask];

    const rescheduled = scheduleTaskSlots(
      finalTasks,
      calendarEvents,
      profile?.occupation || "Freelancer"
    );

    setTasks(rescheduled);
    setShowOverlapModal(false);
    setPendingTask(null);
    setOverlappingTask(null);

    setNotification({
      text: `Placed "${pendingTask.title}" in its chosen slot. "${overlappingTask.title}" has been dynamically rescheduled.`,
      type: "success",
    });
  };

  const handleCancelReplace = () => {
    setShowOverlapModal(false);
    setPendingTask(null);
    setOverlappingTask(null);

    setNotification({
      text: "Task creation canceled.",
      type: "info",
    });
  };

  // Task Creation: AI Prompt Planning
  const handleAIPlanGenerated = (generatedTasks: any[]) => {
    const parsedTasks: Task[] = generatedTasks.map((t, idx) => {
      return {
        id: `ai-task-${Date.now()}-${idx}`,
        title: t.title,
        category: t.category || "Work",
        priority: t.priority || "Medium",
        estimatedDurationHours: Number(t.estimatedDurationHours) || 1,
        subtasks: (t.subtasks || []).map((sub: string) => ({ title: sub, completed: false })),
        completed: false,
        progress: 0,
        daysFromTodayStart: Number(t.daysFromTodayStart) || 0,
        deadlineDate: getDateStringOffset(Number(t.daysFromTodayStart) || 0),
        scheduleSlot: null,
        postponedCount: 0,
      };
    });

    // Merge existing tasks with the AI generated execution plan
    const updatedTasks = [...tasks, ...parsedTasks];
    const rescheduled = scheduleTaskSlots(
      updatedTasks,
      calendarEvents,
      profile?.occupation || "Freelancer"
    );
    setTasks(rescheduled);

    setNotification({
      text: `Gemini successfully engineered an execution plan of ${parsedTasks.length} tasks and distributed them before deadlines.`,
      type: "success",
    });
  };

  // Toggle Single task checkmark
  const handleToggleTaskCompletion = (id: string) => {
    const updated = tasks.map((task) => {
      if (task.id === id) {
        const nextCompleted = !task.completed;
        return {
          ...task,
          completed: nextCompleted,
          progress: nextCompleted ? 100 : 0,
          subtasks: task.subtasks.map((st) => ({ ...st, completed: nextCompleted })),
        };
      }
      return task;
    });

    const rescheduled = scheduleTaskSlots(
      updated,
      calendarEvents,
      profile?.occupation || "Freelancer"
    );
    setTasks(rescheduled);
  };

  // Toggle a single subtask
  const handleToggleSubtask = (taskId: string, subtaskIndex: number) => {
    const updated = tasks.map((task) => {
      if (task.id === taskId) {
        const nextSubtasks = task.subtasks.map((st, sidx) => {
          if (sidx === subtaskIndex) {
            return { ...st, completed: !st.completed };
          }
          return st;
        });
        const completedCount = nextSubtasks.filter((st) => st.completed).length;
        const totalCount = nextSubtasks.length;
        const nextProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
        const nextCompleted = nextProgress === 100;

        return {
          ...task,
          subtasks: nextSubtasks,
          progress: nextProgress,
          completed: nextCompleted,
        };
      }
      return task;
    });

    const rescheduled = scheduleTaskSlots(
      updated,
      calendarEvents,
      profile?.occupation || "Freelancer"
    );
    setTasks(rescheduled);
  };

  // Start active work session tracker
  const handleStartWorkSession = (task: Task) => {
    setActiveSessionTask(task);
    setActiveSessionSeconds(0);
    setNotification({
      text: `Starting focused work session for: "${task.title}". Avoid distractions, we are counting focus hours now!`,
      type: "info",
    });
  };

  // Complete work session and enter progress modal
  const handleCompleteWorkSession = () => {
    if (activeSessionInterval) {
      clearInterval(activeSessionInterval);
    }
    setShowProgressModal(true);
  };

  // Submit focus progress
  const handleSubmitProgress = (percent: number) => {
    if (!activeSessionTask) return;

    const isDone = percent === 100;
    const updated = tasks.map((task) => {
      if (task.id === activeSessionTask.id) {
        return {
          ...task,
          progress: percent,
          completed: isDone,
          subtasks: task.subtasks.map((st, sidx) => {
            // Distribute simple subtask checkmarks on partial progress
            const threshold = (sidx + 1) / task.subtasks.length * 100;
            return {
              ...st,
              completed: isDone || percent >= threshold,
            };
          }),
        };
      }
      return task;
    });

    const rescheduled = scheduleTaskSlots(
      updated,
      calendarEvents,
      profile?.occupation || "Freelancer"
    );
    setTasks(rescheduled);

    // Track streaks increment if task fully completed
    setNotification({
      text: isDone 
        ? `Incredible! You completed "${activeSessionTask.title}". Future schedule slots re-optimized!`
        : `Your progress has been set to ${percent}%. Keep driving forward, future hours re-calibrated.`,
      type: "success",
    });

    setActiveSessionTask(null);
    setShowProgressModal(false);
    setSelectedProgress(null);
  };

  // Delay active task - Reschedule
  const handleDelayActiveTask = () => {
    if (!activeSessionTask) return;

    const updated = tasks.map((task) => {
      if (task.id === activeSessionTask.id) {
        return {
          ...task,
          daysFromTodayStart: task.daysFromTodayStart + 1, // Push 1 day
          deadlineDate: getDateStringOffset(task.daysFromTodayStart + 1),
          postponedCount: (task.postponedCount || 0) + 1,
        };
      }
      return task;
    });

    const rescheduled = scheduleTaskSlots(
      updated,
      calendarEvents,
      profile?.occupation || "Freelancer"
    );
    setTasks(rescheduled);

    setNotification({
      text: `Pushed "${activeSessionTask.title}" out by 1 day. Let's find your next optimal free slot tomorrow.`,
      type: "warning",
    });

    setActiveSessionTask(null);
    setShowProgressModal(false);
  };

  // HABITS ACTIONS
  const handleAddHabit = (title: string) => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title,
      streak: 0,
      history: {},
    };
    setHabits([...habits, newHabit]);
  };

  const handleToggleHabit = (id: string, dateStr: string) => {
    const updated = habits.map((habit) => {
      if (habit.id === id) {
        const currentHistory = { ...habit.history };
        const nextState = !currentHistory[dateStr];
        
        if (nextState) {
          currentHistory[dateStr] = true;
        } else {
          delete currentHistory[dateStr];
        }

        // Re-calculate streak
        let streak = 0;
        let d = new Date();
        while (true) {
          const checkDateStr = toLocalISOString(d);
          if (currentHistory[checkDateStr]) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            // Allow checking if checked off yesterday, streak is kept
            if (streak === 0) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesStr = toLocalISOString(yesterday);
              if (currentHistory[yesStr]) {
                streak = 1; // Start with yesterday's
              }
            }
            break;
          }
        }

        return {
          ...habit,
          history: currentHistory,
          streak,
        };
      }
      return habit;
    });
    setHabits(updated);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  // ADAPTIVE RESCHEDULING SIMULATOR
  // This is the peak feature demonstrating the user's explicit story about:
  // "Meeting expected 30m, actual 1h, detects overlap, automatically reschedules tasks"
  const handleSimulateMeetingOverlap = () => {
    // 1. We create or update a Calendar Event starting soon that is elongated
    const targetDateStr = selectedDate;
    
    // Find any scheduled tasks for today
    const todayScheduledTasks = tasks.filter((t) => !t.completed && t.scheduleSlot?.date === targetDateStr);
    
    if (todayScheduledTasks.length === 0) {
      alert("Please add some tasks scheduled for today first to see them automatically reschedule when calendar events overlap!");
      return;
    }

    // We will place an elongated meeting starting at 2:00 PM and ending at 4:30 PM (instead of 2:30 PM)
    const overlapEvent: CalendarEvent = {
      id: `sim-overlap-event-${Date.now()}`,
      summary: "Critique Interview & Review (Runs Overtime)",
      start: `${targetDateStr}T14:00:00`,
      end: `${targetDateStr}T16:30:00`, // Overlaps with 2-4 slot!
      isGoogleCalendarEvent: false,
    };

    const updatedEvents = [...calendarEvents, overlapEvent];
    setCalendarEvents(updatedEvents);

    // Trigger rescheduling automatically
    const rescheduledTasks = scheduleTaskSlots(
      tasks,
      updatedEvents,
      profile?.occupation || "Freelancer"
    );
    setTasks(rescheduledTasks);

    // Generate cute notification prompt
    setNotification({
      text: `Your interview ran longer than expected (overlapping free slots). I moved your tasks to 4:30 PM and 6:30 PM because those are your next available free slots.`,
      type: "warning",
    });
  };

  // Evening Reflection generation with Express /api/evening-reflection
  const handleOpenReflection = async () => {
    setShowReflectionModal(true);
    setIsReflectionLoading(true);
    setReflectionAIAdvice("");

    try {
      const completedCount = tasks.filter((t) => t.completed && t.scheduleSlot?.date === selectedDate).length;
      const pendingCount = tasks.filter((t) => !t.completed && t.scheduleSlot?.date === selectedDate).length;
      const hoursInvested = tasks.reduce((acc, t) => {
        if (t.scheduleSlot?.date === selectedDate) {
          return acc + (t.estimatedDurationHours * (t.progress / 100));
        }
        return acc;
      }, 0);

      const res = await fetch("/api/evening-reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedCount,
          pendingCount,
          timeSpentHours: hoursInvested,
          streak: habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0,
          habitsDoneCount: habits.filter((h) => h.history[selectedDate]).length,
          occupation: profile?.occupation || "Working Professional",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReflectionAIAdvice(data.recommendation);
      } else {
        setReflectionAIAdvice("You did amazing today! Continue checking off incremental milestones to unlock streak acceleration.");
      }
    } catch (err) {
      console.error(err);
      setReflectionAIAdvice("Great job maintaining consistency today. Remember to review your goals and start fresh tomorrow!");
    } finally {
      setIsReflectionLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-400 mt-3 uppercase tracking-wider">Syncing Companion Engine...</p>
      </div>
    );
  }

  // If no onboarding completed, show welcome screen
  if (!user || !profile) {
    return <WelcomeScreen onComplete={handleOnboardComplete} />;
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans pb-16">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 select-none drop-shadow-sm shrink-0">
              <img src="/favicon.svg" alt="Companion AI Logo" className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1 sm:gap-1.5">
                Companion
                <span className="text-[8px] sm:text-[9px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold px-1.5 py-0.5 sm:px-2 rounded-full uppercase hidden xs:inline-block">
                  AI Partner
                </span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium hidden sm:block truncate">Adaptive Productivity Assistant</p>
            </div>
          </div>

          {/* Live Clock & Calendar Display */}
          <div className="hidden lg:flex items-center gap-3 bg-indigo-50/40 dark:bg-indigo-950/30 px-4 py-2 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 shadow-2xs shrink-0">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                {currentTime.toLocaleDateString([], { weekday: 'short' })}, {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* PWA Install Button */}
            {deferredPrompt && (
              <button
                onClick={handlePWAInstallClick}
                className="text-[10px] font-bold px-2 py-1.5 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-xl transition flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm animate-pulse shrink-0"
                title="Install Companion AI to your device"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Install App</span>
                <span className="hidden xs:inline sm:hidden">Install</span>
              </button>
            )}

            {/* Evening Reflection Trigger */}
            <button
              onClick={handleOpenReflection}
              className="text-[10px] font-bold px-2 py-1.5 sm:px-3 sm:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:hover:bg-indigo-900 dark:text-indigo-400 dark:border-indigo-900/50 rounded-xl transition flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reflection</span>
              <span className="hidden sm:inline md:hidden">Reflect</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Conversational Floating Notification banner */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                  notification.type === "success"
                    ? "bg-emerald-50/70 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400"
                    : notification.type === "warning"
                    ? "bg-amber-50/70 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400"
                    : "bg-indigo-50/70 border-indigo-100 text-indigo-850 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-slate-800 shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-4 h-4 fill-indigo-600 dark:fill-indigo-400" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-60">Companion Suggestion</h5>
                    <p className="text-xs font-semibold leading-relaxed">{notification.text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {notification.action && (
                    <button
                      onClick={notification.action}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                      {notification.actionLabel || "Act"}
                    </button>
                  )}
                  <button
                    onClick={() => setNotification(null)}
                    className="px-3 py-1.5 bg-slate-200/50 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-slate-500 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Reschedule later
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Timer Box if task started */}
          <AnimatePresence>
            {activeSessionTask && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 p-6 opacity-5">
                  <Clock className="w-24 h-24 text-white" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        Active Focus Session
                      </span>
                      <h4 className="font-display font-bold text-base mt-0.5">
                        {activeSessionTask.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Elapsed Focus:</span>
                        <span className="font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                          {Math.floor(activeSessionSeconds / 60)}m {activeSessionSeconds % 60}s
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Ask Help Button */}
                    <button
                      onClick={() => setHelpTask(activeSessionTask)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      Need Help?
                    </button>

                    {/* Delay Option */}
                    <button
                      onClick={handleDelayActiveTask}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-800 transition cursor-pointer"
                    >
                      Delay Session
                    </button>

                    {/* Done Button */}
                    <button
                      onClick={handleCompleteWorkSession}
                      className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                    >
                      Complete Session
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Outer Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Creator panel and Calendars (width: 5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Task Creation Hub */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-display font-bold text-base text-slate-800 dark:text-white">
                    Planning Route
                  </h3>
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
                    <button
                      onClick={() => setTaskCreationTab("manual")}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                        taskCreationTab === "manual"
                          ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Manual Route
                    </button>
                    <button
                      onClick={() => setTaskCreationTab("ai")}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        taskCreationTab === "ai"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-indigo-400 hover:text-indigo-500"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 fill-current" />
                      AI Route
                    </button>
                  </div>
                </div>

                {taskCreationTab === "manual" ? (
                  <ManualTaskCreator onAddTask={handleManualTaskAdd} />
                ) : (
                  <AIPromptCreator 
                    onPlanGenerated={handleAIPlanGenerated} 
                    occupation={profile.occupation}
                    goals={profile.goals}
                  />
                )}
              </div>

              {/* Day Quick Calendar Swapper */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs">
                <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white mb-4">
                  Select Calendar Date
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const dateStr = toLocalISOString(d);
                    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = d.getDate();
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={offset}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-slate-50 border-slate-100 hover:border-slate-200 dark:bg-slate-950 dark:border-slate-800/80 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider">{dayLabel}</span>
                        <span className="text-sm font-mono font-bold mt-1">{dayNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Main Dash Views (width: 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Navigation Tabs bar */}
              <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
                <button
                  onClick={() => setActiveTab("daily")}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "daily"
                      ? "bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-2xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Timeline Schedule
                </button>
                <button
                  onClick={() => setActiveTab("habits")}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "habits"
                      ? "bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-2xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Streak Routines
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "analytics"
                      ? "bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-2xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Analytics Insights
                </button>
              </div>

              {/* Rendering Active Tab content */}
              <div>
                {activeTab === "daily" && (
                  <DailyPlanner
                    profile={profile}
                    tasks={tasks}
                    calendarEvents={calendarEvents}
                    onToggleTaskCompletion={handleToggleTaskCompletion}
                    onToggleSubtask={handleToggleSubtask}
                    onStartSession={handleStartWorkSession}
                    onOpenHelp={(task) => setHelpTask(task)}
                    selectedDate={selectedDate}
                    currentTime={currentTime}
                  />
                )}

                {activeTab === "habits" && (
                  <HabitTracker
                    habits={habits}
                    onAddHabit={handleAddHabit}
                    onToggleHabit={handleToggleHabit}
                    onDeleteHabit={handleDeleteHabit}
                  />
                )}

                {activeTab === "analytics" && (
                  <ProductivityAnalytics tasks={tasks} habits={habits} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Helper Sidebar/Drawer Overlay */}
        <AnimatePresence>
          {helpTask && (
            <AIHelpDrawer
              task={helpTask}
              onClose={() => setHelpTask(null)}
              occupation={profile.occupation}
            />
          )}
        </AnimatePresence>

        {/* Progress selection modal on complete session */}
        <AnimatePresence>
          {showProgressModal && activeSessionTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl"
              >
                <h4 className="font-display font-bold text-base text-slate-900 dark:text-white text-center mb-1">
                  How much did you finish?
                </h4>
                <p className="text-[10px] text-slate-400 font-medium text-center mb-6">
                  Select incremental completion to calibrate remaining hours.
                </p>

                <div className="space-y-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setSelectedProgress(percent)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                        selectedProgress === percent
                          ? "border-indigo-600 bg-indigo-50/15 text-indigo-700 dark:text-indigo-300"
                          : "border-slate-100 bg-slate-50/50 dark:bg-slate-950 dark:border-slate-850 hover:border-slate-200 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{percent}% Completed</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowProgressModal(false);
                      setSelectedProgress(null);
                    }}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedProgress !== null) {
                        handleSubmitProgress(selectedProgress);
                      }
                    }}
                    disabled={selectedProgress === null}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Save Progress
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Evening Reflection Modal */}
        <AnimatePresence>
          {showReflectionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-3 shadow-xs">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Evening Coaching Reflection
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Let's review your completed accomplishments today and structure tomorrow's priorities.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Today's accomplishments log summary */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <div className="text-center">
                      <span className="text-[18px] font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {tasks.filter((t) => t.completed && t.scheduleSlot?.date === selectedDate).length}
                      </span>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-1">Done</span>
                    </div>
                    <div className="text-center border-x border-slate-200 dark:border-slate-800">
                      <span className="text-[18px] font-bold font-mono text-slate-700 dark:text-slate-300">
                        {tasks.filter((t) => !t.completed && t.scheduleSlot?.date === selectedDate).length}
                      </span>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-1">Pending</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[18px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {habits.filter((h) => h.history[selectedDate]).length}
                      </span>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-1">Habits Logged</span>
                    </div>
                  </div>

                  {/* AI Recommendation display */}
                  <div className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 p-5 rounded-2xl">
                    <h5 className="font-display font-semibold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                      Gemini Productivity Coach
                    </h5>
                    {isReflectionLoading ? (
                      <div className="flex items-center gap-2 py-4 text-xs font-medium text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                        Generating coaching review...
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{reflectionAIAdvice}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowReflectionModal(false)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    I am ready for tomorrow!
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl"
              >
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl mb-3 shadow-xs">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Sign Out
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium max-w-[240px] leading-relaxed">
                    Are you sure you want to sign out from your account and disconnect your Google Calendar?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeLogout}
                    className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Yes, Sign Out
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Task Overlap Warning Modal */}
        <AnimatePresence>
          {showOverlapModal && pendingTask && overlappingTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl"
              >
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl mb-3 shadow-xs">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Schedule Slot Overlap
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium max-w-[240px] leading-relaxed mt-1">
                    The chosen time slot overlaps with an existing task schedule on this day.
                  </p>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/60">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      New Task
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {pendingTask.title}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {pendingTask.scheduleSlot?.start} - {pendingTask.scheduleSlot?.end} ({pendingTask.scheduleSlot?.date})
                    </span>
                  </div>

                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-2xl border border-amber-100/40 dark:border-amber-900/20">
                    <span className="text-[8px] font-bold text-amber-500/85 uppercase tracking-wider block mb-0.5">
                      Overlapping Existing Task
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {overlappingTask.title}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {overlappingTask.scheduleSlot?.start} - {overlappingTask.scheduleSlot?.end}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCancelReplace}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer text-center"
                  >
                    Cancel Input
                  </button>
                  <button
                    onClick={handleConfirmReplace}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer text-center"
                  >
                    Replace Slot
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
