export type LearningUser = {
  name: string;
  email: string;
  image: string;
};

export type StreakBadge = "3-Day Streak" | "7-Day Streak" | "30-Day Streak";

export type LearningStreakState = {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  earnedBadges: StreakBadge[];
  activityDates: string[];
  interactedCourseIds: string[];
};

type ActivityResult = {
  updated: boolean;
  reason: "activity-recorded" | "already-recorded-today" | "not-logged-in";
  streak: LearningStreakState;
};

export const CURRENT_USER_KEY = "coursera-current-user";
const STREAK_KEY_PREFIX = "coursera-learning-streak";
const STREAK_EVENT = "coursera-streak-updated";

export const streakMilestones: { days: number; label: StreakBadge }[] = [
  { days: 3, label: "3-Day Streak" },
  { days: 7, label: "7-Day Streak" },
  { days: 30, label: "30-Day Streak" },
];

const emptyStreakState = (): LearningStreakState => ({
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  earnedBadges: [],
  activityDates: [],
  interactedCourseIds: [],
});

const hasBrowserStorage = () => typeof window !== "undefined";

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseLocalDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getDayDistance = (startDateKey: string, endDateKey: string) => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const startDate = parseLocalDateKey(startDateKey).getTime();
  const endDate = parseLocalDateKey(endDateKey).getTime();

  return Math.round((endDate - startDate) / millisecondsPerDay);
};

const getUserStreakKey = (email: string) =>
  `${STREAK_KEY_PREFIX}:${email.trim().toLowerCase()}`;

const notifyStreakUpdated = () => {
  window.dispatchEvent(new Event(STREAK_EVENT));
};

export const getCurrentLearningUser = (): LearningUser | null => {
  if (!hasBrowserStorage()) {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(CURRENT_USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const setCurrentLearningUser = (user: LearningUser) => {
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  notifyStreakUpdated();
};

export const clearCurrentLearningUser = () => {
  window.localStorage.removeItem(CURRENT_USER_KEY);
  notifyStreakUpdated();
};

export const getLearningStreak = (email?: string): LearningStreakState => {
  if (!hasBrowserStorage()) {
    return emptyStreakState();
  }

  const userEmail = email || getCurrentLearningUser()?.email;

  if (!userEmail) {
    return emptyStreakState();
  }

  try {
    return {
      ...emptyStreakState(),
      ...JSON.parse(
        window.localStorage.getItem(getUserStreakKey(userEmail)) || "{}"
      ),
    };
  } catch {
    return emptyStreakState();
  }
};

const saveLearningStreak = (email: string, streak: LearningStreakState) => {
  window.localStorage.setItem(getUserStreakKey(email), JSON.stringify(streak));
  notifyStreakUpdated();
};

const getEarnedBadges = (
  currentStreak: number,
  existingBadges: StreakBadge[]
) => {
  const earnedBadges = new Set(existingBadges);

  streakMilestones.forEach((milestone) => {
    if (currentStreak >= milestone.days) {
      earnedBadges.add(milestone.label);
    }
  });

  return Array.from(earnedBadges);
};

export const recordCourseLearningActivity = (
  courseId: string
): ActivityResult => {
  const user = getCurrentLearningUser();

  if (!user) {
    return {
      updated: false,
      reason: "not-logged-in",
      streak: emptyStreakState(),
    };
  }

  const today = getLocalDateKey();
  const currentStreakState = getLearningStreak(user.email);
  const interactedCourseIds = currentStreakState.interactedCourseIds.includes(
    courseId
  )
    ? currentStreakState.interactedCourseIds
    : [...currentStreakState.interactedCourseIds, courseId];

  if (currentStreakState.lastActivityDate === today) {
    const nextStreakState = {
      ...currentStreakState,
      interactedCourseIds,
    };

    saveLearningStreak(user.email, nextStreakState);

    return {
      updated: false,
      reason: "already-recorded-today",
      streak: nextStreakState,
    };
  }

  const missedDays = currentStreakState.lastActivityDate
    ? getDayDistance(currentStreakState.lastActivityDate, today)
    : 0;
  const nextCurrentStreak =
    missedDays === 1 ? currentStreakState.currentStreak + 1 : 1;
  const nextLongestStreak = Math.max(
    currentStreakState.longestStreak,
    nextCurrentStreak
  );
  const activityDates = currentStreakState.activityDates.includes(today)
    ? currentStreakState.activityDates
    : [...currentStreakState.activityDates, today];
  const nextStreakState = {
    currentStreak: nextCurrentStreak,
    longestStreak: nextLongestStreak,
    lastActivityDate: today,
    earnedBadges: getEarnedBadges(
      nextCurrentStreak,
      currentStreakState.earnedBadges
    ),
    activityDates,
    interactedCourseIds,
  };

  saveLearningStreak(user.email, nextStreakState);

  return {
    updated: true,
    reason: "activity-recorded",
    streak: nextStreakState,
  };
};

export const subscribeToStreakUpdates = (callback: () => void) => {
  window.addEventListener(STREAK_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(STREAK_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};
