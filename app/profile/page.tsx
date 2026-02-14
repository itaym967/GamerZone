"use client";

import { useState } from "react";
import { User, Gamepad2, BarChart3, Settings } from "lucide-react";
import GamerCard from "../components/GamerCard";
import Navigation from "../components/Navigation";
import ProfileEditTab from "./components/ProfileEditTab";
import GamertagsTab from "./components/GamertagsTab";
import StatsTab from "./components/StatsTab";
import AccountTab from "./components/AccountTab";
import { useProfileData } from "./hooks/useProfileData";
import type { ProfileTab } from "./types";

const TABS: { id: ProfileTab; label: string; icon: typeof User }[] = [
    { id: "edit", label: "עריכת פרופיל", icon: User },
    { id: "gamertags", label: "Gamertags", icon: Gamepad2 },
    { id: "stats", label: "סטטיסטיקות", icon: BarChart3 },
    { id: "account", label: "חשבון", icon: Settings },
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
        userEmail
    } = useProfileData();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050510] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">טוען פרופיל...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 transition-all bg-[#050510]">
            <Navigation />

            <main className="p-6 max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">הפרופיל שלי</h1>
                    <p className="text-gray-400">ככה אחרים רואים אותך ב-GamerZone</p>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "bg-primary text-black"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                            {tab.id === "edit" && hasUnsavedChanges && (
                                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                    {/* Active Tab Content */}
                    <div>
                        {activeTab === "edit" && (
                            <ProfileEditTab
                                formData={formData}
                                avatarSeed={avatarSeed}
                                isSaving={isSaving}
                                hasUnsavedChanges={hasUnsavedChanges}
                                onUpdateFormData={updateFormData}
                                onSetAvatarSeed={setAvatarSeed}
                                onSave={handleSave}
                            />
                        )}
                        {activeTab === "gamertags" && (
                            <GamertagsTab
                                formData={formData}
                                onUpdateFormData={updateFormData}
                                onAddGamertag={addGamertag}
                                onRemoveGamertag={removeGamertag}
                            />
                        )}
                        {activeTab === "stats" && (
                            <StatsTab stats={stats} />
                        )}
                        {activeTab === "account" && (
                            <AccountTab userEmail={userEmail} />
                        )}
                    </div>

                    {/* Live Preview */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">תצוגה מקדימה</span>
                            <span className="w-full h-px bg-white/10 flex-1"></span>
                        </div>

                        <div className="max-w-md mx-auto lg:mx-0 sticky top-10">
                            <GamerCard
                                id="preview"
                                username={formData.username}
                                tag={formData.tag}
                                games={formData.games}
                                bio={formData.bio}
                                online={true}
                                hiddenTags={formData.hiddenTags}
                                avatarSeed={avatarSeed}
                                currentUserId={userId}
                            />
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500">
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
