import { Bell, BellOff, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  cancelCourseReminder,
  CourseReminder,
  CourseReminderType,
  getCourseReminder,
  requestCourseReminderPermission,
  saveCourseReminder,
  subscribeToCourseReminderUpdates,
} from "@/utils/courseReminders";
import {
  getCurrentLearningUser,
  LearningUser,
  subscribeToStreakUpdates,
} from "@/utils/streakTracking";

type CourseReminderControlsProps = {
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
};

const reminderOptions: {
  type: CourseReminderType;
  label: string;
  icon: typeof Clock;
}[] = [
  { type: "one-hour", label: "Remind me in 1 hour", icon: Clock },
  { type: "tomorrow", label: "Remind me tomorrow", icon: Bell },
  { type: "none", label: "No reminders", icon: BellOff },
];

const formatReminderTime = (reminderTime: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(reminderTime));

function CourseReminderControls({
  courseId,
  courseTitle,
  isCompleted,
}: CourseReminderControlsProps) {
  const [currentUser, setCurrentUser] = useState<LearningUser | null>(null);
  const [reminder, setReminder] = useState<CourseReminder | undefined>();
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const refreshReminder = () => {
    const user = getCurrentLearningUser();

    setCurrentUser(user);
    setReminder(user ? getCourseReminder(courseId, user.email) : undefined);
  };

  useEffect(() => {
    refreshReminder();

    const unsubscribeFromUser = subscribeToStreakUpdates(refreshReminder);
    const unsubscribeFromReminders =
      subscribeToCourseReminderUpdates(refreshReminder);

    return () => {
      unsubscribeFromUser();
      unsubscribeFromReminders();
    };
  }, [courseId]);

  if (isCompleted) {
    return null;
  }

  const activeReminder = reminder?.isActive ? reminder : undefined;

  const handleReminderChange = async (reminderType: CourseReminderType) => {
    if (!currentUser) {
      setNotice("Sign in to set course reminders.");
      return;
    }

    setIsSaving(true);
    setNotice("");

    try {
      if (reminderType === "none") {
        cancelCourseReminder(courseId);
        setNotice("Reminder canceled.");
        return;
      }

      const permission = await requestCourseReminderPermission();

      if (permission === "unsupported") {
        setNotice("Browser notifications are not supported here.");
        return;
      }

      if (permission !== "granted") {
        setNotice("Enable browser notifications to use course reminders.");
        return;
      }

      const nextReminder = saveCourseReminder(
        courseId,
        courseTitle,
        reminderType
      );

      if (nextReminder) {
        setNotice(`Reminder set for ${formatReminderTime(nextReminder.reminderTime)}.`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center text-base font-semibold text-gray-900">
            <Bell className="mr-2 h-5 w-5 text-[#0056D2]" />
            Course Reminder
          </h3>
          {activeReminder && (
            <p className="mt-1 text-sm text-gray-600">
              {activeReminder.reminderType === "one-hour"
                ? "Remind me in 1 hour"
                : "Remind me tomorrow"}
              {" · "}
              {formatReminderTime(activeReminder.reminderTime)}
            </p>
          )}
        </div>
        {activeReminder && (
          <span className="rounded-sm bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0056D2]">
            Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {reminderOptions.map((option) => {
          const Icon = option.icon;
          const isSelected =
            activeReminder?.reminderType === option.type ||
            (!activeReminder && option.type === "none");

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => handleReminderChange(option.type)}
              disabled={isSaving}
              className={`flex items-center justify-center rounded-sm border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-[#0056D2] bg-blue-50 text-[#0056D2]"
                  : "border-gray-300 bg-white text-gray-700 hover:border-[#0056D2] hover:text-[#0056D2]"
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <p className="mt-3 flex items-start text-sm text-gray-700">
          <XCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-[#0056D2]" />
          {notice}
        </p>
      )}
    </section>
  );
}

export default CourseReminderControls;
