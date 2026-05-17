import { Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { subscribeToCourseReminderFired } from "@/utils/courseReminders";
import type { CourseReminder } from "@/utils/courseReminders";

const CourseReminderToast = () => {
  const [reminder, setReminder] = useState<CourseReminder | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearCloseTimer = () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };

    const unsubscribe = subscribeToCourseReminderFired((nextReminder) => {
      clearCloseTimer();
      setReminder(nextReminder);
      closeTimerRef.current = window.setTimeout(() => {
        setReminder(null);
      }, 15000);
    });

    return () => {
      clearCloseTimer();
      unsubscribe();
    };
  }, []);

  if (!reminder) {
    return null;
  }

  const openCourse = () => {
    window.location.href = `/course/${reminder.courseId}`;
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-[1100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-sm border border-blue-100 bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0056D2]">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">
            Time to continue learning!
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Resume your course: {reminder.courseTitle}
          </p>
          <button
            type="button"
            onClick={openCourse}
            className="mt-3 rounded-sm bg-[#0056D2] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Resume Course
          </button>
        </div>
        <button
          type="button"
          onClick={() => setReminder(null)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CourseReminderToast;
