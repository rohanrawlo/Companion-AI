# Companion - The Last-Minute Life Saver 🚀

Companion is an intelligent, context-aware daily planner designed to act as your dynamic personal scheduling assistant. It understands your actual local time, respects external Google Calendar events, and dynamically places your tasks only in upcoming available hours. It also supports manual specific time slots with an interactive overlap warning and dynamic rescheduling options.

---

## 📋 Table of Contents

1. [Solution Overview](#-solution-overview)
2. [Key Features](#-key-features)
3. [🤖 AI Assistant & Help Generator](#-ai-assistant--help-generator)
4. [📱 PWA (Progressive Web App) Implementation Guide](#-pwa-progressive-web-app-implementation-guide)
5. [🛠️ How to Remove the "Generated from..." Badge on GitHub](#-how-to-remove-the-generated-from-badge-on-github)
6. [💻 Technologies & Google Stack Utilized](#-technologies--google-stack-utilized)
7. [🚀 Getting Started & Configuration](#-getting-started--configuration)

---


## 💡 Solution Overview

**Companion** solves this by establishing a real-time temporal anchor. The application:
* Constantly synchronizes with the user's actual local timezone and clock.
* Dynamically schedules task slots only in upcoming available hours.
* Connects with Google Calendar to block out busy event hours.
* Introduces **Flexible Custom Time Slots** where users can optional set manual times.
* Features an **Overlap Resolution System** that alerts users when slots conflict, offering an option to replace and dynamically reschedule existing tasks, or cancel the input.
**NOTE** : Companion is built as a Progressive Web App (PWA), allowing users to install it on any supported device—including Android phones, iPhones, tablets, laptops, and desktops. Once installed, it behaves like a native application with its own app icon, full-screen experience, and quick access, enabling users to use Companion anytime, anywhere without requiring installation from an app store.
<img width="1918" height="870" alt="image" src="https://github.com/user-attachments/assets/d4d521d9-22b0-46d1-9327-857c48b4d6ba" />

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
Companion doesn't stop at planning your tasks—it actively supports you while you're working.

When it's time to begin a scheduled task, Companion displays a "Start Task" prompt. Once the user starts the task, a "Need Help?" button becomes available, providing instant access to the AI Assistant.

The AI offers real-time, context-aware guidance based on the selected task, helping users overcome obstacles and stay productive.
<img width="1918" height="847" alt="image" src="https://github.com/user-attachments/assets/ccc56c8f-676c-4a5f-a86a-75b0d6af50cf" />
<img width="1918" height="876" alt="image" src="https://github.com/user-attachments/assets/c00129b9-3886-4242-a689-f1df91612a43" />



---

## 📱 PWA (Progressive Web App) Implementation Guide

### Tips to Use Companion More Effectively as a PWA:
* **Add to Home Screen**: Open the App URL in your mobile browser (Safari/Chrome) and tap "Add to Home Screen" or click the install icon in your desktop address bar to use Companion as a standalone full-screen desktop/mobile app without browser chrome.
* **Offline First Capability**: Companion relies on localized states and falls back to browser caches when offline. You can review, complete, and add tasks even without internet connectivity. Once connection is re-established, changes can be synced back to Firebase.

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


