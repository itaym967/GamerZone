"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Brain, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AIAnalysisResult, BlockedWord } from "../types";

interface BlacklistTabProps {
  currentUser: string | null;
  supabase: SupabaseClient;
}

export default function BlacklistTab({
  supabase,
  currentUser,
}: BlacklistTabProps) {
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(
    null
  );
  const [showAnalysis, setShowAnalysis] = useState(false);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blocked_words")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        throw error;
      }
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
    if (!word) {
      return;
    }

    if (blockedWords.some((w) => w.word === word)) {
      toast.error("המילה כבר קיימת ברשימה");
      return;
    }

    try {
      const { error } = await supabase.from("blocked_words").insert([{ word }]);
      if (error) {
        throw error;
      }
      toast.success(`המילה "${word}" נוספה לרשימה`);
      setNewWord("");
      fetchWords();
      await supabase.from("admin_logs").insert({
        action: "ADD_WORD",
        details: { word },
        admin_id: currentUser,
      });
    } catch (error) {
      toast.error("שגיאה בהוספת מילה");
      console.error(error);
    }
  };

  const removeWord = async (word: string) => {
    try {
      const { error } = await supabase
        .from("blocked_words")
        .delete()
        .eq("word", word);
      if (error) {
        throw error;
      }
      toast.success("המילה הוסרה בהצלחה");
      fetchWords();
      await supabase.from("admin_logs").insert({
        action: "REMOVE_WORD",
        details: { word },
        admin_id: currentUser,
      });
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
      if (!response.ok) {
        throw new Error(data.error || "שגיאה בניתוח הרעלנות");
      }
      setAnalysisResult(data);
      toast.success("הניתוח הושלם בהצלחה!");
      await supabase.from("admin_logs").insert({
        action: "AI_TOXICITY_ANALYSIS",
        details: {
          wordCount: blockedWords.length,
          suggestionsCount: data.suggestions.length,
        },
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
      if (error) {
        throw error;
      }
      toast.success(`המילה "${word}" נוספה לרשימה`);
      fetchWords();
      await supabase.from("admin_logs").insert({
        action: "ADD_WORD_FROM_AI",
        details: { word },
        admin_id: currentUser,
      });
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
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-500/30 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Analysis Section */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="text-purple-400" size={28} />
            <div>
              <h3 className="font-bold text-lg text-white">
                ניתוח רעלנות עם AI
              </h3>
              <p className="text-gray-400 text-sm">
                קבל המלצות חכמות לשיפור הרשימה השחורה
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-bold text-white transition-all hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isAnalyzing || blockedWords.length === 0}
            onClick={analyzeWithAI}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
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
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="mb-2 font-bold text-purple-400 text-sm">ניתוח:</h4>
              <p className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                {analysisResult.analysis}
              </p>
            </div>
            {analysisResult.suggestions.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h4 className="mb-3 font-bold text-blue-400 text-sm">
                  המלצות למילים נוספות:
                </h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {analysisResult.suggestions.map((word, idx) => (
                    <button
                      className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 transition-all hover:border-blue-500/50 hover:bg-white/10"
                      key={idx}
                      onClick={() => addSuggestedWord(word)}
                    >
                      <span className="text-sm text-white">{word}</span>
                      <Plus
                        className="text-gray-500 group-hover:text-blue-400"
                        size={14}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Add New Word */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-white/5 bg-[#0e0e1b] p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-lg text-white">
              <Plus className="text-red-500" size={18} />
              הוספת מילה חוסמת
            </h3>
            <form className="space-y-4" onSubmit={addWord}>
              <div>
                <label className="mb-1 block text-gray-400 text-sm">
                  המילה לחסימה
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right text-white outline-none focus:border-red-500/50"
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="למשל: noob"
                  type="text"
                  value={newWord}
                />
                <p className="mt-2 text-gray-500 text-xs">
                  * מילים אלו יסוננו אוטומטית מהצ'אט.
                </p>
              </div>
              <button
                className="w-full rounded-xl bg-red-600 py-2.5 font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!newWord.trim()}
                type="submit"
              >
                הוסף לרשימה
              </button>
            </form>
          </div>
        </div>

        {/* Word List */}
        <div className="space-y-4 lg:col-span-2">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
              size={16}
            />
            <input
              className="w-full rounded-xl border border-white/5 bg-[#0e0e1b] py-2.5 pr-10 pl-4 text-right text-sm text-white outline-none focus:border-red-500/30"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש מילה..."
              type="text"
              value={searchQuery}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {filteredWords.map((item) => (
              <div
                className="group flex items-center justify-between rounded-xl border border-white/5 bg-[#1a1a2e] p-3 transition-all hover:border-red-500/30"
                key={item.word}
              >
                <span className="font-medium text-white">{item.word}</span>
                <button
                  className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/20 group-hover:text-red-500"
                  onClick={() => removeWord(item.word)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {filteredWords.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-500">
                {searchQuery ? "לא נמצאו תוצאות" : "אין מילים חסומות כרגע."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
