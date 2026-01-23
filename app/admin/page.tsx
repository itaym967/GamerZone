"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Shield, ShieldAlert, Trash2, Plus, AlertTriangle, Eraser } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<"blacklist" | "logs">("blacklist");
    const [blockedWords, setBlockedWords] = useState<string[]>([]);
    const [newWord, setNewWord] = useState("");
    const [logs, setLogs] = useState<{ id: number, sender: string, content: string, time: string, caughtWord: string }[]>([]);

    useEffect(() => {
        const savedWords = localStorage.getItem("gamerzone_blocked_words");
        if (savedWords) setBlockedWords(JSON.parse(savedWords));
        else {
            const defaults = ["noob", "trash", "idiot", "loser"];
            setBlockedWords(defaults);
            localStorage.setItem("gamerzone_blocked_words", JSON.stringify(defaults));
        }

        const savedLogs = localStorage.getItem("gamerzone_flagged_logs");
        if (savedLogs) setLogs(JSON.parse(savedLogs));
    }, []);

    const addWord = (e: React.FormEvent) => {
        e.preventDefault();
        const word = newWord.trim().toLowerCase();
        if (!word) return;

        if (blockedWords.includes(word)) {
            toast.error("המילה כבר קיימת ברשימה");
            return;
        }

        const updated = [...blockedWords, word];
        setBlockedWords(updated);
        localStorage.setItem("gamerzone_blocked_words", JSON.stringify(updated));
        setNewWord("");
        toast.success(`המילה "${word}" נוספה לרשימה החסומה`);
    };

    const removeWord = (word: string) => {
        const updated = blockedWords.filter(w => w !== word);
        setBlockedWords(updated);
        localStorage.setItem("gamerzone_blocked_words", JSON.stringify(updated));
        toast.success("המילה הוסרה בהצלחה");
    };

    const clearLogs = () => {
        if (confirm("האם למחוק את כל היסטוריית החסימות?")) {
            setLogs([]);
            localStorage.removeItem("gamerzone_flagged_logs");
            toast.success("הלוגים נוקו בהצלחה");
        }
    };

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 transition-all bg-[#050510]">
            <Navigation />

            <main className="p-6 max-w-7xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <ShieldAlert className="text-red-500" size={32} />
                            <span>ניהול ומודרציה</span>
                        </h1>
                        <p className="text-gray-400">מערכת הגנה על השיחות ב-GamerZone</p>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-white/10 mb-8">
                    <button
                        onClick={() => setActiveTab("blacklist")}
                        className={`pb-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'blacklist' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        רשימה שחורה
                        {activeTab === 'blacklist' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-red-500 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("logs")}
                        className={`pb-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'logs' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        לוג עבירות
                        {logs.length > 0 && <span className="mr-2 bg-red-500/20 text-red-500 text-[10px] px-1.5 py-0.5 rounded-full">{logs.length}</span>}
                        {activeTab === 'logs' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-red-500 rounded-t-full" />}
                    </button>
                </div>

                {activeTab === 'blacklist' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add New Word */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#0e0e1b] p-6 rounded-2xl border border-white/5 sticky top-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Plus size={18} className="text-red-500" />
                                    הוספת מילה חוסמת
                                </h3>
                                <form onSubmit={addWord} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">המילה לחסימה</label>
                                        <input
                                            type="text"
                                            value={newWord}
                                            onChange={(e) => setNewWord(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-red-500/50 text-right"
                                            placeholder="למשל: noob"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            * מילים אלו יסוננו אוטומטית מהצ'אט ויוחלפו בכוכביות (****).
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newWord.trim()}
                                        className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        הוסף לרשימה
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {blockedWords.map((word) => (
                                    <div key={word} className="flex items-center justify-between bg-[#1a1a2e] border border-white/5 p-3 rounded-xl group hover:border-red-500/30 transition-all">
                                        <span className="text-white font-medium">{word}</span>
                                        <button
                                            onClick={() => removeWord(word)}
                                            className="p-1.5 hover:bg-red-500/20 text-gray-500 group-hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {blockedWords.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-gray-500">
                                        אין מילים חסומות כרגע.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Logs Tab */
                    <div className="space-y-4">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={clearLogs}
                                disabled={logs.length === 0}
                                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                            >
                                <Eraser size={16} />
                                נקה לוגים
                            </button>
                        </div>

                        <div className="bg-[#0e0e1b] rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="p-4 font-medium">זמן</th>
                                        <th className="p-4 font-medium">משתמש</th>
                                        <th className="p-4 font-medium">מילה שנתפסה</th>
                                        <th className="p-4 font-medium">תוכן ההודעה המלא</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-gray-300">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono text-xs opacity-60">{log.time}</td>
                                            <td className="p-4 font-bold text-white max-w-[150px] truncate" title={log.sender}>{log.sender}</td>
                                            <td className="p-4">
                                                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold">{log.caughtWord}</span>
                                            </td>
                                            <td className="p-4 opacity-80 max-w-[300px] truncate" title={log.content}>{log.content}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {logs.length === 0 && (
                                <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                                    <div className="bg-white/5 p-4 rounded-full">
                                        <Shield size={32} />
                                    </div>
                                    <p>הכל נקי! לא נתפסו הודעות פוגעניות לאחרונה.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
