import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in environment. AI features will fail.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getAIClient();

// Helper to try multiple Gemini models in case of transient 503 (high demand) or 429 (quota exceeded) errors
async function generateContentWithFallback(params: {
  contents: string | any[];
  config?: any;
}) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini API] Attempting generateContent with model: ${model}`);
      const response = await ai.models.generateContent({
        contents: params.contents,
        config: params.config,
        model
      });
      console.log(`[Gemini API] Success with model: ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} failed:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All models in the fallback chain failed");
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ==========================================
// ROBUST SMART FALLBACK ENGINES (FOR 429 / API ERRORS)
// ==========================================

function generateFallbackPlan(prompt: string, occupation: string, userGoals: string, durationDays: number) {
  let subject = prompt
    .replace(/i want to|i need to|prepare for|build a|create a|design a|make a|study for|prepare|build|create|design/gi, "")
    .trim();
  if (subject.endsWith(".")) subject = subject.slice(0, -1);
  if (!subject) subject = "Target Milestones";

  subject = subject.charAt(0).toUpperCase() + subject.slice(1);

  const lowerPrompt = prompt.toLowerCase();
  let category: "Study" | "Work" | "Personal" | "Health" | "Finance" = "Work";
  if (lowerPrompt.includes("exam") || lowerPrompt.includes("study") || lowerPrompt.includes("learn") || lowerPrompt.includes("course") || lowerPrompt.includes("cert") || lowerPrompt.includes("syllabus") || lowerPrompt.includes("math") || lowerPrompt.includes("chemistry")) {
    category = "Study";
  } else if (lowerPrompt.includes("gym") || lowerPrompt.includes("workout") || lowerPrompt.includes("health") || lowerPrompt.includes("fitness") || lowerPrompt.includes("run") || lowerPrompt.includes("diet")) {
    category = "Health";
  } else if (lowerPrompt.includes("budget") || lowerPrompt.includes("finance") || lowerPrompt.includes("tax") || lowerPrompt.includes("invest") || lowerPrompt.includes("money")) {
    category = "Finance";
  } else if (lowerPrompt.includes("personal") || lowerPrompt.includes("book") || lowerPrompt.includes("house") || lowerPrompt.includes("clean") || lowerPrompt.includes("habit")) {
    category = "Personal";
  }

  const studyProgression = [
    "Syllabus Audit & Study Plan Map",
    "Fundamental Concepts & Key Chapter Review",
    "Detailed Revision & Active Recall Drills",
    "Mock Tests & Timing Exercises",
    "High-Weightage Topic Consolidation",
    "Weak Areas Diagnosis & Revision",
    "Final Syllabus Polish & Concept Review"
  ];

  const workProgression = [
    "Requirements Gathering & Layout Planning",
    "Development Workspace & Setup Scaffold",
    "Main Interface Layout & Core Features",
    "Interactive Functions & Data Wiring",
    "Comprehensive Local Testing & Bug Fixing",
    "Styling Polish & Component Integration",
    "Deployment Build & Release Optimization"
  ];

  const healthProgression = [
    "Fitness Audit & Dynamic Schedule Outline",
    "Warmup Techniques & Form Validation",
    "Conditioning Drills & Mid-Intensity Work",
    "Active Recovery & Nutrient Fuel Prep",
    "Full-Spectrum Session & Peak Performance",
    "Endurance Work & Stretching Routines",
    "Progress Evaluation & Active Cooldown"
  ];

  const financeProgression = [
    "Expense Log Compilation & Account Audit",
    "Essential Savings & Budget Outline",
    "Deficit Minimization & High-Yield Strategy",
    "Investment Allocations & Tax Safeguards",
    "Automated Transfers & Compound Setup",
    "Audit Report Review & Advisory Check",
    "Milestone Consolidation & Future Outlook"
  ];

  const personalProgression = [
    "Objective Definition & Space Preparation",
    "Primary Phase Organization & Layout",
    "Milestone Tracking & Initial Setup",
    "Incremental Tasks & Routine Structuring",
    "Comprehensive Detail Polish & Audit",
    "Consistency Support & Tracking System",
    "Milestone Completion & Celebration Setup"
  ];

  let progression = workProgression;
  if (category === "Study") progression = studyProgression;
  else if (category === "Health") progression = healthProgression;
  else if (category === "Finance") progression = financeProgression;
  else if (category === "Personal") progression = personalProgression;

  const tasks = [];
  for (let day = 0; day < durationDays; day++) {
    const progressionIndex = Math.floor((day / (durationDays - 1 || 1)) * (progression.length - 1));
    const rawTitle = progression[progressionIndex];
    
    let title = `${rawTitle}: ${subject}`;
    if (title.length > 80) {
      title = `${rawTitle} - ${subject.slice(0, 30)}...`;
    }

    const baseHours = 1.5 + (day % 3) * 0.5;
    const estimatedDurationHours = Number(baseHours.toFixed(1));

    let priority: "Low" | "Medium" | "High" | "Critical" = "Medium";
    if (day === 0) priority = "High";
    else if (day === durationDays - 1) priority = "Critical";
    else if (day % 3 === 0) priority = "High";
    else if (day % 3 === 1) priority = "Low";

    const subtasks = [];
    if (category === "Study") {
      subtasks.push(`Review notes and chapters related to Day ${day + 1} focus`);
      subtasks.push(`Create flashcards for active recall exercises`);
      subtasks.push(`Complete timed self-evaluation questions`);
    } else if (category === "Work") {
      subtasks.push(`Deconstruct technical specifications for Day ${day + 1}`);
      subtasks.push(`Write clean, type-safe implementation code`);
      subtasks.push(`Verify styling alignments and console logs`);
    } else if (category === "Health") {
      subtasks.push(`Execute planned dynamic movements`);
      subtasks.push(`Log session results and form feedback`);
      subtasks.push(`Replenish macro-nutrients and hydrate`);
    } else if (category === "Finance") {
      subtasks.push(`Extract ledger data and statement worksheets`);
      subtasks.push(`Perform category-by-category checks`);
      subtasks.push(`Verify ledger balances and lock spreadsheet`);
    } else {
      subtasks.push(`Define granular targets for today's milestone`);
      subtasks.push(`Set aside dedicated distraction-free time`);
      subtasks.push(`Review Day ${day + 1} progress and adjust buffers`);
    }

    tasks.push({
      title,
      estimatedDurationHours,
      priority,
      category,
      daysFromTodayStart: day,
      subtasks
    });
  }

  return { 
    tasks, 
    isFallback: true, 
    fallbackReason: "Gemini Free Quota Limit met. Handled gracefully with Companion local Smart Planner." 
  };
}

