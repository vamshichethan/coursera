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
const REMINDER_FIRED_EVENT = "coursera-course-reminder-fired";
const REMINDER_CHECK_INTERVAL_MS = 30000;
const activeReminderTimers = new Map<string, number>();
const firingReminderKeys = new Set<string>();
let reminderMonitorTimer: number | undefined;
let reminderMonitorListenersActive = false;

const hasBrowserStorage = () => typeof window !== "undefined";

const getReminderStorageKey = (userId: string) =>
  `${REMINDER_KEY_PREFIX}:${userId.trim().toLowerCase()}`;

const getReminderTimerKey = (reminder: CourseReminder) =>
  `${reminder.userId.trim().toLowerCase()}:${reminder.courseId}`;

const notifyReminderUpdated = () => {
  window.dispatchEvent(new Event(REMINDER_EVENT));
};

const notifyReminderFired = (reminder: CourseReminder) => {
  window.dispatchEvent(
    new CustomEvent<CourseReminder>(REMINDER_FIRED_EVENT, {
      detail: reminder,
    })
  );
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

const getNotificationOptions = (reminder: CourseReminder): NotificationOptions => ({
  body: `Resume your course: ${reminder.courseTitle}`,
  data: {
    courseId: reminder.courseId,
    url: `/course/${reminder.courseId}`,
  },
  icon: "/favicon.ico",
  tag: `course-reminder-${reminder.courseId}`,
});

const showReminderNotification = async (reminder: CourseReminder) => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return false;
  }

  const notificationOptions = getNotificationOptions(reminder);

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration?.showNotification) {
        await registration.showNotification(
          "Time to continue learning!",
          notificationOptions
        );
        return true;
      }
    } catch {
      // Fall back to the page-level Notification API below.
    }
  }

  const notification = new Notification(
    "Time to continue learning!",
    notificationOptions
  );

  notification.onclick = () => {
    window.focus();
    window.location.href = `/course/${reminder.courseId}`;
  };

  return true;
};

const isReminderDue = (reminder: CourseReminder) => {
  if (!reminder.isActive || !reminder.reminderTime) {
    return false;
  }

  const reminderTimestamp = new Date(reminder.reminderTime).getTime();

  return Number.isFinite(reminderTimestamp) && reminderTimestamp <= Date.now();
};

const readRemindersFromStorageKey = (storageKey: string): CourseReminder[] => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
};

const fireCourseReminder = async (reminder: CourseReminder) => {
  const timerKey = getReminderTimerKey(reminder);

  if (firingReminderKeys.has(timerKey)) {
    return;
  }

  firingReminderKeys.add(timerKey);

  try {
    const latestReminder = getCourseReminder(reminder.courseId, reminder.userId);

    if (
      !latestReminder?.isActive ||
      latestReminder.reminderTime !== reminder.reminderTime
    ) {
      return;
    }

    const notificationShown = await showReminderNotification(latestReminder);

    if (notificationShown) {
      notifyReminderFired(latestReminder);
      markReminderInactive(latestReminder);
    }
  } finally {
    const timerId = activeReminderTimers.get(timerKey);

    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      activeReminderTimers.delete(timerKey);
    }

    firingReminderKeys.delete(timerKey);
  }
};

export const checkDueCourseReminders = () => {
  if (!hasBrowserStorage()) {
    return;
  }

  getAllReminderStorageKeys().forEach((storageKey) => {
    readRemindersFromStorageKey(storageKey)
      .filter(isReminderDue)
      .forEach((reminder) => {
        void fireCourseReminder(reminder);
      });
  });
};

const handleReminderWakeup = () => {
  checkDueCourseReminders();
};

const handleReminderVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    checkDueCourseReminders();
  }
};

const startCourseReminderMonitor = () => {
  if (!hasBrowserStorage()) {
    return;
  }

  if (reminderMonitorTimer === undefined) {
    reminderMonitorTimer = window.setInterval(
      checkDueCourseReminders,
      REMINDER_CHECK_INTERVAL_MS
    );
  }

  if (!reminderMonitorListenersActive) {
    window.addEventListener("focus", handleReminderWakeup);
    window.addEventListener("online", handleReminderWakeup);
    window.addEventListener("pageshow", handleReminderWakeup);
    document.addEventListener(
      "visibilitychange",
      handleReminderVisibilityChange
    );
    reminderMonitorListenersActive = true;
  }
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

  if (timerId !== undefined) {
    window.clearTimeout(timerId);
    activeReminderTimers.delete(timerKey);
  }
};

export const clearAllCourseReminderTimers = () => {
  activeReminderTimers.forEach((timerId) => window.clearTimeout(timerId));
  activeReminderTimers.clear();

  if (reminderMonitorTimer !== undefined) {
    window.clearInterval(reminderMonitorTimer);
    reminderMonitorTimer = undefined;
  }

  if (hasBrowserStorage() && reminderMonitorListenersActive) {
    window.removeEventListener("focus", handleReminderWakeup);
    window.removeEventListener("online", handleReminderWakeup);
    window.removeEventListener("pageshow", handleReminderWakeup);
    document.removeEventListener(
      "visibilitychange",
      handleReminderVisibilityChange
    );
    reminderMonitorListenersActive = false;
  }
};

export const scheduleCourseReminder = (reminder: CourseReminder) => {
  if (!hasBrowserStorage() || !reminder.isActive || !reminder.reminderTime) {
    return;
  }

  const timerKey = getReminderTimerKey(reminder);
  const existingTimerId = activeReminderTimers.get(timerKey);

  if (existingTimerId !== undefined) {
    window.clearTimeout(existingTimerId);
  }

  const delay = new Date(reminder.reminderTime).getTime() - Date.now();

  if (delay > 2147483647) {
    return;
  }

  const timerId = window.setTimeout(() => {
    void fireCourseReminder(reminder);
  }, Math.max(0, delay));

  activeReminderTimers.set(timerKey, timerId);
};

export const activateStoredCourseReminders = () => {
  getAllReminderStorageKeys().forEach((storageKey) => {
    readRemindersFromStorageKey(storageKey).forEach((reminder) => {
      if (isReminderDue(reminder)) {
        void fireCourseReminder(reminder);
        return;
      }

      scheduleCourseReminder(reminder);
    });
  });

  startCourseReminderMonitor();
  checkDueCourseReminders();
};

export const subscribeToCourseReminderUpdates = (callback: () => void) => {
  window.addEventListener(REMINDER_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(REMINDER_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

export const subscribeToCourseReminderFired = (
  callback: (reminder: CourseReminder) => void
) => {
  const handleReminderFired = (event: Event) => {
    callback((event as CustomEvent<CourseReminder>).detail);
  };

  window.addEventListener(REMINDER_FIRED_EVENT, handleReminderFired);

  return () => {
    window.removeEventListener(REMINDER_FIRED_EVENT, handleReminderFired);
  };
};
