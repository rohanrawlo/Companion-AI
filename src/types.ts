export interface SubTask {
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: "Study" | "Work" | "Personal" | "Health" | "Finance";
  priority: "Low" | "Medium" | "High" | "Critical";
  estimatedDurationHours: number;
  subtasks: SubTask[];
  completed: boolean;
  progress: number; // 0, 25, 50, 75, 100
  daysFromTodayStart: number;
  deadlineDate: string; // YYYY-MM-DD
  scheduleSlot: {
    date: string; // YYYY-MM-DD
    start: string; // HH:MM
    end: string; // HH:MM
  } | null;
  postponedCount: number;
  isFixedSlot?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  history: { [dateStr: string]: boolean }; // YYYY-MM-DD -> completed
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string; // ISO DateTime
  end: string; // ISO DateTime
  isGoogleCalendarEvent: boolean;
}

export interface UserProfile {
  name: string;
  occupation: string;
  goals: string;
}

export interface AIHelpContent {
  title: string;
  introduction: string;
  isFallback?: boolean;
  fallbackReason?: string;
  codeBlock?: {
    language: string;
    code: string;
  };
  sections: {
    heading: string;
    content: string;
    listItems?: string[];
  }[];
  interactiveElements?: {
    type: "flashcard" | "quiz" | "qna" | "outline" | "agenda";
    question: string;
    answerOrOptions: string;
    explanationOrCorrect: string;
  }[];
}