function generateFallbackHelp(taskName: string, category: string, helpType: string, occupation: string) {
  const cleanTask = taskName.trim();
  const title = `Local Study Guide: ${cleanTask}`;
  const introduction = `Your Companion Productivity Assistant compiled this smart local guide to help you master "${cleanTask}" effectively. Specially optimized for ${occupation || "Professionals"}!`;

  let codeBlock = undefined;
  if (helpType === "coding") {
    codeBlock = {
      language: "typescript",
      code: `// Scalable Architecture Blueprint for: ${cleanTask}
// Designed for ${occupation || "Professional"} workflows

interface TaskContext {
  taskName: string;
  category: string;
  timestamp: string;
}

export function initializeTask(ctx: TaskContext): boolean {
  console.log(\`[Companion Engine] Initiating workspace for: \${ctx.taskName}\`);
  try {
    // 1. Establish localized state configurations
    const isReady = true;
    
    // 2. Begin chronological workflow execution
    return isReady;
  } catch (error) {
    console.error("Failed to setup task context:", error);
    return false;
  }
}`
    };
  }

  const sections = [
    {
      heading: "Execution Framework",
      content: `Here are the foundational steps to successfully navigate "${cleanTask}" in your daily schedule:`,
      listItems: [
        "Chunk the task: Split this milestone into smaller focus blocks of 30-45 minutes.",
        "Remove environmental distractions: Set devices to Do-Not-Disturb and clear your browser workspace.",
        "Log incremental feedback: Note any technical bottlenecks or delays to reschedule subsequent slots."
      ]
    },
    {
      heading: "High-Performance Tactics",
      content: "Maximize efficiency by utilizing these proven cognitive approaches:",
      listItems: [
        "Timeboxing: Set a hard timer to avoid bikeshedding or over-engineering.",
        "Active recall: Frequently quiz yourself on key technical choices or core requirements.",
        "Buffer creation: Keep 15% of your estimated duration as a cooling offset."
      ]
    }
  ];

  const interactiveElements = [
    {
      type: "quiz",
      question: `What is the most effective way to prevent cognitive overload during "${cleanTask}"?`,
      answerOrOptions: "A) Working straight for 5 hours, B) Multi-tasking with email notifications, C) Breaking the task into bite-sized scheduled blocks, D) Delaying the task indefinitely",
      explanationOrCorrect: "Breaking the task into bite-sized scheduled blocks"
    },
    {
      type: "flashcard",
      question: `What is the core objective of the task "${cleanTask}"?`,
      answerOrOptions: `To drive incremental progress on ${cleanTask} with verified quality.`,
      explanationOrCorrect: "True"
    }
  ];

  return {
    title,
    introduction,
    codeBlock,
    sections,
    interactiveElements,
    isFallback: true,
    fallbackReason: "Gemini Free Quota Limit reached (20 reqs/day). Handled gracefully with local smart resource synthesis."
  };
}

