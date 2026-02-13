"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle, ShieldCheck } from "lucide-react";
import Logo from "../../components/Logo";

function SuccessContent() {
    const searchParams = useSearchParams();
    const alreadyGranted = searchParams.get("already") === "true";

    return (
        <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md text-center relative z-10">
                <Logo size="lg" className="justify-center mb-8" />

                <div className="bg-[#0e0e1b] border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        {alreadyGranted ? (
                            <ShieldCheck size={40} className="text-green-500" />
                        ) : (
                            <CheckCircle size={40} className="text-green-500" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-3">
                        {alreadyGranted ? "ההסכמה כבר אושרה" : "ההסכמה אושרה בהצלחה!"}
                    </h1>

                    <p className="text-gray-400 mb-6">
                        {alreadyGranted
                            ? "כבר אישרת את החשבון של ילדך. החשבון פעיל עם הגנות בטיחות."
                            : "תודה שאישרת את החשבון של ילדך ב-GamerZone. החשבון כעת פעיל עם הגנות בטיחות מוגברות."
                        }
                    </p>

                    <div className="bg-white/5 rounded-xl p-4 text-right space-y-3 mb-6">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2 justify-end">
                            <span>הגנות פעילות</span>
                            <ShieldCheck size={16} className="text-green-500" />
                        </h3>
                        <ul className="text-sm text-gray-400 space-y-2">
                            <li className="flex items-center gap-2 justify-end">
                                <span>סינון תוכן מוגבר</span>
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                            </li>
                            <li className="flex items-center gap-2 justify-end">
                                <span>הגבלת שיתוף מידע אישי</span>
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                            </li>
                            <li className="flex items-center gap-2 justify-end">
                                <span>יומן פעילות</span>
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                            </li>
                            <li className="flex items-center gap-2 justify-end">
                                <span>הגבלת זמן צ&apos;אט יומי</span>
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                            </li>
                        </ul>
                    </div>

                    <p className="text-xs text-gray-500">
                        ניתן לפנות אלינו בכל שאלה בנוגע לבטיחות ילדים בפלטפורמה.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ParentalConsentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050510] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
