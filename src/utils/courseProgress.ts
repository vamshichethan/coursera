import { getCurrentLearningUser } from "./streakTracking";

const COMPLETED_COURSES_KEY_PREFIX = "coursera-completed-courses";
const COURSE_PROGRESS_EVENT = "coursera-course-progress-updated";

const hasBrowserStorage = () => typeof window !== "undefined";

const getUserCourseProgressKey = (userId: string) =>
  `${COMPLETED_COURSES_KEY_PREFIX}:${userId.trim().toLowerCase()}`;

const notifyCourseProgressUpdated = () => {
  window.dispatchEvent(new Event(COURSE_PROGRESS_EVENT));
};

export const getCompletedCourseIds = (userId?: string): string[] => {
  if (!hasBrowserStorage()) {
    return [];
  }

  const resolvedUserId = userId || getCurrentLearningUser()?.email;

  if (!resolvedUserId) {
    return [];
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(getUserCourseProgressKey(resolvedUserId)) ||
        "[]"
    );
  } catch {
    return [];
  }
};

export const isCourseCompleted = (courseId: string, userId?: string) =>
  getCompletedCourseIds(userId).includes(courseId);

export const markCourseCompleted = (courseId: string) => {
  if (!hasBrowserStorage()) {
    return false;
  }

  const user = getCurrentLearningUser();

  if (!user) {
    return false;
  }

  const completedCourseIds = getCompletedCourseIds(user.email);

  if (completedCourseIds.includes(courseId)) {
    return true;
  }

  window.localStorage.setItem(
    getUserCourseProgressKey(user.email),
    JSON.stringify([...completedCourseIds, courseId])
  );
  notifyCourseProgressUpdated();

  return true;
};

export const subscribeToCourseProgressUpdates = (callback: () => void) => {
  window.addEventListener(COURSE_PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(COURSE_PROGRESS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};
