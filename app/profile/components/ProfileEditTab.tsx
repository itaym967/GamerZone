"use client";

import { AlertCircle, Gamepad2, Save } from "lucide-react";
import type { ProfileFormData } from "../types";
import { AVATARS } from "../types";

interface ProfileEditTabProps {
  avatarSeed: string;
  formData: ProfileFormData;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onSetAvatarSeed: (seed: string) => void;
  onUpdateFormData: (updates: Partial<ProfileFormData>) => void;
}

export default function ProfileEditTab({
  formData,
  avatarSeed,
  isSaving,
  hasUnsavedChanges,
  onUpdateFormData,
  onSetAvatarSeed,
  onSave,
}: ProfileEditTabProps) {
  const usernameError =
    formData.username.length > 0 && formData.username.length < 3;
  const bioLength = formData.bio.length;
  const bioOverLimit = bioLength > 200;

  return (
    <div className="glass-panel space-y-6 rounded-2xl border border-white/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Gamepad2 size={24} />
        </div>
        <h2 className="font-bold text-white text-xl">עריכת פרטים</h2>
        {hasUnsavedChanges && (
          <span className="mr-auto flex items-center gap-1 text-xs text-yellow-400">
            <AlertCircle size={12} />
            שינויים לא נשמרו
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="mb-1 block text-gray-400 text-sm">
            כינוי (Username)
          </label>
          <input
            className={`w-full rounded-xl border bg-black/20 px-4 py-2 text-right text-white outline-none transition-colors ${
              usernameError
                ? "border-red-500/50 focus:border-red-500"
                : "border-white/10 focus:border-primary/50"
            }`}
            maxLength={20}
            onChange={(e) =>
              onUpdateFormData({
                username: e.target.value,
                tag: `@${e.target.value.toLowerCase()}`,
              })
            }
            type="text"
            value={formData.username}
          />
          {usernameError && (
            <p className="mt-1 text-red-400 text-xs">
              שם משתמש חייב להכיל לפחות 3 תווים
            </p>
          )}
        </div>

        {/* Tag (read-only) */}
        <div>
          <label className="mb-1 block text-gray-400 text-sm">
            תיוג (@Tag)
          </label>
          <input
            className="dir-ltr w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right text-gray-400 outline-none"
            dir="ltr"
            readOnly
            type="text"
            value={formData.tag}
          />
        </div>

        {/* Avatar Picker */}
        <div>
          <label className="mb-1 block text-gray-400 text-sm">בחר דמות</label>
          <div className="grid grid-cols-3 gap-2">
            {AVATARS.map((avatar) => (
              <button
                className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                  avatarSeed === avatar.id
                    ? "scale-105 border-primary shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                    : "border-transparent opacity-60 hover:scale-105 hover:opacity-100"
                }`}
                key={avatar.id}
                onClick={() => onSetAvatarSeed(avatar.id)}
              >
                <img
                  alt={avatar.name}
                  className="h-full w-full object-cover"
                  src={avatar.id}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-gray-400 text-sm">על עצמי (Bio)</label>
            <span
              className={`text-xs ${bioOverLimit ? "text-red-400" : "text-gray-500"}`}
            >
              {bioLength}/200
            </span>
          </div>
          <textarea
            className={`w-full resize-none rounded-xl border bg-black/20 px-4 py-2 text-right text-white outline-none transition-colors ${
              bioOverLimit
                ? "border-red-500/50 focus:border-red-500"
                : "border-white/10 focus:border-primary/50"
            }`}
            maxLength={200}
            onChange={(e) => onUpdateFormData({ bio: e.target.value })}
            rows={3}
            value={formData.bio}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-black transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving || usernameError || bioOverLimit}
          onClick={onSave}
        >
          {isSaving ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <Save size={18} />
          )}
          <span>{isSaving ? "שומר..." : "שמור שינויים"}</span>
        </button>
      </div>
    </div>
  );
}
