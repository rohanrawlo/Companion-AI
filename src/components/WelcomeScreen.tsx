import React, { useState } from "react";
import { UserProfile } from "../types";
import { googleSignIn } from "../auth";
import { motion } from "motion/react";
import { Sparkles, Briefcase, GraduationCap, Compass, Landmark, Calendar } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: (profile: UserProfile, token: string) => void;
}

const OCCUPATIONS = [
  { value: "Student", label: "Student", icon: GraduationCap, color: "from-blue-500 to-indigo-600" },
  { value: "Working Professional", label: "Working Professional", icon: Briefcase, color: "from-emerald-500 to-teal-600" },
  { value: "Entrepreneur", label: "Entrepreneur", icon: Landmark, color: "from-amber-500 to-orange-600" },
  { value: "Freelancer", label: "Freelancer", icon: Compass, color: "from-pink-500 to-rose-600" },
];

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [goals, setGoals] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleSignInAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name to continue.");
      return;
    }
    if (!occupation) {
      setError("Please select your occupation.");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      const authResult = await googleSignIn();
      if (authResult) {
        onComplete(
          {
            name: name.trim(),
            occupation,
            goals: goals.trim() || "Improve focus, structure study slots, and balance life.",
          },
          authResult.accessToken
        );
      } else {
        setError("Sign-in process did not complete. Please try again.");
      }
    } catch (err: any) {
      console.error("WelcomeScreen Sign In Error:", err);
      const errCode = err?.code || "";
      const errMsg = err?.message || "";
      const isPopupClosed = errCode === "auth/popup-closed-by-user" || errMsg.includes("popup-closed-by-user");
      const isPopupBlocked = errCode === "auth/popup-blocked" || errMsg.includes("popup-blocked");
      
      if (isPopupClosed) {
        setError("The Google Sign-In popup was closed before completing. If you are inside the preview frame, browser security rules can block the popup communication. Please click 'Open App in New Tab' below to sign in successfully!");
      } else if (isPopupBlocked) {
        setError("The Google Sign-In popup was blocked by your browser. Please allow popups for this site, or open the app in a new tab below to sign in.");
      } else {
        setError(errMsg || "Failed to connect your Google Account. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 mb-4 select-none drop-shadow-md">
            <img src="/favicon.svg" alt="Companion AI Logo" className="w-full h-full object-contain rounded-2xl" referrerPolicy="no-referrer" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Meet Companion
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-sm">
            Your proactive AI productivity partner. Let's design an adaptive schedule synced with your real life.
          </p>
        </div>

        <form onSubmit={handleSignInAndConnect} className="space-y-6">
          <div>
            <label htmlFor="name-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              id="name-input"
              type="text"
              placeholder="e.g. Rohan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Your Occupation
            </label>
            <div className="grid grid-cols-2 gap-3">
              {OCCUPATIONS.map((occ) => {
                const IconComponent = occ.icon;
                const isSelected = occupation === occ.value;
                return (
                  <button
                    key={occ.value}
                    type="button"
                    onClick={() => setOccupation(occ.value)}
                    className={`relative overflow-hidden flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20"
                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 mb-3 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="font-display font-semibold text-xs text-slate-900 dark:text-white">
                      {occ.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="goals-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Primary Goals (Optional)
            </label>
            <textarea
              id="goals-input"
              placeholder="e.g. Complete MCA Project, prepare for cloud exam, or maintain healthy workout habits."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-medium border border-rose-100 dark:border-rose-950/50">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Connecting Google Calendar...
                </span>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Connect Google Calendar & Continue
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3 leading-relaxed">
              Companion requires read-only permission to sync your Google Calendar meetings and classes so that we schedule task-slots in your exact free hours.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
