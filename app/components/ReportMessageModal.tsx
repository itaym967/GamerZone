"use client";

import { useState } from "react";
import { X, ShieldAlert, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface ReportMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    messageId: string | null;
    reportedUserId: string | null;
    reporterId: string;
}

const REPORT_TYPES = [
    { value: "harassment", label: "הטרדה", icon: "😠" },
    { value: "inappropriate_content", label: "תוכן לא הולם", icon: "🚫" },
    { value: "spam", label: "ספאם", icon: "📧" },
    { value: "predatory_behavior", label: "התנהגות טורפנית", icon: "⚠️" },
    { value: "personal_info_sharing", label: "שיתוף מידע אישי", icon: "🔒" },
    { value: "other", label: "אחר", icon: "📝" },
] as const;

export default function ReportMessageModal({
    isOpen,
    onClose,
    messageId,
    reportedUserId,
    reporterId,
}: ReportMessageModalProps) {
    const [reportType, setReportType] = useState<string>("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClient();

    const handleSubmit = async () => {
        if (!reportType) {
            toast.error("אנא בחר סוג דיווח");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("content_reports").insert({
                reporter_id: reporterId,
                reported_user_id: reportedUserId,
                reported_message_id: messageId,
                report_type: reportType,
                description: description || null,
            });

            if (error) throw error;

            toast.success("הדיווח נשלח בהצלחה", {
                description: "צוות המנהלים יבדוק את הדיווח בהקדם.",
            });
            onClose();
            setReportType("");
            setDescription("");
        } catch (error: any) {
            console.error("Error submitting report:", error);
            toast.error("שגיאה בשליחת הדיווח");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-[#0e0e1b] border border-white/10 rounded-2xl p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span>דיווח על תוכן</span>
                                <ShieldAlert size={20} className="text-red-400" />
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {REPORT_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setReportType(type.value)}
                                        className={`p-3 rounded-xl border text-right text-sm transition-all ${
                                            reportType === type.value
                                                ? "border-red-500/50 bg-red-500/10 text-red-400"
                                                : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                                        }`}
                                    >
                                        <span className="text-lg mb-1 block">{type.icon}</span>
                                        <span>{type.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-1 text-right">
                                <label className="text-sm font-medium text-gray-400">
                                    פרטים נוספים (אופציונלי)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="תאר את הבעיה..."
                                    className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-red-500/50 text-right resize-none"
                                    maxLength={500}
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!reportType || isSubmitting}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={16} />
                                        <span>שלח דיווח</span>
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center">
                                דיווחים שקריים עלולים להוביל להשעיית חשבון.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
