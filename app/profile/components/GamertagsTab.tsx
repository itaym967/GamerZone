"use client";
import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  GameController02Icon,
  PencilEdit01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import type { ProfileFormData } from "../types";
import { PLATFORMS } from "../types";

interface GamertagsTabProps {
  formData: ProfileFormData;
  onAddGamertag: (platform: string, tag: string) => void;
  onRemoveGamertag: (platform: string) => void;
  onUpdateFormData: (updates: Partial<ProfileFormData>) => void;
}

export default function GamertagsTab({
  formData,
  onUpdateFormData,
  onAddGamertag,
  onRemoveGamertag,
}: GamertagsTabProps) {
  const [newPlatform, setNewPlatform] = useState(PLATFORMS[0]);
  const [newTag, setNewTag] = useState("");
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const availablePlatforms = PLATFORMS.filter(
    (p) => !formData.games.includes(p)
  );

  const handleAdd = () => {
    if (!newTag.trim()) {
      return;
    }
    onAddGamertag(newPlatform, newTag.trim());
    setNewTag("");
    if (availablePlatforms.length > 1) {
      const nextPlatform = availablePlatforms.find((p) => p !== newPlatform);
      if (nextPlatform) {
        setNewPlatform(nextPlatform);
      }
    }
  };

  const handleStartEdit = (platform: string) => {
    setEditingPlatform(platform);
    setEditValue(formData.hiddenTags[platform] || "");
  };

  const handleSaveEdit = (platform: string) => {
    if (!editValue.trim()) {
      return;
    }
    const newTags = { ...formData.hiddenTags, [platform]: editValue.trim() };
    onUpdateFormData({ hiddenTags: newTags });
    setEditingPlatform(null);
  };

  const handleCancelEdit = () => {
    setEditingPlatform(null);
    setEditValue("");
  };

  const handleDelete = (platform: string) => {
    if (confirmDelete === platform) {
      onRemoveGamertag(platform);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(platform);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="glass-panel space-y-6 rounded-2xl border border-white/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-secondary/10 p-2 text-secondary">
          <HugeiconsIcon icon={GameController02Icon} size={24} />
        </div>
        <h2 className="font-bold text-white text-xl">Gamertags</h2>
        <span className="mr-auto text-gray-500 text-xs">
          {formData.games.length} משחקים
        </span>
      </div>

      {/* Add New Gamertag */}
      {availablePlatforms.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <h3 className="mb-3 font-bold text-sm text-white">הוסף משחק חדש</h3>
          <div className="flex gap-2">
            <button
              className="rounded-xl bg-primary p-2.5 text-black transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!newTag.trim()}
              onClick={handleAdd}
            >
              <HugeiconsIcon icon={Add01Icon} size={18} />
            </button>
            <input
              className="dir-ltr flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left font-mono text-sm text-white outline-hidden focus:border-primary/50"
              dir="ltr"
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="הכנס את ה-Gamertag שלך..."
              type="text"
              value={newTag}
            />
            <select
              className="min-w-[120px] appearance-none rounded-xl border border-white/10 bg-black/20 px-2 text-right text-sm text-white outline-hidden focus:border-primary/50"
              onChange={(e) => setNewPlatform(e.target.value)}
              value={newPlatform}
            >
              {availablePlatforms.map((p) => (
                <option className="bg-card" key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Existing Gamertags */}
      <div className="space-y-2">
        {formData.games.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <HugeiconsIcon
              className="mx-auto mb-2 opacity-50"
              icon={GameController02Icon}
              size={32}
            />
            <p className="text-sm">עדיין לא הוספת משחקים</p>
            <p className="mt-1 text-gray-600 text-xs">
              הוסף את ה-Gamertags שלך כדי שאחרים יוכלו למצוא אותך
            </p>
          </div>
        ) : (
          formData.games.map((platform) => (
            <div
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-3 transition-colors hover:border-white/10"
              key={platform}
            >
              {/* Platform Name */}
              <span className="min-w-[100px] text-right font-bold text-primary text-sm">
                {platform}
              </span>

              {/* Tag Value */}
              {editingPlatform === platform ? (
                <div className="flex flex-1 gap-2">
                  <input
                    autoFocus
                    className="flex-1 rounded-lg border border-primary/30 bg-black/30 px-3 py-1 text-left font-mono text-sm text-white outline-hidden"
                    dir="ltr"
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveEdit(platform);
                      }
                      if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                    type="text"
                    value={editValue}
                  />
                  <button
                    className="rounded-lg bg-green-500/20 p-1.5 text-green-400 transition-colors hover:bg-green-500/30"
                    onClick={() => handleSaveEdit(platform)}
                  >
                    <HugeiconsIcon icon={Tick01Icon} size={14} />
                  </button>
                  <button
                    className="rounded-lg bg-red-500/20 p-1.5 text-red-400 transition-colors hover:bg-red-500/30"
                    onClick={handleCancelEdit}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="flex-1 text-left font-mono text-sm text-white"
                    dir="ltr"
                  >
                    {formData.hiddenTags[platform]}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                      onClick={() => handleStartEdit(platform)}
                      title="ערוך"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                    </button>
                    <button
                      className={`rounded-lg p-1.5 transition-colors ${
                        confirmDelete === platform
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                      }`}
                      onClick={() => handleDelete(platform)}
                      title={
                        confirmDelete === platform ? "לחץ שוב לאישור" : "מחק"
                      }
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {availablePlatforms.length === 0 && formData.games.length > 0 && (
        <p className="text-center text-gray-500 text-xs">
          הוספת את כל המשחקים הזמינים 🎮
        </p>
      )}
    </div>
  );
}
