import { Course } from "@/Components/data/constant";

export type OfflineCourseMeta = {
  courseId: string;
  title: string;
  downloadedAt: string;
  offlineAvailable: boolean;
};

const DB_NAME = "coursera-offline-content";
const DB_VERSION = 1;
const COURSE_STORE = "courses";
const METADATA_KEY = "coursera-offline-course-metadata";

const hasBrowserStorage = () =>
  typeof window !== "undefined" && Boolean(window.indexedDB);

const openOfflineDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (!hasBrowserStorage()) {
      reject(new Error("Offline storage is not available in this browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(COURSE_STORE)) {
        db.createObjectStore(COURSE_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const cacheImageAsDataUrl = async (imageUrl: string) => {
  if (!imageUrl || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return imageUrl;
    }

    const blob = await response.blob();
    return readBlobAsDataUrl(blob);
  } catch {
    return imageUrl;
  }
};

const notifyOfflineMetadataChanged = () => {
  window.dispatchEvent(new Event("offline-courses-updated"));
};

const areMetadataListsEqual = (
  currentMetadata: OfflineCourseMeta[],
  nextMetadata: OfflineCourseMeta[]
) => JSON.stringify(currentMetadata) === JSON.stringify(nextMetadata);

const writeOfflineMetadata = (metadata: OfflineCourseMeta[]) => {
  window.localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  notifyOfflineMetadataChanged();
};

export const getOfflineMetadata = (): OfflineCourseMeta[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(METADATA_KEY) || "[]");
  } catch {
    return [];
  }
};

const createOfflineCourse = async (course: Course): Promise<Course> => ({
  ...course,
  image: await cacheImageAsDataUrl(course.image),
  modules: course.modules.map((module) => ({
    ...module,
    videoId: "",
  })),
  testimonials: await Promise.all(
    course.testimonials.map(async (testimonial) => ({
      ...testimonial,
      image: await cacheImageAsDataUrl(testimonial.image),
    }))
  ),
  careerOutcomes: course.careerOutcomes.map((outcome) => ({
    title: outcome.title,
    value: outcome.value,
  })),
});

const getAllStoredOfflineCourses = async () => {
  const db = await openOfflineDb();

  const offlineCourses = await new Promise<Course[]>((resolve, reject) => {
    const transaction = db.transaction(COURSE_STORE, "readonly");
    const request = transaction.objectStore(COURSE_STORE).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return offlineCourses;
};

export const getOfflineAvailability = async (): Promise<OfflineCourseMeta[]> => {
  const currentMetadata = getOfflineMetadata();

  try {
    const offlineCourses = await getAllStoredOfflineCourses();
    const metadataByCourseId = new Map(
      currentMetadata.map((metadata) => [metadata.courseId, metadata])
    );
    const nextMetadata = offlineCourses.map((course) => ({
      courseId: course.id,
      title: course.title,
      downloadedAt:
        metadataByCourseId.get(course.id)?.downloadedAt ||
        new Date().toISOString(),
      offlineAvailable: true,
    }));

    if (!areMetadataListsEqual(currentMetadata, nextMetadata)) {
      writeOfflineMetadata(nextMetadata);
    }

    return nextMetadata;
  } catch {
    return currentMetadata;
  }
};

export const saveCourseForOffline = async (course: Course) => {
  const db = await openOfflineDb();
  const offlineCourse = await createOfflineCourse(course);
  const metadata: OfflineCourseMeta = {
    courseId: course.id,
    title: course.title,
    downloadedAt: new Date().toISOString(),
    offlineAvailable: true,
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(COURSE_STORE, "readwrite");
    transaction.objectStore(COURSE_STORE).put(offlineCourse);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();

  const nextMetadata = [
    ...getOfflineMetadata().filter((item) => item.courseId !== course.id),
    metadata,
  ];
  writeOfflineMetadata(nextMetadata);

  return metadata;
};

export const getOfflineCourse = async (courseId: string) => {
  const db = await openOfflineDb();

  const course = await new Promise<Course | null>((resolve, reject) => {
    const transaction = db.transaction(COURSE_STORE, "readonly");
    const request = transaction.objectStore(COURSE_STORE).get(courseId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return course;
};

export const removeOfflineCourse = async (courseId: string) => {
  const db = await openOfflineDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(COURSE_STORE, "readwrite");
    transaction.objectStore(COURSE_STORE).delete(courseId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
  writeOfflineMetadata(
    getOfflineMetadata().filter((item) => item.courseId !== courseId)
  );
};

export const isCourseDownloaded = (courseId: string) =>
  getOfflineMetadata().some(
    (item) => item.courseId === courseId && item.offlineAvailable
  );