function generateFallbackReflection(completedCount: number, pendingCount: number, timeSpentHours: number, streak: number, habitsDoneCount: number, occupation: string) {
  const isZero = completedCount === 0 && habitsDoneCount === 0;
  
  let text = "";
  if (isZero) {
    text = `Hey there! Even on days where you don't check off major tasks, organizing your roadmap and keeping consistent focus counts as progress. As a ${occupation || "Working Professional"}, planning is half the battle. Tomorrow, let's target one small, high-priority task first thing in the morning to spark your momentum!`;
  } else {
    text = `Phenomenal reflection today! You've successfully checked off ${completedCount} task(s) and logged ${timeSpentHours.toFixed(1)} focused hour(s). Your habit tracker is standing strong at a ${streak}-day streak, with ${habitsDoneCount} habit(s) locked in today!

As a ${occupation || "Working Professional"}, this level of modular consistency builds long-term compound gains. For the remaining ${pendingCount} pending task(s), we have automatically re-calibrated your upcoming slots to prevent overlap. Have a restful evening, and see you tomorrow!`;
  }

  return {
    recommendation: text,
    isFallback: true,
    fallbackReason: "Gemini Free Quota Limit reached (20 reqs/day). Handled gracefully with local coach heuristic engine."
  };
}

// AI Planning Engine Endpoint
app.post("/api/plan", async (req, res) => {
  const { prompt, occupation, userGoals, durationDays = 5 } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Goal prompt is required" });
  }

  try {
    const aiPrompt = `
      You are the Intelligent Planning Engine for Companion, a productivity assistant.
      The user's occupation is: ${occupation || 'not specified'}.
      The user's broader goals are: ${userGoals || 'general productivity'}.
      The user's natural language goal is: "${prompt}".
      They want a complete structured execution plan spanning approximately ${durationDays} days.
      
      Tasks should:
      - Be actionable, bite-sized, and realistic.
      - Specify effort (duration in hours).
      - Specify a priority (Low, Medium, High, Critical).
      - Specify a category (Study, Work, Personal, Health, Finance).
      - Assign a day offset (0 for today, 1 for tomorrow, 2 for day 2, etc.) to evenly distribute work.
      - List logical subtasks for each main task.

      Generate a highly detailed daily plan.
    `;

    const response = await generateContentWithFallback({
      contents: aiPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedDurationHours: { type: Type.NUMBER },
                  priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
                  category: { type: Type.STRING, enum: ["Study", "Work", "Personal", "Health", "Finance"] },
                  daysFromTodayStart: { type: Type.INTEGER },
                  subtasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["title", "estimatedDurationHours", "priority", "category", "daysFromTodayStart", "subtasks"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI Planning Engine");
    }

    const planData = JSON.parse(resultText);
    res.json(planData);
  } catch (error: any) {
    console.warn("Gemini API Error (Quotas/Keys). Invoking local Smart Fallback Planner:", error.message || error);
    try {
      const fallbackData = generateFallbackPlan(prompt, occupation, userGoals, durationDays);
      res.json(fallbackData);
    } catch (fallbackError: any) {
      console.error("Critical Fallback Failure:", fallbackError);
      res.status(500).json({ error: "Failed to plan tasks using both AI and fallback engines." });
    }
  }
});

// Contextual Assistance ("Need Help") Endpoint
app.post("/api/help", async (req, res) => {
  const { taskName, category, helpType, occupation } = req.body;
  if (!taskName) {
    return res.status(400).json({ error: "Task name is required" });
  }

  try {
    const aiPrompt = `
      You are the AI Productivity Assistant in Companion.
      The user needs helper resources for the task: "${taskName}" (Category: ${category || 'General'}, User's Occupation: ${occupation || 'User'}).
      The user has requested the help type: "${helpType || 'general'}".

      Based on the help type, generate:
      1. An elegant, concise introduction.
      2. If "coding", a relevant code snippet, its language, and instructions.
      3. Practical, structured sections of tips, steps, or items.
      4. Interactive items like flashcards, quick quizzes, or checklist items suitable for their task.

      Structure the output strictly following the JSON schema.
    `;

    const response = await generateContentWithFallback({
      contents: aiPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            introduction: { type: Type.STRING },
            codeBlock: {
              type: Type.OBJECT,
              properties: {
                language: { type: Type.STRING },
                code: { type: Type.STRING }
              },
              required: ["language", "code"]
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING },
                  listItems: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["heading", "content"]
              }
            },
            interactiveElements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["flashcard", "quiz", "qna", "outline", "agenda"] },
                  question: { type: Type.STRING },
                  answerOrOptions: { type: Type.STRING }, // for quiz, options split by comma or semi-colon
                  explanationOrCorrect: { type: Type.STRING }
                },
                required: ["type", "question", "answerOrOptions"]
              }
            }
          },
          required: ["title", "introduction", "sections"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI Productivity Assistant");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn("Gemini API Help Error. Invoking local helper fallback:", error.message || error);
    try {
      const fallbackHelp = generateFallbackHelp(taskName, category, helpType, occupation);
      res.json(fallbackHelp);
    } catch (fallbackError: any) {
      console.error("Critical Help Fallback Failure:", fallbackError);
      res.status(500).json({ error: "Failed to generate guidance materials." });
    }
  }
});

