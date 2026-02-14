"use client";

import { Gamepad2, Save, AlertCircle } from "lucide-react";
import { AVATARS } from "../types";
import type { ProfileFormData } from "../types";

interface ProfileEditTabProps {
    formData: ProfileFormData;
    avatarSeed: string;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    onUpdateFormData: (updates: Partial<ProfileFormData>) => void;
    onSetAvatarSeed: (seed: string) => void;
    onSave: () => void;
}

export default function ProfileEditTab({
    formData,
    avatarSeed,
    isSaving,
    hasUnsavedChanges,
    onUpdateFormData,
    onSetAvatarSeed,
    onSave
}: ProfileEditTabProps) {
    const usernameError = formData.username.length > 0 && formData.username.length < 3;
    const bioLength = formData.bio.length;
    const bioOverLimit = bioLength > 200;

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <Gamepad2 size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">עריכת פרטים</h2>
                {hasUnsavedChanges && (
                    <span className="mr-auto text-xs text-yellow-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        שינויים לא נשמרו
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {/* Username */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1">כינוי (Username)</label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => onUpdateFormData({
                            username: e.target.value,
                            tag: "@" + e.target.value.toLowerCase()
                        })}
                        className={`w-full bg-black/20 border rounded-xl px-4 py-2 text-white outline-none text-right transition-colors ${
                            usernameError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary/50'
                        }`}
                        maxLength={20}
                    />
                    {usernameError && (
                        <p className="text-xs text-red-400 mt-1">שם משתמש חייב להכיל לפחות 3 תווים</p>
                    )}
                </div>

                {/* Tag (read-only) */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1">תיוג (@Tag)</label>
                    <input
                        type="text"
                        value={formData.tag}
                        readOnly
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-gray-400 cursor-not-allowed outline-none text-right dir-ltr"
                        dir="ltr"
                    />
                </div>

                {/* Avatar Picker */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1">בחר דמות</label>
                    <div className="grid grid-cols-3 gap-2">
                        {AVATARS.map((avatar) => (
                            <button
                                key={avatar.id}
                                onClick={() => onSetAvatarSeed(avatar.id)}
                                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                    avatarSeed === avatar.id
                                        ? 'border-primary shadow-[0_0_15px_rgba(0,255,157,0.3)] scale-105'
                                        : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                                }`}
                            >
                                <img src={avatar.id} alt={avatar.name} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm text-gray-400">על עצמי (Bio)</label>
                        <span className={`text-xs ${bioOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
                            {bioLength}/200
                        </span>
                    </div>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => onUpdateFormData({ bio: e.target.value })}
                        rows={3}
                        maxLength={200}
                        className={`w-full bg-black/20 border rounded-xl px-4 py-2 text-white outline-none text-right resize-none transition-colors ${
                            bioOverLimit ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary/50'
                        }`}
                    />
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
                <button
                    onClick={onSave}
                    disabled={isSaving || usernameError || bioOverLimit}
                    className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    <span>{isSaving ? 'שומר...' : 'שמור שינויים'}</span>
                </button>
            </div>
        </div>
    );
}
