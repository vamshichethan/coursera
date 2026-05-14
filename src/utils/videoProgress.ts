import { Course } from "@/Components/data/constant";
import { getCurrentLearningUser } from "./streakTracking";

export type VideoProgressState = {
  courseId: string;
  videoId: string;
  timestamp: number;
  duration: number;
  updatedAt: string;
};

export type CourseResumeProgress = VideoProgressState & {
  moduleIndex: number;
  moduleTitle: string;
};

const VIDEO_PROGRESS_EVENT = "coursera-video-progress-updated";
const VIDEO_PROGRESS_PREFIX = "video-progress";
const ALMOST_COMPLETE_SECONDS = 10;
const ALMOST_COMPLETE_RATIO = 0.95;

const hasBrowserStorage = () => typeof window !== "undefined";

export const getNormalizedVideoId = (videoId: string) => {
  try {
    const url = new URL(videoId);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }

    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v") || url.pathname.split("/").pop() || "";
    }
  } catch {
    return videoId.split("?")[0];
  }

  return videoId;
};

const getVideoProgressUserId = (userId?: string) =>
  (userId || getCurrentLearningUser()?.email || "guest").trim().toLowerCase();

export const getVideoProgressKey = (
  userId: string,
  courseId: string,
  videoId: string
) =>
  `${VIDEO_PROGRESS_PREFIX}-${userId.trim().toLowerCase()}-${courseId}-${getNormalizedVideoId(
    videoId
  )}`;

const isAlmostComplete = (timestamp: number, duration: number) => {
  if (!duration) {
    return false;
  }

  return (
    duration - timestamp <= ALMOST_COMPLETE_SECONDS ||
    timestamp / duration >= ALMOST_COMPLETE_RATIO
  );
};

const notifyVideoProgressUpdated = () => {
  window.dispatchEvent(new Event(VIDEO_PROGRESS_EVENT));
};

export const getVideoProgress = (
  courseId: string,
  videoId: string,
  userId?: string
): VideoProgressState | null => {
  if (!hasBrowserStorage() || !videoId) {
    return null;
  }

  try {
    const resolvedUserId = getVideoProgressUserId(userId);
    const storedProgress = window.localStorage.getItem(
      getVideoProgressKey(resolvedUserId, courseId, videoId)
    );

    if (!storedProgress) {
      return null;
    }

    return JSON.parse(storedProgress);
  } catch {
    return null;
  }
};

export const saveVideoProgress = (
  courseId: string,
  videoId: string,
  timestamp: number,
  duration = 0,
  userId?: string
) => {
  if (!hasBrowserStorage() || !videoId) {
    return null;
  }

  const resolvedUserId = getVideoProgressUserId(userId);
  const nextTimestamp = isAlmostComplete(timestamp, duration)
    ? 0
    : Math.max(0, Math.floor(timestamp));
  const progress: VideoProgressState = {
    courseId,
    videoId: getNormalizedVideoId(videoId),
    timestamp: nextTimestamp,
    duration: Math.max(0, Math.floor(duration)),
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    getVideoProgressKey(resolvedUserId, courseId, videoId),
    JSON.stringify(progress)
  );
  notifyVideoProgressUpdated();

  return progress;
};

export const clearVideoProgress = (
  courseId: string,
  videoId: string,
  userId?: string
) => {
  if (!hasBrowserStorage() || !videoId) {
    return;
  }

  const resolvedUserId = getVideoProgressUserId(userId);
  window.localStorage.removeItem(
    getVideoProgressKey(resolvedUserId, courseId, videoId)
  );
  notifyVideoProgressUpdated();
};

export const getVideoResumeTimestamp = (
  courseId: string,
  videoId: string,
  userId?: string
) => {
  const progress = getVideoProgress(courseId, videoId, userId);

  if (!progress || isAlmostComplete(progress.timestamp, progress.duration)) {
    return 0;
  }

  return progress.timestamp;
};

export const getCourseResumeProgress = (
  courseId: string,
  modules: Course["modules"],
  userId?: string
): CourseResumeProgress | null => {
  const progressItems = modules
    .map((module, moduleIndex) => {
      if (!module.videoId) {
        return null;
      }

      const progress = getVideoProgress(courseId, module.videoId, userId);

      if (!progress || !progress.timestamp) {
        return null;
      }

      return {
        ...progress,
        moduleIndex,
        moduleTitle: module.title,
      };
    })
    .filter((progress): progress is CourseResumeProgress => Boolean(progress))
    .sort(
      (firstProgress, secondProgress) =>
        new Date(secondProgress.updatedAt).getTime() -
        new Date(firstProgress.updatedAt).getTime()
    );

  return progressItems[0] || null;
};

export const formatVideoTimestamp = (timestamp: number) => {
  const safeTimestamp = Math.max(0, Math.floor(timestamp));
  const minutes = Math.floor(safeTimestamp / 60);
  const seconds = String(safeTimestamp % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

export const subscribeToVideoProgressUpdates = (callback: () => void) => {
  window.addEventListener(VIDEO_PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(VIDEO_PROGRESS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};