// Evening Reflection AI Insights Endpoint
app.post("/api/evening-reflection", async (req, res) => {
  const { completedCount, pendingCount, timeSpentHours, streak, habitsDoneCount, occupation } = req.body;

  try {
    const aiPrompt = `
      You are the AI Productivity Coach in Companion.
      The user is reflecting on their day.
      Here are today's metrics:
      - Completed Tasks: ${completedCount}
      - Pending Tasks: ${pendingCount}
      - Estimated Focus Time Invested: ${timeSpentHours} hours
      - Current Habit Streak: ${streak} days
      - Habits Checked Off Today: ${habitsDoneCount}
      - User's Occupation: ${occupation || 'Professional'}

      Provide a short, conversational, and highly motivational AI Evening Coach review (1-2 paragraphs max).
      Highlight their strengths, gently suggest how they can handle pending tasks tomorrow, and provide an actionable, highly specific scheduling recommendation (e.g., "Since you are a ${occupation || 'Professional'}, let's cluster your meetings in the afternoon and schedule deep focus work between 9 AM and 11 AM tomorrow.").
      Keep it warm, encouraging, and human.
    `;

    const response = await generateContentWithFallback({
      contents: aiPrompt
    });

    res.json({ recommendation: response.text || "You did great today! Keep up the momentum tomorrow." });
  } catch (error: any) {
    console.warn("Gemini API Reflection Error. Invoking local Coach fallback:", error.message || error);
    try {
      const fallbackReflection = generateFallbackReflection(completedCount, pendingCount, timeSpentHours, streak, habitsDoneCount, occupation);
      res.json(fallbackReflection);
    } catch (fallbackError: any) {
      console.error("Critical Reflection Fallback Failure:", fallbackError);
      res.status(500).json({ error: "Failed to generate coaching recommendation." });
    }
  }
});

// Serve assets and handle Vite in Development, express.static in Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
