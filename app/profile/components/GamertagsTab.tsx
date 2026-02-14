"use client";

import { useState } from "react";
import { Gamepad2, Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { PLATFORMS } from "../types";
import type { ProfileFormData } from "../types";

interface GamertagsTabProps {
    formData: ProfileFormData;
    onUpdateFormData: (updates: Partial<ProfileFormData>) => void;
    onAddGamertag: (platform: string, tag: string) => void;
    onRemoveGamertag: (platform: string) => void;
}

export default function GamertagsTab({
    formData,
    onUpdateFormData,
    onAddGamertag,
    onRemoveGamertag
}: GamertagsTabProps) {
    const [newPlatform, setNewPlatform] = useState(PLATFORMS[0]);
    const [newTag, setNewTag] = useState("");
    const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const availablePlatforms = PLATFORMS.filter(p => !formData.games.includes(p));

    const handleAdd = () => {
        if (!newTag.trim()) return;
        onAddGamertag(newPlatform, newTag.trim());
        setNewTag("");
        if (availablePlatforms.length > 1) {
            const nextPlatform = availablePlatforms.find(p => p !== newPlatform);
            if (nextPlatform) setNewPlatform(nextPlatform);
        }
    };

    const handleStartEdit = (platform: string) => {
        setEditingPlatform(platform);
        setEditValue(formData.hiddenTags[platform] || "");
    };

    const handleSaveEdit = (platform: string) => {
        if (!editValue.trim()) return;
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
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-secondary/10 p-2 rounded-lg text-secondary">
                    <Gamepad2 size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Gamertags</h2>
                <span className="mr-auto text-xs text-gray-500">
                    {formData.games.length} משחקים
                </span>
            </div>

            {/* Add New Gamertag */}
            {availablePlatforms.length > 0 && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-3">הוסף משחק חדש</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={!newTag.trim()}
                            className="bg-primary hover:bg-primary/80 text-black p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={18} />
                        </button>
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="הכנס את ה-Gamertag שלך..."
                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-primary/50 text-left dir-ltr font-mono"
                            dir="ltr"
                        />
                        <select
                            value={newPlatform}
                            onChange={(e) => setNewPlatform(e.target.value)}
                            className="min-w-[120px] bg-black/20 border border-white/10 rounded-xl px-2 text-white text-sm outline-none focus:border-primary/50 text-right appearance-none"
                        >
                            {availablePlatforms.map(p => (
                                <option key={p} value={p} className="bg-[#0e0e1b]">{p}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Existing Gamertags */}
            <div className="space-y-2">
                {formData.games.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Gamepad2 size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">עדיין לא הוספת משחקים</p>
                        <p className="text-xs text-gray-600 mt-1">הוסף את ה-Gamertags שלך כדי שאחרים יוכלו למצוא אותך</p>
                    </div>
                ) : (
                    formData.games.map((platform) => (
                        <div
                            key={platform}
                            className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
                        >
                            {/* Platform Name */}
                            <span className="text-sm font-bold text-primary min-w-[100px] text-right">
                                {platform}
                            </span>

                            {/* Tag Value */}
                            {editingPlatform === platform ? (
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(platform);
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        className="flex-1 bg-black/30 border border-primary/30 rounded-lg px-3 py-1 text-white text-sm outline-none font-mono text-left"
                                        dir="ltr"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleSaveEdit(platform)}
                                        className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span dir="ltr" className="flex-1 text-sm text-white font-mono text-left">
                                        {formData.hiddenTags[platform]}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleStartEdit(platform)}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            title="ערוך"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(platform)}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                confirmDelete === platform
                                                    ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                                                    : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                                            }`}
                                            title={confirmDelete === platform ? 'לחץ שוב לאישור' : 'מחק'}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {availablePlatforms.length === 0 && formData.games.length > 0 && (
                <p className="text-xs text-gray-500 text-center">הוספת את כל המשחקים הזמינים 🎮</p>
            )}
        </div>
    );
}
