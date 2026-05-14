import confetti from "canvas-confetti";
import React, { useEffect, useRef, useState } from "react";
import {
  Star,
  Clock,
  Award,
  Users,
  CheckCircle2,
  PlayCircle,
  Download,
  Share2,
  BookmarkPlus,
  Globe,
  MessageCircle,
  ThumbsUp,
  AlignCenterVertical as Certificate,
  Calendar,
  Target,
  ChevronDown,
  Briefcase,
  Building2,
  ArrowLeft,
  BookOpen,
  HelpCircle,
  FileText,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/router";
import CourseReminderControls from "@/Components/CourseReminderControls";
import { Course, courses } from "@/Components/data/constant";
import Videolayer from "@/Components/Videolayer";
import {
  getOfflineAvailability,
  getOfflineCourse,
  removeOfflineCourse,
  saveCourseForOffline,
} from "@/utils/offlineCourses";
import {
  isCourseCompleted,
  markCourseCompleted,
  subscribeToCourseProgressUpdates,
} from "@/utils/courseProgress";
import { cancelCourseReminder } from "@/utils/courseReminders";
import {
  recordCourseLearningActivity,
  subscribeToStreakUpdates,
} from "@/utils/streakTracking";
import {
  CourseResumeProgress,
  formatVideoTimestamp,
  getCourseResumeProgress,
  getVideoResumeTimestamp,
  subscribeToVideoProgressUpdates,
} from "@/utils/videoProgress";

function CourseDetails() {
  const [selectedModule, setSelectedModule] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedmoduleindex, setselectedmoduleindex] = useState(0);
  const [showmodulepage, setshowmodulepage] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const hasShownCompletionCelebration = useRef(false);
  const router = useRouter();
  const { id } = router.query; // Get course ID from route
  const [course, setCourse] = useState<Course | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCourseIds, setOfflineCourseIds] = useState<string[]>([]);
  const [offlineUnavailable, setOfflineUnavailable] = useState(false);
  const [offlineAction, setOfflineAction] = useState<
    "idle" | "downloading" | "removing"
  >("idle");
  const [offlineNotice, setOfflineNotice] = useState("");
  const [streakNotice, setStreakNotice] = useState("");
  const [resumeProgress, setResumeProgress] =
    useState<CourseResumeProgress | null>(null);

  const refreshOfflineMetadata = async () => {
    const metadata = await getOfflineAvailability();
    setOfflineCourseIds(metadata.map((item) => item.courseId));
  };

  useEffect(() => {
    if (id) {
      setCourseCompleted(false);
      setShowCompletionMessage(false);
      hasShownCompletionCelebration.current = false;
    }
  }, [id]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(window.navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    window.addEventListener("offline-courses-updated", refreshOfflineMetadata);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      window.removeEventListener(
        "offline-courses-updated",
        refreshOfflineMetadata
      );
    };
  }, []);

  useEffect(() => {
    if (!id || Array.isArray(id)) {
      return;
    }

    let isCancelled = false;

    const loadCourse = async () => {
      await refreshOfflineMetadata();
      setOfflineNotice("");

      if (!isOnline) {
        const offlineCourse = await getOfflineCourse(id);

        if (isCancelled) {
          return;
        }

        if (offlineCourse) {
          setCourse(offlineCourse);
          setOfflineUnavailable(false);
        } else {
          setCourse(null);
          setOfflineUnavailable(true);
        }

        return;
      }

      const foundCourse = courses.find((c) => c.id === id);

      if (!isCancelled) {
        setCourse(foundCourse || null);
        setOfflineUnavailable(false);
      }
    };

    loadCourse();

    return () => {
      isCancelled = true;
    };
  }, [id, isOnline]);

  useEffect(() => {
    if (!courseCompleted || hasShownCompletionCelebration.current) {
      return;
    }

    hasShownCompletionCelebration.current = true;
    setShowCompletionMessage(true);

    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      origin: { y: 0.7 },
      spread: 70,
      startVelocity: 35,
      ticks: 90,
      zIndex: 1000,
    };

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = Math.round(35 * (timeLeft / duration));

      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.25, y: 0.7 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.75, y: 0.7 },
      });
    }, 250);

    const messageTimer = window.setTimeout(() => {
      setShowCompletionMessage(false);
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(messageTimer);
    };
  }, [courseCompleted]);

  useEffect(() => {
    if (!course) {
      return;
    }

    const refreshCompletionState = () => {
      setCourseCompleted(isCourseCompleted(course.id));
    };

    refreshCompletionState();
    const unsubscribeFromProgress =
      subscribeToCourseProgressUpdates(refreshCompletionState);
    const unsubscribeFromUser = subscribeToStreakUpdates(refreshCompletionState);

    return () => {
      unsubscribeFromProgress();
      unsubscribeFromUser();
    };
  }, [course?.id]);

  useEffect(() => {
    if (!course) {
      setResumeProgress(null);
      return;
    }

    const refreshResumeProgress = () => {
      setResumeProgress(getCourseResumeProgress(course.id, course.modules));
    };

    refreshResumeProgress();
    return subscribeToVideoProgressUpdates(refreshResumeProgress);
  }, [course]);

  if (offlineUnavailable) {
    return (
      <div className="min-h-[50vh] bg-gray-50 px-4 py-16 text-center">
        <div className="mx-auto max-w-xl rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-3 text-2xl font-bold text-gray-900">
            Offline Content Unavailable
          </h1>
          <p className="text-gray-600">
            This course is not available offline. Please connect to the internet
            to download it.
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="text-center text-red-500">Course not found!</div>;
  }
  const Module = course.modules[selectedmoduleindex];
  const isCourseOffline = offlineCourseIds.includes(course.id);
  const currentVideoStartTime = Module.videoId
    ? getVideoResumeTimestamp(course.id, Module.videoId)
    : 0;
  const resumeButtonText = resumeProgress
    ? `Resume Watching (${formatVideoTimestamp(resumeProgress.timestamp)})`
    : "Resume Watching";
  const refreshCurrentCourseResumeProgress = () => {
    setResumeProgress(getCourseResumeProgress(course.id, course.modules));
  };
  const trackCourseActivity = () => {
    const result = recordCourseLearningActivity(course.id);

    if (result.reason === "not-logged-in") {
      setStreakNotice("Sign in to track your daily learning streak.");
      return;
    }

    if (result.updated) {
      setStreakNotice(
        `Daily learning streak updated: ${result.streak.currentStreak} day${
          result.streak.currentStreak === 1 ? "" : "s"
        }.`
      );
      return;
    }

    setStreakNotice("Today's course activity is already counted.");
  };
  const handlebackclick = () => {
    setshowmodulepage(false);
  };
  const openCourseModule = (moduleIndex = 0) => {
    trackCourseActivity();
    setselectedmoduleindex(moduleIndex);
    setshowmodulepage(true);
  };
  const handlemoduleclick = () => {
    openCourseModule(0);
  };
  const handleresumewatching = () => {
    const latestResumeProgress = getCourseResumeProgress(
      course.id,
      course.modules
    );

    openCourseModule(latestResumeProgress?.moduleIndex || 0);
  };
  const handlecompletecourse = () => {
    trackCourseActivity();
    if (!courseCompleted) {
      markCourseCompleted(course.id);
      cancelCourseReminder(course.id);
      setCourseCompleted(true);
    }
  };

  const handledownloadcourse = async () => {
    if (!window.navigator.onLine) {
      setOfflineNotice("Please connect to the internet to download this course.");
      return;
    }

    try {
      setOfflineAction("downloading");
      setOfflineNotice("");
      const sourceCourse = courses.find((item) => item.id === course.id) || course;
      await saveCourseForOffline(sourceCourse);
      await refreshOfflineMetadata();
      setOfflineNotice("Course content is now available offline.");
    } catch {
      setOfflineNotice("Unable to download this course for offline access.");
    } finally {
      setOfflineAction("idle");
    }
  };

  const handleremoveofflinecourse = async () => {
    try {
      setOfflineAction("removing");
      await removeOfflineCourse(course.id);
      await refreshOfflineMetadata();
      setOfflineNotice("Offline course content removed.");

      if (!window.navigator.onLine) {
        setCourse(null);
        setOfflineUnavailable(true);
      }
    } catch {
      setOfflineNotice("Unable to remove offline course content.");
    } finally {
      setOfflineAction("idle");
    }
  };

  if (showmodulepage) {

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {showCompletionMessage && (
          <div className="fixed left-1/2 top-6 z-[1001] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-sm border border-blue-100 bg-white px-5 py-4 text-center shadow-xl">
            <p className="text-lg font-semibold text-gray-900">
              Great Job! You&apos;ve completed this course!
            </p>
          </div>
        )}
        <header className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:px-6">
          <button
            onClick={handlebackclick}
            className="mr-0 flex items-center text-gray-700 transition-colors hover:text-blue-600 sm:mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">Back to Courses</span>
          </button>
          <h1 className="ml-0 text-lg font-semibold text-gray-800 sm:ml-2 sm:text-xl">
            {course.title}
          </h1>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            {isCourseOffline && (
              <span className="rounded-sm bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                Available Offline
              </span>
            )}
            {isCourseOffline ? (
              <button
                onClick={handleremoveofflinecourse}
                disabled={offlineAction === "removing"}
                className="flex items-center justify-center rounded-sm border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {offlineAction === "removing"
                  ? "Removing..."
                  : "Remove Offline"}
              </button>
            ) : (
              <button
                onClick={handledownloadcourse}
                disabled={offlineAction === "downloading" || !isOnline}
                className="flex items-center justify-center rounded-sm bg-[#0056D2] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Download className="mr-2 h-4 w-4" />
                {offlineAction === "downloading"
                  ? "Downloading..."
                  : "Download Offline"}
              </button>
            )}
          </div>
        </header>
        {offlineNotice && (
          <div className="border-b bg-blue-50 px-4 py-2 text-sm text-blue-800">
            {offlineNotice}
          </div>
        )}
        {streakNotice && (
          <div className="border-b bg-orange-50 px-4 py-2 text-sm text-orange-800">
            {streakNotice}
          </div>
        )}
        {!courseCompleted && (
          <div className="border-b bg-gray-50 px-4 py-3">
            <CourseReminderControls
              courseId={course.id}
              courseTitle={course.title}
              isCompleted={courseCompleted}
            />
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="w-full flex-shrink-0 border-b border-gray-200 lg:h-full lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Course Modules
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Module {selectedmoduleindex + 1} of {course.modules.length}
              </p>
            </div>
            <nav className="flex gap-2 overflow-x-auto p-2 lg:block lg:overflow-visible lg:p-0 lg:py-2">
              {course.modules.map((module, index) => (
                <button
                  key={index}
                  onClick={() => {
                    trackCourseActivity();
                    setselectedmoduleindex(index);
                  }}
                  className={`min-w-[260px] rounded-md p-4 text-left transition-colors hover:bg-gray-50 lg:w-full lg:min-w-0 lg:rounded-none ${
                    selectedmoduleindex === index ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        selectedmoduleindex === index
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3
                        className={`font-medium ${
                          selectedmoduleindex === index
                            ? "text-blue-600"
                            : "text-gray-800"
                        }`}
                      >
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {module.duration}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="h-full flex-1 overflow-y-auto bg-gray-50">
            <div className="mx-auto max-w-full p-4 sm:p-6">
              <div className="mb-6 rounded-xl bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">
                  {Module.title}
                </h2>
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    {Module.duration}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {Module.hours} hours
                  </span>
                </div>

                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      trackCourseActivity();
                      setselectedmoduleindex(
                        Math.max(0, selectedmoduleindex - 1)
                      );
                    }}
                    disabled={selectedmoduleindex === 0}
                    className={`flex items-center justify-center rounded-md px-4 py-2 ${
                      selectedmoduleindex === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous Module
                  </button>
                  {selectedmoduleindex === course.modules.length - 1 ? (
                    <button
                      onClick={handlecompletecourse}
                      disabled={courseCompleted}
                      className={`flex items-center justify-center rounded-md px-4 py-2 ${
                        courseCompleted
                          ? "bg-green-50 text-green-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {courseCompleted ? "Course Completed" : "Complete Course"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        trackCourseActivity();
                        setselectedmoduleindex(
                          Math.min(
                            course.modules.length - 1,
                            selectedmoduleindex + 1
                          )
                        );
                      }}
                      className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Next Module
                      <ArrowLeft className="h-4 w-4 ml-2 transform rotate-180" />
                    </button>
                  )}
                </div>
                {Module.videoId && (
                  <div className="mb-8">
                    <Videolayer
                      key={`${course.id}-${Module.videoId}`}
                      videoId={Module.videoId}
                      title={Module.title}
                      courseId={course.id}
                      initialTime={currentVideoStartTime}
                      onProgressChange={refreshCurrentCourseResumeProgress}
                    />
                  </div>
                )}
                {!Module.videoId && course.image && (
                  <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <img
                      src={course.image}
                      alt={`${course.title} offline preview`}
                      className="h-56 w-full object-cover sm:h-72"
                    />
                  </div>
                )}
                {!isOnline && !Module.videoId && (
                  <div className="mb-8 rounded-sm border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                    Videos are not included in offline downloads. Text lessons
                    and images remain available.
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                <h3 className="text-xl font-semibold mb-4">
                  About this module
                </h3>
                <p className="text-gray-700 mb-8">{Module.description}</p>

                <h4 className="font-medium text-gray-800 mb-4">
                  Module Details
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-800">Duration</h4>
                    </div>
                    <p className="text-gray-600">{Module.weeks} weeks</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-800">Study Hours</h4>
                    </div>
                    <p className="text-gray-600">{Module.hours} hours</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-800">Projects</h4>
                    </div>
                    <p className="text-gray-600">{Module.projects} projects</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <HelpCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-800">Quizzes</h4>
                    </div>
                    <p className="text-gray-600">{Module.quizzes} quizzes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const fullDescription = `
    Prepare for a career in the high-growth field of data analytics, no experience or degree required. 
    Get professional training designed by Google and have the opportunity to connect with top employers.
    
    Data analytics is the collection, transformation, and organization of data in order to draw conclusions, 
    make predictions, and drive informed decision making. Over 8 courses, gain in-demand skills that prepare 
    you for an entry-level job. You'll learn from Google employees whose foundations in data analytics 
    served as launchpads for their own careers.
    
    This program includes over 180 hours of instruction and hundreds of practice-based assessments, which 
    will help you simulate real-world data analytics scenarios that are critical for success in the workplace. 
    The content is highly interactive and exclusively developed by Google employees with decades of 
    experience in data analytics. Through a mix of videos, assessments, and hands-on labs, you'll get 
    introduced to analysis tools and platforms and key analytical skills required for an entry-level job.
  `;

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 bg-white border-b z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex min-h-16 flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:py-0">
            <div className="flex max-w-full items-center gap-5 overflow-x-auto text-sm md:gap-8 md:text-base">
              <a
                href="#overview"
                className="text-gray-700 hover:text-[#0056D2]"
              >
                Overview
              </a>
              <a href="#skills" className="text-gray-700 hover:text-[#0056D2]">
                Skills
              </a>
              <a href="#content" className="text-gray-700 hover:text-[#0056D2]">
                Content
              </a>
              <a
                href="#instructors"
                className="text-gray-700 hover:text-[#0056D2]"
              >
                Instructors
              </a>
              <a href="#reviews" className="text-gray-700 hover:text-[#0056D2]">
                Reviews
              </a>
              <a href="#careers" className="text-gray-700 hover:text-[#0056D2]">
                Career Outcomes
              </a>
            </div>
            <button
              className="w-full rounded-sm bg-[#0056D2] px-6 py-2 font-semibold text-white md:w-auto"
              onClick={handlemoduleclick}
            >
              Enroll Now
            </button>
          </div>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
            <div className="max-w-2xl">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <Certificate className="h-5 w-5 text-[#0056D2]" />
                  <span className="ml-1 text-gray-600">{course.type}</span>
                </div>
                <div className="flex items-center text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="ml-1 font-semibold text-gray-900">
                    {course.rating}
                  </span>
                </div>
              </div>

              <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                {course.title}
              </h1>

              <p className="mb-6 text-base text-gray-600 sm:text-lg">
                {showFullDescription
                  ? fullDescription
                  : fullDescription.slice(0, 200) + "..."}
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[#0056D2] ml-2 hover:underline"
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              </p>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span className="ml-2">{course.students}</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-gray-500" />
                  <span className="ml-2">{course.level}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="ml-2">{course.timeline}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="ml-2">Updated {course.lastUpdated}</span>
                </div>
              </div>

              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  className="rounded-sm bg-[#0056D2] px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                  onClick={handlemoduleclick}
                >
                  Start Free Trial
                </button>
                <button
                  className="flex items-center justify-center rounded-sm border border-[#0056D2] px-5 py-3 font-semibold text-[#0056D2] transition-colors hover:bg-blue-50"
                  onClick={handleresumewatching}
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {resumeButtonText}
                </button>
                {isCourseOffline ? (
                  <button
                    onClick={handleremoveofflinecourse}
                    disabled={offlineAction === "removing"}
                    className="flex items-center justify-center rounded-sm border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    {offlineAction === "removing"
                      ? "Removing..."
                      : "Remove Offline"}
                  </button>
                ) : (
                  <button
                    onClick={handledownloadcourse}
                    disabled={offlineAction === "downloading" || !isOnline}
                    className="flex items-center justify-center rounded-sm border border-[#0056D2] px-5 py-3 font-semibold text-[#0056D2] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {offlineAction === "downloading"
                      ? "Downloading..."
                      : "Download Offline"}
                  </button>
                )}
                <div className="flex items-center space-x-4">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <BookmarkPlus className="h-6 w-6 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Share2 className="h-6 w-6 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="mb-8 flex flex-col gap-2">
                {isCourseOffline && (
                  <span className="w-fit rounded-sm bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                    Available Offline
                  </span>
                )}
                {offlineNotice && (
                  <p className="text-sm text-blue-700">{offlineNotice}</p>
                )}
                {streakNotice && (
                  <p className="text-sm text-orange-700">{streakNotice}</p>
                )}
                <CourseReminderControls
                  courseId={course.id}
                  courseTitle={course.title}
                  isCompleted={courseCompleted}
                />
              </div>

              <div className="flex items-center gap-4">
                <Globe className="h-5 w-5 text-gray-500" />
                <div className="flex flex-wrap items-center gap-x-2">
                  {course.languages.map((lang, index) => (
                    <span key={index} className="text-sm text-gray-600">
                      {lang}
                      {index < course.languages.length - 1 ? "," : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[400px]">
              <div className="overflow-hidden rounded-lg bg-white shadow-xl lg:sticky lg:top-24">
                <div className="relative">
                  <img
                    src={course.image}
                    alt="Course Preview"
                    className="h-[210px] w-full object-cover sm:h-[225px]"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white cursor-pointer hover:scale-110 transition-transform" />
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl font-bold">
                        {course.price.monthly}
                      </span>
                      <span className="text-gray-500 line-through">
                        {course.price.fullCourse}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      7-day free trial • Cancel anytime
                    </p>
                  </div>

                  <button
                    className="w-full px-4 py-3 bg-[#0056D2] text-white font-semibold rounded-sm hover:bg-blue-700 transition-colors mb-4"
                    onClick={handlemoduleclick}
                  >
                    Start Free Trial
                  </button>
                  <button
                    className="mb-4 flex w-full items-center justify-center rounded-sm border border-[#0056D2] px-4 py-3 font-semibold text-[#0056D2] transition-colors hover:bg-blue-50"
                    onClick={handleresumewatching}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    {resumeButtonText}
                  </button>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      Shareable Certificate upon completion
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Globe className="h-5 w-5 text-green-500 mr-2" />
                      100% online and flexible schedule
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Target className="h-5 w-5 text-green-500 mr-2" />
                      Beginner-friendly, no prerequisites
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Briefcase className="h-5 w-5 text-green-500 mr-2" />
                      Real-world projects included
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Career Outcomes */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Career Outcomes</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {course.careerOutcomes.map((outcome, index) => {
              const IconComponent = outcome.icon; // Now it's already a React component

              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {IconComponent && (
                    <IconComponent className="h-8 w-8 text-[#0056D2] mb-4" />
                  )}
                  <h3 className="text-lg font-semibold mb-2">
                    {outcome.title}
                  </h3>
                  <p className="text-2xl font-bold text-[#0056D2]">
                    {outcome.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skills You'll Gain */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Skills you'll gain</h2>
          <div className="flex flex-wrap gap-3">
            {course.skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm hover:border-[#0056D2] hover:text-[#0056D2] transition-colors cursor-pointer"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold">Course Content</h2>
            <div className="text-sm text-gray-600 sm:text-base">
              <span className="font-semibold">8</span> modules •
              <span className="font-semibold"> 180+</span> hours •
              <span className="font-semibold"> 25</span> hands-on projects
            </div>
          </div>

          <div className="space-y-4">
            {course.modules.map((module, index) => (
              <div
                key={index}
                className={`bg-white border rounded-lg overflow-hidden transition-shadow hover:shadow-md
                  ${
                    selectedModule === index
                      ? "border-[#0056D2]"
                      : "border-gray-200"
                  }`}
              >
                <button
                  className="w-full p-4 text-left sm:p-6"
                  onClick={() =>
                    setSelectedModule(selectedModule === index ? -1 : index)
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-[#0056D2] font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <h3 className="mb-1 text-base font-semibold sm:text-lg">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {module.duration}
                        </p>
                        <p className="text-gray-600">{module.description}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-6 w-6 text-gray-400 transform transition-transform
                        ${selectedModule === index ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {selectedModule === index && (
                  <div className="border-t px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-semibold">{module.weeks} weeks</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Learning Hours</p>
                        <p className="font-semibold">{module.hours} hours</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Projects</p>
                        <p className="font-semibold">
                          {module.projects} hands-on
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Assessments</p>
                        <p className="font-semibold">
                          {module.quizzes} quizzes
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Learner Success Stories</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {course.testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex items-start gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {testimonial.author}
                    </h3>
                    <p className="text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-[#0056D2]">
                      {testimonial.impact}
                    </p>
                  </div>
                </div>
                <blockquote className="text-gray-600 italic">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Do I need prior experience?
                </h3>
                <p className="text-gray-600">
                  No prior experience is required. This program is designed for
                  beginners and will teach you everything from the ground up.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  How long does it take to complete?
                </h3>
                <p className="text-gray-600">
                  The program typically takes 6 months to complete with 10
                  hours/week of study. You can learn at your own pace and adjust
                  the schedule to your needs.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  What kind of support is available?
                </h3>
                <p className="text-gray-600">
                  You'll have access to a global learner community, course
                  mentors, and technical support throughout your learning
                  journey.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Is the certificate recognized?
                </h3>
                <p className="text-gray-600">
                  Yes, upon completion you'll receive an industry-recognized
                  certificate from Google that you can share with prospective
                  employers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Learning CTA */}
      <div className="bg-[#0056D2] py-10 text-white sm:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            Ready to Start Your Data Analytics Journey?
          </h2>
          <p className="mb-8 text-base text-blue-100 sm:text-xl">
            Join 1.7M+ learners and launch your career in data analytics
          </p>
          <button className="px-8 py-3 bg-white text-[#0056D2] font-semibold rounded-sm hover:bg-gray-100 transition-colors">
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseDetails;
