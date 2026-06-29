import { Task, CalendarEvent } from "../types";

// Convert HH:MM to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Convert minutes from midnight to HH:MM
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// Format Date object to YYYY-MM-DD in local time timezone-safely
export function toLocalISOString(date: Date): string {
  const localYear = date.getFullYear();
  const localMonth = (date.getMonth() + 1).toString().padStart(2, "0");
  const localDay = date.getDate().toString().padStart(2, "0");
  return `${localYear}-${localMonth}-${localDay}`;
}

// Check if a date string is weekday (Mon-Fri)
function isWeekday(dateStr: string): boolean {
  const [yr, mo, dy] = dateStr.split("-").map(Number);
  const date = new Date(yr, mo - 1, dy);
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
}

// Find free blocks in minutes on a given day
export function getFreeSlotsForDay(
  dateStr: string,
  calendarEvents: CalendarEvent[],
  occupation: string,
  startHourOverride: number = 8 // Default awake start at 8 AM
): { start: string; end: string }[] {
  let awakeStart = startHourOverride * 60; // 8:00 AM (480 minutes)
  const awakeEnd = 22 * 60; // 10:00 PM (1320 minutes)

  // Parse YYYY-MM-DD timezone-safely to check if target date is today
  const [targetYear, targetMonthOneIndexed, targetDay] = dateStr.split("-").map(Number);
  const targetMonth = targetMonthOneIndexed - 1;

  const now = new Date();
  const isToday = 
    targetYear === now.getFullYear() &&
    targetMonth === now.getMonth() &&
    targetDay === now.getDate();

  if (isToday) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    awakeStart = Math.max(awakeStart, currentMinutes);
  }

  // Initialize busy slots on this day
  const busySlots: { start: number; end: number }[] = [];

  // Add occupation-based busy slots if weekday
  if (isWeekday(dateStr)) {
    if (occupation === "Student") {
      busySlots.push({ start: 9 * 60, end: 12 * 60 }); // 9 AM - 12 PM (College)
      busySlots.push({ start: 13 * 60, end: 14 * 60 }); // 1 PM - 2 PM (Lunch block)
    } else if (occupation === "Working Professional") {
      busySlots.push({ start: 9 * 60, end: 17 * 60 }); // 9 AM - 5 PM (Office)
      busySlots.push({ start: 12 * 60, end: 13 * 60 }); // 12 PM - 1 PM (Lunch)
    } else if (occupation === "Entrepreneur") {
      busySlots.push({ start: 10 * 60, end: 16 * 60 }); // 10 AM - 4 PM (Meetings/Core)
      busySlots.push({ start: 13 * 60, end: 14 * 60 }); // 1 PM - 2 PM (Lunch)
    } else if (occupation === "Freelancer") {
      busySlots.push({ start: 13 * 60, end: 14 * 60 }); // 1 PM - 2 PM (Lunch)
    }
  } else {
    // Weekend lunch block
    busySlots.push({ start: 13 * 60, end: 14 * 60 });
  }

  // Parse Google Calendar events on this date
  calendarEvents.forEach((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Check if event falls on target day
    if (
      eventStart.getFullYear() === targetYear &&
      eventStart.getMonth() === targetMonth &&
      eventStart.getDate() === targetDay
    ) {
      const startMin = eventStart.getHours() * 60 + eventStart.getMinutes();
      const endMin = eventEnd.getHours() * 60 + eventEnd.getMinutes();
      busySlots.push({
        start: Math.max(0, startMin),
        end: Math.min(1440, endMin)
      });
    }
  });

  // Sort busy slots by start time
  busySlots.sort((a, b) => a.start - b.start);

  // Merge overlapping busy slots
  const mergedBusy: { start: number; end: number }[] = [];
  if (busySlots.length > 0) {
    let current = busySlots[0];
    for (let i = 1; i < busySlots.length; i++) {
      const next = busySlots[i];
      if (next.start <= current.end) {
        current.end = Math.max(current.end, next.end);
      } else {
        mergedBusy.push(current);
        current = next;
      }
    }
    mergedBusy.push(current);
  }

  // Calculate free slots inside awake hours [awakeStart, awakeEnd]
  const freeSlots: { start: string; end: string }[] = [];
  let currentStart = awakeStart;

  mergedBusy.forEach((busy) => {
    // If busy block is before awake starts, ignore
    if (busy.end <= awakeStart) return;
    // If busy block starts after awake ends, we're done
    if (busy.start >= awakeEnd) return;

    const limitStart = Math.max(awakeStart, busy.start);
    if (limitStart > currentStart) {
      freeSlots.push({
        start: minutesToTime(currentStart),
        end: minutesToTime(limitStart)
      });
    }
    currentStart = Math.max(currentStart, busy.end);
  });

  if (currentStart < awakeEnd) {
    freeSlots.push({
      start: minutesToTime(currentStart),
      end: minutesToTime(awakeEnd)
    });
  }

  return freeSlots;
}

// Calculate Date String shifted by days
export function getDateStringOffset(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return toLocalISOString(date);
}

