import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getNormalizedVideoId,
  getVideoResumeTimestamp,
  saveVideoProgress,
} from "@/utils/videoProgress";

type VideolayerProps = {
  videoId: string;
  title: string;
  courseId?: string;
  progressVideoId?: string;
  initialTime?: number;
  onProgressChange?: () => void;
};

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: { data: number; target: YouTubePlayer }) => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

const loadYouTubeApi = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires a browser."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const existingCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      existingCallback?.();

      if (window.YT) {
        resolve(window.YT);
      }
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });

  return youtubeApiPromise;
};

const Videolayer = ({
  videoId,
  title,
  courseId,
  progressVideoId,
  initialTime = 0,
  onProgressChange,
}: VideolayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const hasSeekedToInitialTime = useRef(false);
  const normalizedVideoId = getNormalizedVideoId(videoId);
  const storageVideoId = progressVideoId || videoId;
  const playerElementId = useMemo(
    () => `youtube-player-${Math.random().toString(36).slice(2)}`,
    []
  );
  const [resumeLabel, setResumeLabel] = useState("");

  const clearProgressTimer = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const saveCurrentProgress = () => {
    if (!courseId || !storageVideoId || !playerRef.current) {
      return;
    }

    try {
      const timestamp = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      saveVideoProgress(courseId, storageVideoId, timestamp, duration);
      onProgressChange?.();
    } catch {
      // The YouTube iframe can throw while it is being replaced between modules.
    }
  };

  useEffect(() => {
    if (!courseId || !storageVideoId) {
      setResumeLabel("");
      return;
    }

    const savedTimestamp = getVideoResumeTimestamp(courseId, storageVideoId);
    setResumeLabel(savedTimestamp > 0 ? `Resuming from ${savedTimestamp}s` : "");
  }, [courseId, storageVideoId]);

  useEffect(() => {
    if (!containerRef.current || !normalizedVideoId) {
      return;
    }

    let isMounted = true;
    hasSeekedToInitialTime.current = false;
    clearProgressTimer();

    loadYouTubeApi().then((youtubeApi) => {
      if (!isMounted || !containerRef.current) {
        return;
      }

      containerRef.current.innerHTML = "";
      const player = new youtubeApi.Player(containerRef.current, {
        videoId: normalizedVideoId,
        playerVars: {
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0,
          start: Math.max(0, Math.floor(initialTime)),
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;

            if (initialTime > 0 && !hasSeekedToInitialTime.current) {
              try {
                event.target.seekTo(Math.floor(initialTime), true);
              } catch {
                // Ignore seek failures from a player that is still warming up.
              }
              hasSeekedToInitialTime.current = true;
            }
          },
          onStateChange: (event) => {
            if (event.data === youtubeApi.PlayerState.PLAYING) {
              clearProgressTimer();
              progressTimerRef.current = window.setInterval(
                saveCurrentProgress,
                5000
              );
              return;
            }

            if (event.data === youtubeApi.PlayerState.PAUSED) {
              saveCurrentProgress();
              clearProgressTimer();
              return;
            }

            if (event.data === youtubeApi.PlayerState.ENDED) {
              try {
                const duration = event.target.getDuration();
                saveVideoProgress(
                  courseId || "",
                  storageVideoId,
                  duration,
                  duration
                );
                onProgressChange?.();
              } catch {
                // The player may already be torn down if the user switched modules.
              }
              clearProgressTimer();
            }
          },
        },
      });

      playerRef.current = player;
    });

    return () => {
      isMounted = false;
      saveCurrentProgress();
      clearProgressTimer();
      try {
        playerRef.current?.destroy();
      } catch {
        // A destroyed iframe should not break the course page.
      }
      playerRef.current = null;
    };
  }, [normalizedVideoId, initialTime, courseId, videoId, storageVideoId]);

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg">
      <div
        id={playerElementId}
        ref={containerRef}
        title={title}
        className="h-full w-full bg-black"
        data-resume-label={resumeLabel}
      />
    </div>
  );
};

export default Videolayer;
