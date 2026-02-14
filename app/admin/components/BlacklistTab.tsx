"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, Brain, Loader2, Sparkles, Search } from "lucide-react";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import type { BlockedWord, AIAnalysisResult } from "../types";

interface BlacklistTabProps {
  supabase: SupabaseClient;
  currentUser: string | null;
}

export default function BlacklistTab({ supabase, currentUser }: BlacklistTabProps) {
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blocked_words")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBlockedWords(data || []);
    } catch (error) {
      console.error("Error fetching blocked words:", error);
      toast.error("שגיאה בטעינת מילים חסומות");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const addWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = newWord.trim().toLowerCase();
    if (!word) return;

    if (blockedWords.some((w) => w.word === word)) {
      toast.error("המילה כבר קיימת ברשימה");
      return;
    }

    try {
      const { error } = await supabase.from("blocked_words").insert([{ word }]);
      if (error) throw error;
      toast.success(`המילה "${word}" נוספה לרשימה`);
      setNewWord("");
      fetchWords();
      await supabase.from("admin_logs").insert({ action: "ADD_WORD", details: { word }, admin_id: currentUser });
    } catch (error) {
      toast.error("שגיאה בהוספת מילה");
      console.error(error);
    }
  };

  const removeWord = async (word: string) => {
    try {
      const { error } = await supabase.from("blocked_words").delete().eq("word", word);
      if (error) throw error;
      toast.success("המילה הוסרה בהצלחה");
      fetchWords();
      await supabase.from("admin_logs").insert({ action: "REMOVE_WORD", details: { word }, admin_id: currentUser });
    } catch (error) {
      toast.error("שגיאה במחיקת מילה");
      console.error(error);
    }
  };

  const analyzeWithAI = async () => {
    if (blockedWords.length === 0) {
      toast.error("אין מילים לניתוח. הוסף מילים לרשימה השחורה תחילה.");
      return;
    }
    setIsAnalyzing(true);
    setShowAnalysis(true);
    try {
      const response = await fetch("/api/deepseek/analyze-toxicity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedWords: blockedWords.map((w) => w.word) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "שגיאה בניתוח הרעלנות");
      setAnalysisResult(data);
      toast.success("הניתוח הושלם בהצלחה!");
      await supabase.from("admin_logs").insert({
        action: "AI_TOXICITY_ANALYSIS",
        details: { wordCount: blockedWords.length, suggestionsCount: data.suggestions.length },
        admin_id: currentUser,
      });
    } catch (error: any) {
      console.error("AI analysis error:", error);
      toast.error(error.message || "שגיאה בניתוח AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addSuggestedWord = async (word: string) => {
    if (blockedWords.some((w) => w.word === word)) {
      toast.info("המילה כבר קיימת ברשימה");
      return;
    }
    try {
      const { error } = await supabase.from("blocked_words").insert([{ word }]);
      if (error) throw error;
      toast.success(`המילה "${word}" נוספה לרשימה`);
      fetchWords();
      await supabase.from("admin_logs").insert({ action: "ADD_WORD_FROM_AI", details: { word }, admin_id: currentUser });
    } catch (error) {
      toast.error("שגיאה בהוספת מילה");
      console.error(error);
    }
  };

  const filteredWords = searchQuery
    ? blockedWords.filter((w) => w.word.includes(searchQuery.toLowerCase()))
    : blockedWords;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="text-purple-400" size={28} />
            <div>
              <h3 className="text-lg font-bold text-white">ניתוח רעלנות עם AI</h3>
              <p className="text-sm text-gray-400">קבל המלצות חכמות לשיפור הרשימה השחורה</p>
            </div>
          </div>
          <button
            onClick={analyzeWithAI}
            disabled={isAnalyzing || blockedWords.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>מנתח...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>נתח עם AI</span>
              </>
            )}
          </button>
        </div>

        {showAnalysis && analysisResult && (
          <div className="mt-6 space-y-4">
            <div className="bg-black/30 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold text-purple-400 mb-2">ניתוח:</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{analysisResult.analysis}</p>
            </div>
            {analysisResult.suggestions.length > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-400 mb-3">המלצות למילים נוספות:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {analysisResult.suggestions.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => addSuggestedWord(word)}
                      className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 p-2 rounded-lg transition-all group"
                    >
                      <span className="text-sm text-white">{word}</span>
                      <Plus size={14} className="text-gray-500 group-hover:text-blue-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
                <p className="text-xs text-gray-500 mt-2">* מילים אלו יסוננו אוטומטית מהצ'אט.</p>
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

        {/* Word List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש מילה..."
              className="w-full bg-[#0e0e1b] border border-white/5 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm outline-none focus:border-red-500/30 text-right"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredWords.map((item) => (
              <div
                key={item.word}
                className="flex items-center justify-between bg-[#1a1a2e] border border-white/5 p-3 rounded-xl group hover:border-red-500/30 transition-all"
              >
                <span className="text-white font-medium">{item.word}</span>
                <button
                  onClick={() => removeWord(item.word)}
                  className="p-1.5 hover:bg-red-500/20 text-gray-500 group-hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {filteredWords.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                {searchQuery ? "לא נמצאו תוצאות" : "אין מילים חסומות כרגע."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
