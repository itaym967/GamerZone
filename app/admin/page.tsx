"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Shield, ShieldAlert, Trash2, Plus, AlertTriangle, Eraser, User, Ban } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface BlockedWord {
    word: string;
    created_at: string;
}

interface AdminLog {
    id: string;
    action: string;
    details: any;
    created_at: string;
    admin_id: string;
}

interface Profile {
    id: string;
    username: string;
    full_name: string;
    role: string;
    is_online: boolean;
}

export default function AdminPage() {
    const router = useRouter();
    const supabase = createClient();

    const [activeTab, setActiveTab] = useState<"blacklist" | "logs" | "users">("blacklist");
    const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    // Form Inputs
    const [newWord, setNewWord] = useState("");

    useEffect(() => {
        checkAdminAccess();
        fetchData();
    }, [activeTab]);

    const checkAdminAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/");
            return;
        }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            toast.error("אין לך הרשאת גישה לדף זה");
            router.push("/");
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'blacklist') {
                const { data, error } = await supabase.from('blocked_words').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                setBlockedWords(data || []);
            } else if (activeTab === 'logs') {
                const { data, error } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(50);
                if (error) {
                    // Ignore RLS error if empty (or handle gracefully)
                    console.error(error);
                }
                setLogs(data || []);
            } else if (activeTab === 'users') {
                const { data, error } = await supabase.from('profiles').select('*').order('username', { ascending: true }).limit(50);
                if (error) throw error;
                setUsers(data || []);
            }
        } catch (error: any) {
            console.error("Error fetching data:", error);
            toast.error("שגיאה בטעינת נתונים");
        } finally {
            setLoading(false);
        }
    };

    const addWord = async (e: React.FormEvent) => {
        e.preventDefault();
        const word = newWord.trim().toLowerCase();
        if (!word) return;

        if (blockedWords.some(w => w.word === word)) {
            toast.error("המילה כבר קיימת ברשימה");
            return;
        }

        try {
            const { error } = await supabase.from('blocked_words').insert([{ word }]);
            if (error) throw error;

            toast.success(`המילה "${word}" נוספה לרשימה`);
            setNewWord("");
            fetchData(); // Refresh

            // Log action
            await supabase.from('admin_logs').insert({ action: 'ADD_WORD', details: { word } });

        } catch (error: any) {
            toast.error("שגיאה בהוספת מילה");
            console.error(error);
        }
    };

    const removeWord = async (word: string) => {
        try {
            const { error } = await supabase.from('blocked_words').delete().eq('word', word);
            if (error) throw error;

            toast.success("המילה הוסרה בהצלחה");
            fetchData(); // Refresh

            // Log action
            await supabase.from('admin_logs').insert({ action: 'REMOVE_WORD', details: { word } });

        } catch (error: any) {
            toast.error("שגיאה במחיקת מילה");
            console.error(error);
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
                <div className="flex gap-4 border-b border-white/10 mb-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("blacklist")}
                        className={`pb-3 px-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'blacklist' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        רשימה שחורה
                        {activeTab === 'blacklist' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-red-500 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`pb-3 px-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'users' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        ניהול משתמשים
                        {activeTab === 'users' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-red-500 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("logs")}
                        className={`pb-3 px-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'logs' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        לוג עבירות
                        {activeTab === 'logs' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-red-500 rounded-t-full" />}
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></span>
                    </div>
                ) : (
                    <>
                        {activeTab === 'blacklist' && (
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
                                                    * מילים אלו יסוננו אוטומטית מהצ'אט.
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
                                        {blockedWords.map((item) => (
                                            <div key={item.word} className="flex items-center justify-between bg-[#1a1a2e] border border-white/5 p-3 rounded-xl group hover:border-red-500/30 transition-all">
                                                <span className="text-white font-medium">{item.word}</span>
                                                <button
                                                    onClick={() => removeWord(item.word)}
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
                        )}

                        {activeTab === 'users' && (
                            <div className="bg-[#0e0e1b] rounded-2xl border border-white/5 overflow-hidden">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="p-4 font-medium">שם משתמש</th>
                                            <th className="p-4 font-medium">שם מלא</th>
                                            <th className="p-4 font-medium">תפקיד</th>
                                            <th className="p-4 font-medium">סטטוס</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-gray-300">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold text-white">{user.username}</td>
                                                <td className="p-4">{user.full_name}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {user.role || 'user'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`w-2 h-2 rounded-full inline-block ml-2 ${user.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                    {user.is_online ? 'מחובר' : 'מנותק'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="bg-[#0e0e1b] rounded-2xl border border-white/5 overflow-hidden">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="p-4 font-medium">זמן</th>
                                            <th className="p-4 font-medium">פעולה</th>
                                            <th className="p-4 font-medium">פרטים</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-gray-300">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-mono text-xs opacity-60">{new Date(log.created_at).toLocaleString('he-IL')}</td>
                                                <td className="p-4 font-bold text-white">{log.action}</td>
                                                <td className="p-4 opacity-80 max-w-[300px] truncate">{JSON.stringify(log.details)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {logs.length === 0 && (
                                    <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                                        <div className="bg-white/5 p-4 rounded-full">
                                            <Shield size={32} />
                                        </div>
                                        <p>אין לוגים להצגה.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