// Intelligent Scheduling Engine: Assigns task slots avoiding busy hours and calendar events
export function scheduleTaskSlots(
  tasks: Task[],
  calendarEvents: CalendarEvent[],
  occupation: string
): Task[] {
  // Sort tasks by priority and deadline
  const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.daysFromTodayStart - b.daysFromTodayStart;
  });

  // Track already allocated minutes per date to avoid overlapping tasks
  const allocatedSlotsByDate: { [dateStr: string]: { start: number; end: number }[] } = {};

  // Pre-populate with user-locked/fixed slots first, so other dynamic tasks schedule around them
  tasks.forEach((task) => {
    if (!task.completed && task.isFixedSlot && task.scheduleSlot) {
      const dStr = task.scheduleSlot.date;
      if (!allocatedSlotsByDate[dStr]) {
        allocatedSlotsByDate[dStr] = [];
      }
      allocatedSlotsByDate[dStr].push({
        start: timeToMinutes(task.scheduleSlot.start),
        end: timeToMinutes(task.scheduleSlot.end),
      });
    }
  });

  return sortedTasks.map((task) => {
    if (task.completed) return task;

    // If it is a user-locked slot, preserve it as is
    if (task.isFixedSlot && task.scheduleSlot) {
      return task;
    }

    const daysOffset = task.daysFromTodayStart;
    const taskDate = task.deadlineDate || getDateStringOffset(daysOffset);

    // Get free slots available for this day
    const freeSlots = getFreeSlotsForDay(taskDate, calendarEvents, occupation);
    const durationMins = Math.round(task.estimatedDurationHours * 60);

    // Check custom scheduled tasks already placed on this day
    if (!allocatedSlotsByDate[taskDate]) {
      allocatedSlotsByDate[taskDate] = [];
    }

    // Try to find a free slot that accommodates durationMins
    let foundSlot: { date: string; start: string; end: string } | null = null;

    for (const slot of freeSlots) {
      const slotStartMin = timeToMinutes(slot.start);
      const slotEndMin = timeToMinutes(slot.end);
      const slotDuration = slotEndMin - slotStartMin;

      if (slotDuration >= durationMins) {
        // We need to verify it doesn't overlap with already allocated tasks on this day
        let currentCandidateStart = slotStartMin;
        const todayAllocated = allocatedSlotsByDate[taskDate];

        // Slide the candidate start through the slot to find a gap
        while (currentCandidateStart + durationMins <= slotEndMin) {
          const overlap = todayAllocated.find(
            (alloc) =>
              currentCandidateStart < alloc.end &&
              currentCandidateStart + durationMins > alloc.start
          );

          if (!overlap) {
            foundSlot = {
              date: taskDate,
              start: minutesToTime(currentCandidateStart),
              end: minutesToTime(currentCandidateStart + durationMins)
            };
            break;
          } else {
            // Jump forward past the overlapping allocated slot
            currentCandidateStart = overlap.end;
          }
        }
      }

      if (foundSlot) break;
    }

    // If no fitting slot was found, put it in the first free slot of at least 30 minutes, 
    // or just append at the end of the day or subsequent day
    if (!foundSlot) {
      // Find subsequent day
      let nextDayOffset = daysOffset;
      while (!foundSlot && nextDayOffset < daysOffset + 7) {
        nextDayOffset++;
        const nextDate = getDateStringOffset(nextDayOffset);
        const nextFree = getFreeSlotsForDay(nextDate, calendarEvents, occupation);
        if (!allocatedSlotsByDate[nextDate]) {
          allocatedSlotsByDate[nextDate] = [];
        }

        for (const slot of nextFree) {
          const slotStartMin = timeToMinutes(slot.start);
          const slotEndMin = timeToMinutes(slot.end);
          if (slotEndMin - slotStartMin >= 30) {
            let currentCandidateStart = slotStartMin;
            const nextAllocated = allocatedSlotsByDate[nextDate];

            while (currentCandidateStart + Math.min(60, durationMins) <= slotEndMin) {
              const overlap = nextAllocated.find(
                (alloc) =>
                  currentCandidateStart < alloc.end &&
                  currentCandidateStart + Math.min(60, durationMins) > alloc.start
              );

              if (!overlap) {
                foundSlot = {
                  date: nextDate,
                  start: minutesToTime(currentCandidateStart),
                  end: minutesToTime(currentCandidateStart + Math.min(60, durationMins))
                };
                break;
              } else {
                currentCandidateStart = overlap.end;
              }
            }
          }
          if (foundSlot) break;
        }
      }
    }

    if (foundSlot) {
      // Add to allocated
      allocatedSlotsByDate[foundSlot.date].push({
        start: timeToMinutes(foundSlot.start),
        end: timeToMinutes(foundSlot.end)
      });

      return {
        ...task,
        scheduleSlot: foundSlot
      };
    }

    return {
      ...task,
      scheduleSlot: null
    };
  });
}

// Calculate smart Priority Score
export function calculateSmartPriority(
  deadlineDate: string,
  estimatedHours: number,
  categoryImportance: string, // Low, Medium, High
  postponedCount: number
): "Low" | "Medium" | "High" | "Critical" {
  const [yr, mo, dy] = deadlineDate.split("-").map(Number);
  const targetDateLocal = new Date(yr, mo - 1, dy, 23, 59, 59); // end of deadline day
  const daysRemaining = Math.max(
    0.5,
    (targetDateLocal.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  let score = 0;

  // Deadline urgency (up to 40 pts)
  if (daysRemaining <= 1) score += 40;
  else if (daysRemaining <= 3) score += 25;
  else if (daysRemaining <= 7) score += 12;
  else score += 5;

  // Effort density (up to 30 pts)
  const hoursPerDayNeeded = estimatedHours / daysRemaining;
  if (hoursPerDayNeeded >= 4) score += 30;
  else if (hoursPerDayNeeded >= 2) score += 20;
  else if (hoursPerDayNeeded >= 0.5) score += 10;
  else score += 5;

  // Postponements penalty (up to 15 pts)
  score += Math.min(15, postponedCount * 5);

  // Category importance (up to 15 pts)
  if (categoryImportance === "High") score += 15;
  else if (categoryImportance === "Medium") score += 10;
  else score += 5;

  if (score >= 70) return "Critical";
  if (score >= 50) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}
