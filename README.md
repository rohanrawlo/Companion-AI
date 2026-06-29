# Companion - The Last-Minute Life Saver 🚀

Companion is an intelligent, context-aware daily planner designed to act as your dynamic personal scheduling assistant. It understands your actual local time, respects external Google Calendar events, and dynamically places your tasks only in upcoming available hours. It also supports manual specific time slots with an interactive overlap warning and dynamic rescheduling options.

---

## 📋 Table of Contents
1. [Problem Statement Selected](#-problem-statement-selected)
2. [Solution Overview](#-solution-overview)
3. [Key Features](#-key-features)
4. [🤖 AI Assistant & Help Generator](#-ai-assistant--help-generator)
5. [📱 PWA (Progressive Web App) Implementation Guide](#-pwa-progressive-web-app-implementation-guide)
6. [🛠️ How to Remove the "Generated from..." Badge on GitHub](#-how-to-remove-the-generated-from-badge-on-github)
7. [💻 Technologies & Google Stack Utilized](#-technologies--google-stack-utilized)
8. [🚀 Getting Started & Configuration](#-getting-started--configuration)

---

## 🔍 Problem Statement Selected

### **The Last-Minute Life Saver**
Busy professionals, freelancers, and students struggle to dynamically organize their tasks without them overlapping with existing commitments or slipping into the past. 

**The Challenge:** Traditional calendars and simple task lists do not understand the actual current time context when scheduling. They often place new tasks in already elapsed hours of the day (e.g., scheduling a task at 8:00 AM when the current time is already 12:26 PM).

---

## 💡 Solution Overview

**Companion** solves this by establishing a real-time temporal anchor. The application:
* Constantly synchronizes with the user's actual local timezone and clock.
* Dynamically schedules task slots only in upcoming available hours.
* Connects with Google Calendar to block out busy event hours.
* Introduces **Flexible Custom Time Slots** where users can optional set manual times.
* Features an **Overlap Resolution System** that alerts users when slots conflict, offering an option to replace and dynamically reschedule existing tasks, or cancel the input.

---

## ✨ Key Features

### 1. Context-Aware Dynamic Slotting
* The scheduling engine detects the **actual current local time**.
* Dynamic tasks are automatically queued into upcoming available hours of the workday, preventing past-hour scheduling anomalies.

### 2. Flexible Custom Time Slots
* Users can optionally toggle "Set Specific Time Slot" to manually specify a date, start time, and end time.
* The system automatically calculates the estimated duration in real-time from the chosen times.

### 3. Interactive Overlap Warning System
* If a custom-set slot overlaps with an existing task schedule, an elegant conflict resolution modal triggers immediately.
* **Replace Slot**: Overwrites the overlapping slot, lock the new task, and dynamically pushes/reschedules the old task to the next available free hours.
* **Cancel Input**: Safely stops the insertion and keeps your schedule unchanged.

### 4. Interactive Timeline & Progress Tracker
* Real-time tracker showing local timezone-safe date and ticking clock.
* Staggered animated task categories (Work, Personal, Health, Study, Social) on a high-contrast chronological timeline.

### 5. Habit Tracker & Productivity Analytics
* Interactive habits board tracking streaks, historical logs, and completion metrics over the last 7 days.
* Productivity analytics with interactive charts powered by **Recharts** to analyze completed tasks.

---

## 🤖 AI Assistant & Help Generator

Companion includes a built-in server-side **Gemini AI Assistant** integration to help you manage your schedule and generate tailored productivity solutions:

### How it works:
* **Conversational Scheduler**: Click the **"Ask AI Assistant"** tab to talk to Gemini. You can input commands like:
  * *"I need help organizing my study tasks because I have an exam tomorrow."*
  * *"Generate a perfect workflow for a freelance developer who works in 2-hour sprints."*
  * *"Help! My schedule is too tight. How should I prioritize?"*
* **Dynamic Workflows**: Gemini analyzes your current workload, task priorities, and workspace context, returning real-time recommendations, subtask breakdowns, and custom productivity techniques.
* **Daily Reflection Companion**: Every evening, click on **"Evening Reflection"**. Gemini will review your completed tasks/habits and generate a personal summary, highlighting streaks and areas of improvement with actionable coaching insights.

---

## 📱 PWA (Progressive Web App) Implementation Guide

To use Companion more effectively as a desktop or mobile application, you can configure it as a **Progressive Web App (PWA)**. This enables offline access, installability, and lightning-fast load times.

### 1. Step-by-Step PWA Configuration

To add PWA support to this Vite + React project:

1. **Install the Vite PWA Plugin**:
   ```bash
   npm install vite-plugin-pwa -D
   ```

2. **Configure `vite.config.ts`**:
   Add the plugin to your Vite config to auto-generate the Service Worker and Web App Manifest:
   ```typescript
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import { VitePWA } from "vite-plugin-pwa";

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: "autoUpdate",
         includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
         manifest: {
           name: "Companion Daily Planner",
           short_name: "Companion",
           description: "Dynamic personal daily schedule assistant",
           theme_color: "#4f46e5",
           background_color: "#ffffff",
           display: "standalone",
           icons: [
             {
               src: "pwa-192x192.png",
               sizes: "192x192",
               type: "image/png"
             },
             {
               src: "pwa-512x512.png",
               sizes: "512x512",
               type: "image/png"
             }
           ]
         }
       })
     ]
   });
   ```

3. **Register Service Worker in `src/main.tsx`**:
   ```typescript
   import { registerSW } from "virtual:pwa-register";

   // Register service worker for offline usage and updates
   if ("serviceWorker" in navigator) {
     registerSW({ immediate: true });
   }
   ```

### 2. Tips to Use Companion More Effectively as a PWA:
* **Add to Home Screen**: Open the App URL in your mobile browser (Safari/Chrome) and tap "Add to Home Screen" or click the install icon in your desktop address bar to use Companion as a standalone full-screen desktop/mobile app without browser chrome.
* **Offline First Capability**: Companion relies on localized states and falls back to browser caches when offline. You can review, complete, and add tasks even without internet connectivity. Once connection is re-established, changes can be synced back to Firebase.

---

## 🛠️ How to Remove the "Generated from..." Badge on GitHub

When you create a repository on GitHub using a template, GitHub automatically places a subheader at the top: **"generated from google-gemini/aistudio-repository-template"**.

If you want to make this repository completely independent and remove that attribution badge, follow these simple steps:

### Option A: Create a Fresh Repository (Recommended)
1. **Create a new, empty repository** on your GitHub account (do **not** use "Use this template" or initialize with README/LICENSE).
2. Open your terminal in this project directory and run the following commands:
   ```bash
   # Rename the current remote to old-origin (just in case)
   git remote rename origin old-origin

   # Associate your new, fresh repository as the main origin
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO_NAME.git

   # Push your current branch to the new repository
   git branch -M main
   git push -u origin main
   ```
3. Once pushed, the new repository will be completely clean with **no template attribution badge**!

---

## 💻 Technologies & Google Stack Utilized

* **Frontend Framework**: React 18+ with TypeScript (configured with native ESM and type-safety)
* **Design & Animations**: Tailwind CSS & Framer Motion (`motion/react`) for seamless transitions and tactile interactive cues
* **Google Generative AI SDK**: Server-side `@google/genai` integration with Gemini models for workload summarization and schedule recommendations
* **Firebase Suite**:
  * **Firebase Firestore**: Multi-device state synchronization and cloud-persisted storage.
  * **Firebase Authentication**: Secure user log-ins and profile creation.
* **Recharts**: Beautiful, fully customizable data charts for productivity analytics.

---

## 🚀 Getting Started & Configuration

### Prerequisites
* Node.js (v18+)
* npm (v9+)

### Installation & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in your `.env` file (copied from `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```


