"use client";

import {
  BarChartIcon,
  GameController02Icon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useState } from "react";
import GamerCard from "../components/GamerCard";
import Navigation from "../components/Navigation";
import AccountTab from "./components/AccountTab";
import GamertagsTab from "./components/GamertagsTab";
import ProfileEditTab from "./components/ProfileEditTab";
import StatsTab from "./components/StatsTab";
import { useProfileData } from "./hooks/useProfileData";
import type { ProfileTab } from "./types";

const TABS: { id: ProfileTab; label: string; icon: IconSvgElement }[] = [
  { id: "edit", label: "עריכת פרופיל", icon: UserIcon },
  { id: "gamertags", label: "Gamertags", icon: GameController02Icon },
  { id: "stats", label: "סטטיסטיקות", icon: BarChartIcon },
  { id: "account", label: "חשבון", icon: Settings01Icon },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("edit");
  const {
    userId,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    formData,
    avatarSeed,
    stats,
    setAvatarSeed,
    updateFormData,
    handleSave,
    addGamertag,
    removeGamertag,
    userEmail,
  } = useProfileData();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="text-fluid-sm text-gray-400">טוען פרופיל...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-foreground pb-24 transition-all md:pr-64 md:pb-0">
      <Navigation />

      <main className="fluid-container stack-fluid p-fluid-lg">
        <header className="mb-6">
          <h1 className="mb-2 font-bold text-fluid-2xl text-white">
            הפרופיל שלי
          </h1>
          <p className="text-fluid-base text-gray-400">
            ככה אחרים רואים אותך ב-GamerZone
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-white/5 p-1">
          {TABS.map((tab) => (
            <button
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 font-medium text-fluid-sm transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-black"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <HugeiconsIcon icon={tab.icon} size={16} />
              <span>{tab.label}</span>
              {tab.id === "edit" && hasUnsavedChanges && (
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
              )}
            </button>
          ))}
        </div>

        <div className="auto-grid items-start">
          {/* Active Tab Content */}
          <div>
            {activeTab === "edit" && (
              <ProfileEditTab
                avatarSeed={avatarSeed}
                formData={formData}
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                onSave={handleSave}
                onSetAvatarSeed={setAvatarSeed}
                onUpdateFormData={updateFormData}
              />
            )}
            {activeTab === "gamertags" && (
              <GamertagsTab
                formData={formData}
                onAddGamertag={addGamertag}
                onRemoveGamertag={removeGamertag}
                onUpdateFormData={updateFormData}
              />
            )}
            {activeTab === "stats" && <StatsTab stats={stats} />}
            {activeTab === "account" && <AccountTab userEmail={userEmail} />}
          </div>

          {/* Live Preview */}
          <div className="space-y-4">
            <div className="mb-2 flex items-center justify-center gap-2 lg:justify-start">
              <span className="font-medium text-fluid-sm text-gray-400 uppercase tracking-wider">
                תצוגה מקדימה
              </span>
              <span className="h-px w-full flex-1 bg-white/10" />
            </div>

            <div className="sticky top-10 max-w-md lg:mx-0">
              <GamerCard
                avatarSeed={avatarSeed}
                bio={formData.bio}
                currentUserId={userId}
                games={formData.games}
                hiddenTags={formData.hiddenTags}
                id="preview"
                online={true}
                tag={formData.tag}
                username={formData.username}
              />
              <div className="mt-4 text-center">
                <p className="text-fluid-xs text-gray-500">
                  * ככה הכרטיס שלך נראה למשתמשים אחרים לפני ואחרי החלפה
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
