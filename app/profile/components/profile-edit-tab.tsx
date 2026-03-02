"use client";
import {
  AlertCircleIcon,
  FloppyDiskIcon,
  GameController02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import OptimizedAvatar from "@/app/components/optimized-avatar";
import type { AvailabilitySlot } from "@/lib/availability";
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

const AVAILABILITY_SLOTS: Array<{ id: AvailabilitySlot; label: string }> = [
  { id: "morning", label: "בוקר" },
  { id: "afternoon", label: "צהריים" },
  { id: "evening", label: "ערב" },
  { id: "late-night", label: "לילה" },
];

const TIMEZONE_OPTIONS = [
  { label: "Israel (Asia/Jerusalem)", value: "Asia/Jerusalem" },
  { label: "UTC", value: "UTC" },
  { label: "Europe/Berlin", value: "Europe/Berlin" },
  { label: "America/New_York", value: "America/New_York" },
];

export default function ProfileEditTab({
  formData,
  avatarSeed,
  isSaving,
  hasUnsavedChanges,
  onUpdateFormData,
  onSetAvatarSeed,
  onSave,
}: ProfileEditTabProps) {
  const USERNAME_INPUT_ID = "profile-username";
  const TAG_INPUT_ID = "profile-tag";
  const BIO_INPUT_ID = "profile-bio";
  const TIMEZONE_INPUT_ID = "profile-timezone";
  const usernameError =
    formData.username.length > 0 && formData.username.length < 3;
  const bioLength = formData.bio.length;
  const bioOverLimit = bioLength > 200;

  const toggleAvailabilitySlot = (slotId: AvailabilitySlot) => {
    const hasSlot = formData.availability.slots.includes(slotId);
    const nextSlots = hasSlot
      ? formData.availability.slots.filter((slot) => slot !== slotId)
      : [...formData.availability.slots, slotId];
    onUpdateFormData({
      availability: {
        ...formData.availability,
        slots: nextSlots,
      },
    });
  };

  return (
    <div className="glass-panel space-y-6 rounded-2xl border border-white/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <HugeiconsIcon icon={GameController02Icon} size={24} />
        </div>
        <h2 className="font-bold text-fluid-lg text-white">עריכת פרטים</h2>
        {hasUnsavedChanges && (
          <span className="mr-auto flex items-center gap-1 text-fluid-xs text-yellow-400">
            <HugeiconsIcon icon={AlertCircleIcon} size={12} />
            שינויים לא נשמרו
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div>
          <label
            className="mb-1 block text-fluid-sm text-gray-400"
            htmlFor={USERNAME_INPUT_ID}
          >
            כינוי (Username)
          </label>
          <input
            className={`w-full rounded-xl border bg-black/20 px-4 py-2 text-right text-white outline-hidden transition-colors ${
              usernameError
                ? "border-red-500/50 focus:border-red-500"
                : "border-white/10 focus:border-primary/50"
            }`}
            id={USERNAME_INPUT_ID}
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
            <p className="mt-1 text-fluid-xs text-red-400">
              שם משתמש חייב להכיל לפחות 3 תווים
            </p>
          )}
        </div>

        {/* Tag (read-only) */}
        <div>
          <label
            className="mb-1 block text-fluid-sm text-gray-400"
            htmlFor={TAG_INPUT_ID}
          >
            תיוג (@Tag)
          </label>
          <input
            className="dir-ltr w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right text-gray-400 outline-hidden"
            dir="ltr"
            id={TAG_INPUT_ID}
            readOnly
            type="text"
            value={formData.tag}
          />
        </div>

        {/* Avatar Picker */}
        <div>
          <p className="mb-1 block text-fluid-sm text-gray-400">בחר דמות</p>
          <div className="grid grid-cols-3 gap-2">
            {AVATARS.map((avatar) => (
              <button
                className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                  avatarSeed === avatar.id
                    ? "scale-105 border-primary shadow-[0_0_0.9375rem_rgba(0,255,157,0.3)]"
                    : "border-transparent opacity-60 hover:scale-105 hover:opacity-100"
                }`}
                key={avatar.id}
                onClick={() => onSetAvatarSeed(avatar.id)}
                type="button"
              >
                <OptimizedAvatar
                  alt={avatar.name}
                  className="h-full w-full object-cover"
                  seed={avatar.id}
                  size={96}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              className="block text-fluid-sm text-gray-400"
              htmlFor={BIO_INPUT_ID}
            >
              על עצמי (Bio)
            </label>
            <span
              className={`text-fluid-xs ${bioOverLimit ? "text-red-400" : "text-gray-500"}`}
            >
              {bioLength}/200
            </span>
          </div>
          <textarea
            className={`w-full resize-none rounded-xl border bg-black/20 px-4 py-2 text-right text-white outline-hidden transition-colors ${
              bioOverLimit
                ? "border-red-500/50 focus:border-red-500"
                : "border-white/10 focus:border-primary/50"
            }`}
            id={BIO_INPUT_ID}
            maxLength={200}
            onChange={(e) => onUpdateFormData({ bio: e.target.value })}
            rows={3}
            value={formData.bio}
          />
        </div>

        {/* Availability */}
        <div>
          <p className="mb-1 block text-fluid-sm text-gray-400">
            זמינות למשחקים
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {AVAILABILITY_SLOTS.map((slot) => {
              const isSelected = formData.availability.slots.includes(slot.id);
              return (
                <button
                  className={`rounded-xl border px-3 py-2 font-medium text-fluid-sm transition-all ${
                    isSelected
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-white/10 bg-black/20 text-gray-300 hover:border-primary/40"
                  }`}
                  key={slot.id}
                  onClick={() => toggleAvailabilitySlot(slot.id)}
                  type="button"
                >
                  {slot.label}
                </button>
              );
            })}
          </div>

          <label
            className="mb-1 block text-fluid-sm text-gray-400"
            htmlFor={TIMEZONE_INPUT_ID}
          >
            אזור זמן
          </label>
          <select
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right text-white outline-hidden transition-colors focus:border-primary/50"
            id={TIMEZONE_INPUT_ID}
            onChange={(e) =>
              onUpdateFormData({
                availability: {
                  ...formData.availability,
                  timezone: e.target.value,
                },
              })
            }
            value={formData.availability.timezone}
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option
                className="bg-card text-white"
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-black transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving || usernameError || bioOverLimit}
          onClick={onSave}
          type="button"
        >
          {isSaving ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <HugeiconsIcon icon={FloppyDiskIcon} size={18} />
          )}
          <span>{isSaving ? "שומר..." : "שמור שינויים"}</span>
        </button>
      </div>
    </div>
  );
}
