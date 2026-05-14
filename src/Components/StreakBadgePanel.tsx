import { Award, Flame, Medal, Trophy } from "lucide-react";
import React from "react";
import {
  LearningStreakState,
  streakMilestones,
} from "@/utils/streakTracking";

type StreakBadgePanelProps = {
  streak: LearningStreakState;
};

const StreakBadgePanel = ({ streak }: StreakBadgePanelProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Daily Learning Streak</h2>
          <p className="mt-1 text-sm text-gray-600">
            Streak updates after your first course activity each day.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
          <Flame className="h-6 w-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-gray-200 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-600">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {streak.currentStreak}
          </p>
          <p className="text-sm text-gray-500">days</p>
        </div>

        <div className="rounded-md border border-gray-200 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-600">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Longest Streak</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {streak.longestStreak}
          </p>
          <p className="text-sm text-gray-500">days</p>
        </div>

        <div className="rounded-md border border-gray-200 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-600">
            <Award className="h-4 w-4 text-[#0056D2]" />
            <span className="text-sm font-medium">Last Activity</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {streak.lastActivityDate || "No activity yet"}
          </p>
          <p className="text-sm text-gray-500">local date</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-semibold text-gray-900">Earned Badges</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {streakMilestones.map((milestone) => {
            const isEarned = streak.earnedBadges.includes(milestone.label);

            return (
              <div
                key={milestone.label}
                className={`flex items-center gap-3 rounded-md border p-3 ${
                  isEarned
                    ? "border-[#0056D2] bg-blue-50 text-[#0056D2]"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                <Medal
                  className={`h-5 w-5 ${
                    isEarned ? "text-[#0056D2]" : "text-gray-400"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold">{milestone.label}</p>
                  <p className="text-xs">
                    {isEarned ? "Earned" : `${milestone.days} active days`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StreakBadgePanel;
