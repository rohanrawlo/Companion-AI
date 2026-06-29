# Companion - The Last-Minute Life Saver

## Problem Statement Selected
**The Last-Minute Life Saver**: Busy professionals, freelancers, and students struggle to dynamically organize tasks without them overlapping with existing commitments or slipping into the past. Simple calendars don't know the actual current time context when scheduling, often placing new tasks in already elapsed hours of the day (e.g., scheduling a task at 8:00 AM when the current time is already 12:26 PM).

---

## Solution Overview
**Companion** is an intelligent, context-aware daily planner designed to act as a dynamic personal schedule assistant. Companion understands the real local time of the user and continuously schedules dynamic tasks only in upcoming available hours. It respects Google Calendar events and existing commitments. It also offers users the optional capability to manually specify fixed slots with automatic conflict detection, offering a prompt to either resolve overlaps dynamically by rescheduling existing tasks or canceling the input.

---

## Key Features
1. **Context-Aware Dynamic Slotting**:
   - The scheduling engine detects the **actual current local time** (e.g., 12:26 PM).
   - Dynamic tasks are automatically placed in the future, preventing past-hour scheduling anomalies.
   
2. **Flexible Custom Time Slots**:
   - Users can optionally select a specific date, start time, and end time for any task.
   - Automatically calculates and updates the estimated duration from custom selections.

3. **Overlap Conflict Resolution Modal**:
   - When a custom slot overlaps with an existing task schedule, a visual modal warns the user.
   - Users can choose to **Replace Slot** (which locks the new task and dynamically reschedules/displaces the overlapping task to next available slots) or **Cancel Input**.

4. **Interactive Timeline & Progress Tracker**:
   - High-contrast, beautifully structured daily timeline featuring task categories (Work, Personal, Health, Study, Social).
   - Real-time tracker showing local timezone-safe date and ticking clock.

5. **Habit Tracker & Analytics**:
   - Daily habit completion loops with historical streak tracking.
   - Productivity analytics powered by interactive visual charts representing completed tasks per day.

---

## Technologies Used
- **Frontend Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Interactions & Animations**: Framer Motion (`motion/react`)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Data Persistence**: Firebase Firestore / Local State fallback
- **Authentication**: Firebase Authentication

---

## Google Technologies Utilized
- **Google Generative AI (Gemini SDK)**: Powers the conversational schedule recommendation assistant and intelligent daily reflection companion.
- **Firebase / Google Cloud Hosting**: Secure environment for full-stack application deployment.
- **Google Calendar Mock Integration**: Seamless parsing of external calendar events to guarantee zero conflict in scheduled slots.
