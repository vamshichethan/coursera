import { getCurrentLearningUser } from "./streakTracking";

export type CourseReminderType = "one-hour" | "tomorrow" | "none";

export type CourseReminder = {
  userId: string;
  courseId: string;
  courseTitle: string;
  reminderType: CourseReminderType;
  reminderTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const REMINDER_KEY_PREFIX = "coursera-course-reminders";
const REMINDER_EVENT = "coursera-course-reminders-updated";
const activeReminderTimers = new Map<string, number>();

const hasBrowserStorage = () => typeof window !== "undefined";

const getReminderStorageKey = (userId: string) =>
  `${REMINDER_KEY_PREFIX}:${userId.trim().toLowerCase()}`;

const getReminderTimerKey = (reminder: CourseReminder) =>
  `${reminder.userId.trim().toLowerCase()}:${reminder.courseId}`;

const notifyReminderUpdated = () => {
  window.dispatchEvent(new Event(REMINDER_EVENT));
};

const getAllReminderStorageKeys = () => {
  if (!hasBrowserStorage()) {
    return [];
  }

  return Object.keys(window.localStorage).filter((key) =>
    key.startsWith(`${REMINDER_KEY_PREFIX}:`)
  );
};

const getReminderTime = (reminderType: CourseReminderType) => {
  const reminderDate = new Date();

  if (reminderType === "one-hour") {
    reminderDate.setHours(reminderDate.getHours() + 1);
    return reminderDate;
  }

  reminderDate.setDate(reminderDate.getDate() + 1);
  return reminderDate;
};

const writeReminders = (userId: string, reminders: CourseReminder[]) => {
  window.localStorage.setItem(
    getReminderStorageKey(userId),
    JSON.stringify(reminders)
  );
  notifyReminderUpdated();
};

const markReminderInactive = (reminder: CourseReminder) => {
  const reminders = getCourseReminders(reminder.userId).map((item) =>
    item.courseId === reminder.courseId
      ? {
          ...item,
          isActive: false,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  writeReminders(reminder.userId, reminders);
};

const showReminderNotification = (reminder: CourseReminder) => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  const notification = new Notification("Time to continue learning!", {
    body: `Resume your course: ${reminder.courseTitle}`,
    tag: `course-reminder-${reminder.courseId}`,
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = `/course/${reminder.courseId}`;
  };
};

export const getCourseReminders = (userId?: string): CourseReminder[] => {
  if (!hasBrowserStorage()) {
    return [];
  }

  const resolvedUserId = userId || getCurrentLearningUser()?.email;

  if (!resolvedUserId) {
    return [];
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(getReminderStorageKey(resolvedUserId)) || "[]"
    );
  } catch {
    return [];
  }
};

export const getCourseReminder = (courseId: string, userId?: string) =>
  getCourseReminders(userId).find((reminder) => reminder.courseId === courseId);

export const requestCourseReminderPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
};

export const saveCourseReminder = (
  courseId: string,
  courseTitle: string,
  reminderType: Exclude<CourseReminderType, "none">
) => {
  if (!hasBrowserStorage()) {
    return null;
  }

  const user = getCurrentLearningUser();

  if (!user) {
    return null;
  }

  const now = new Date().toISOString();
  const existingReminder = getCourseReminder(courseId, user.email);
  const nextReminder: CourseReminder = {
    userId: user.email,
    courseId,
    courseTitle,
    reminderType,
    reminderTime: getReminderTime(reminderType).toISOString(),
    isActive: true,
    createdAt: existingReminder?.createdAt || now,
    updatedAt: now,
  };
  const reminders = getCourseReminders(user.email);
  const nextReminders = existingReminder
    ? reminders.map((reminder) =>
        reminder.courseId === courseId ? nextReminder : reminder
      )
    : [...reminders, nextReminder];

  writeReminders(user.email, nextReminders);
  scheduleCourseReminder(nextReminder);

  return nextReminder;
};

export const cancelCourseReminder = (courseId: string) => {
  if (!hasBrowserStorage()) {
    return null;
  }

  const user = getCurrentLearningUser();

  if (!user) {
    return null;
  }

  const existingReminder = getCourseReminder(courseId, user.email);
  const now = new Date().toISOString();
  const inactiveReminder: CourseReminder = {
    userId: user.email,
    courseId,
    courseTitle: existingReminder?.courseTitle || "",
    reminderType: "none",
    reminderTime: "",
    isActive: false,
    createdAt: existingReminder?.createdAt || now,
    updatedAt: now,
  };
  const nextReminders = existingReminder
    ? getCourseReminders(user.email).map((reminder) =>
        reminder.courseId === courseId ? inactiveReminder : reminder
      )
    : [...getCourseReminders(user.email), inactiveReminder];

  clearCourseReminderTimer(user.email, courseId);
  writeReminders(user.email, nextReminders);

  return inactiveReminder;
};

export const clearCourseReminderTimer = (userId: string, courseId: string) => {
  const timerKey = `${userId.trim().toLowerCase()}:${courseId}`;
  const timerId = activeReminderTimers.get(timerKey);

  if (timerId) {
    window.clearTimeout(timerId);
    activeReminderTimers.delete(timerKey);
  }
};

export const clearAllCourseReminderTimers = () => {
  activeReminderTimers.forEach((timerId) => window.clearTimeout(timerId));
  activeReminderTimers.clear();
};

export const scheduleCourseReminder = (reminder: CourseReminder) => {
  if (!hasBrowserStorage() || !reminder.isActive || !reminder.reminderTime) {
    return;
  }

  const timerKey = getReminderTimerKey(reminder);
  const existingTimerId = activeReminderTimers.get(timerKey);

  if (existingTimerId) {
    window.clearTimeout(existingTimerId);
  }

  const delay = new Date(reminder.reminderTime).getTime() - Date.now();

  if (delay > 2147483647) {
    return;
  }

  const timerId = window.setTimeout(() => {
    showReminderNotification(reminder);
    markReminderInactive(reminder);
    activeReminderTimers.delete(timerKey);
  }, Math.max(0, delay));

  activeReminderTimers.set(timerKey, timerId);
};

export const activateStoredCourseReminders = () => {
  getAllReminderStorageKeys().forEach((storageKey) => {
    try {
      const reminders: CourseReminder[] = JSON.parse(
        window.localStorage.getItem(storageKey) || "[]"
      );

      reminders.forEach(scheduleCourseReminder);
    } catch {
      // Ignore malformed reminder data so the app can keep running.
    }
  });
};

export const subscribeToCourseReminderUpdates = (callback: () => void) => {
  window.addEventListener(REMINDER_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(REMINDER_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};
