"use client";

import {
  Cancel01Icon,
  SentIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ReportMessageModalProps {
  isOpen: boolean;
  messageId: string | null;
  onClose: () => void;
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

    const reportDescription = description.trim() === "" ? null : description;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("content_reports").insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reported_message_id: messageId,
        report_type: reportType,
        description: reportDescription,
      });

      if (error) {
        toast.error("שגיאה בשליחת הדיווח");
        setIsSubmitting(false);
        return;
      }

      toast.success("הדיווח נשלח בהצלחה", {
        description: "צוות המנהלים יבדוק את הדיווח בהקדם.",
      });
      onClose();
      setReportType("");
      setDescription("");
    } catch (error: unknown) {
      console.error("Error submitting report:", error);
      toast.error("שגיאה בשליחת הדיווח");
    }
    setIsSubmitting(false);
  };

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <m.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          >
            <m.div
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
              exit={{ scale: 0.9, opacity: 0 }}
              initial={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <button
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={onClose}
                  type="button"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
                <h2 className="flex items-center gap-2 font-bold text-fluid-lg text-white">
                  <span>דיווח על תוכן</span>
                  <HugeiconsIcon
                    className="text-red-400"
                    icon={Shield01Icon}
                    size={20}
                  />
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map((type) => (
                    <button
                      className={`rounded-xl border p-3 text-right text-fluid-sm transition-all ${
                        reportType === type.value
                          ? "border-red-500/50 bg-red-500/10 text-red-400"
                          : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                      key={type.value}
                      onClick={() => setReportType(type.value)}
                      type="button"
                    >
                      <span className="mb-1 block text-fluid-lg">
                        {type.icon}
                      </span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-1 text-right">
                  <p className="font-medium text-fluid-sm text-gray-400">
                    פרטים נוספים (אופציונלי)
                  </p>
                  <textarea
                    className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-right text-fluid-sm text-white outline-hidden focus:border-red-500/50"
                    id="report-description"
                    maxLength={500}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="תאר את הבעיה..."
                    value={description}
                  />
                </div>

                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-bold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!reportType || isSubmitting}
                  onClick={handleSubmit}
                  type="button"
                >
                  {isSubmitting ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <HugeiconsIcon icon={SentIcon} size={16} />
                      <span>שלח דיווח</span>
                    </>
                  )}
                </button>

                <p className="text-center text-fluid-xs text-gray-500">
                  דיווחים שקריים עלולים להוביל להשעיית חשבון.
                </p>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
