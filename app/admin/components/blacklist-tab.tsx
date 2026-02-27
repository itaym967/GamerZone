"use client";

import {
  Add01Icon,
  BrainIcon,
  Delete02Icon,
  Loading02Icon,
  Search01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  const [isAnalyzing, _setIsAnalyzing] = useState(false);
  const [analysisResult, _setAnalysisResult] =
    useState<AIAnalysisResult | null>(null);
  const [showAnalysis, _setShowAnalysis] = useState(false);

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

  const analyzeWithAI = () => {
    toast.info("ניתוח רעלנות עם AI הוסר מהמערכת.");
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
      <div className="rounded-2xl border border-purple-500/20 bg-linear-to-r from-purple-500/10 to-blue-500/10 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HugeiconsIcon
              className="text-purple-400"
              icon={BrainIcon}
              size={28}
            />
            <div>
              <h3 className="font-bold text-fluid-lg text-white">
                ניתוח רעלנות עם AI
              </h3>
              <p className="text-fluid-sm text-gray-400">
                קבל המלצות חכמות לשיפור הרשימה השחורה
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 px-6 py-3 font-bold text-white transition-all hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isAnalyzing || blockedWords.length === 0}
            onClick={analyzeWithAI}
            type="button"
          >
            {isAnalyzing ? (
              <>
                <HugeiconsIcon
                  className="animate-spin"
                  icon={Loading02Icon}
                  size={18}
                />
                <span>מנתח...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={SparklesIcon} size={18} />
                <span>נתח עם AI</span>
              </>
            )}
          </button>
        </div>

        {showAnalysis && analysisResult && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="mb-2 font-bold text-fluid-sm text-purple-400">
                ניתוח:
              </h4>
              <p className="whitespace-pre-wrap text-fluid-sm text-gray-300 leading-relaxed">
                {analysisResult.analysis}
              </p>
            </div>
            {analysisResult.suggestions.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h4 className="mb-3 font-bold text-blue-400 text-fluid-sm">
                  המלצות למילים נוספות:
                </h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {analysisResult.suggestions.map((word) => (
                    <button
                      className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 transition-all hover:border-blue-500/50 hover:bg-white/10"
                      key={word}
                      onClick={() => addSuggestedWord(word)}
                      type="button"
                    >
                      <span className="text-fluid-sm text-white">{word}</span>
                      <HugeiconsIcon
                        className="text-gray-500 group-hover:text-blue-400"
                        icon={Add01Icon}
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
          <div className="sticky top-6 rounded-2xl border border-white/5 bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-fluid-lg text-white">
              <HugeiconsIcon
                className="text-red-500"
                icon={Add01Icon}
                size={18}
              />
              הוספת מילה חוסמת
            </h3>
            <form className="space-y-4" onSubmit={addWord}>
              <div>
                <label
                  className="mb-1 block text-fluid-sm text-gray-400"
                  htmlFor="blocked-word-input"
                >
                  המילה לחסימה
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right text-white outline-hidden focus:border-red-500/50"
                  id="blocked-word-input"
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="למשל: noob"
                  type="text"
                  value={newWord}
                />
                <p className="mt-2 text-fluid-xs text-gray-500">
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
            <HugeiconsIcon
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
              icon={Search01Icon}
              size={16}
            />
            <input
              className="w-full rounded-xl border border-white/5 bg-card py-2.5 pr-10 pl-4 text-right text-fluid-sm text-white outline-hidden focus:border-red-500/30"
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
                  type="button"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
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
