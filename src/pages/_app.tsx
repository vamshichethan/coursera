import Fotter from "@/Components/Fotter";
import CourseReminderToast from "@/Components/CourseReminderToast";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import {
  activateStoredCourseReminders,
  clearAllCourseReminderTimers,
} from "@/utils/courseReminders";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    activateStoredCourseReminders();

    if ("serviceWorker" in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      };

      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
      }

      return () => {
        window.removeEventListener("load", registerServiceWorker);
        clearAllCourseReminderTimers();
      };
    }

    return () => {
      clearAllCourseReminderTimers();
    };
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <Component {...pageProps} />
      <CourseReminderToast />
      <Fotter />
    </div>
  );
}
