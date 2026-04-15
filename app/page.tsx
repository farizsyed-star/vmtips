"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Trophy, Shield, Settings, LogOut, CheckCircle 
} from "lucide-react";

// --- KONFIGURATION ---
// Dessa hämtas från dina miljövariabler i Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Din e-post för admin-åtkomst
const ADMIN_EMAIL = "fariz.syed@gmail.com";

export default function WorldCupApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("matches");
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState(1);

  // 1. KOLLA INLOGGNING & PROFIL
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    };
    getSession();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  };

  // 2. HÄMTA MATCHER FRÅN SUPABASE
  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await supabase.from("matches").select("*").order("kickoff_time", { ascending: true });
      if (data) setMatches(data as any);
    };
    fetchMatches();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#07090d] grid place-items-center text-emerald-400 font-bold uppercase tracking-widest">Laddar VM-feber...</div>;

  if (!user) return <AuthScreen />;
  if (!profile?.username) return <UsernameSetup userId={user.id} onComplete={() => fetchProfile(user.id)} />;

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-200 font-sans pb-20">
      {/* HEADER */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <h1 className="font-bold text-xl tracking-wider text-white">WORLD CUP <span className="text-emerald-400">2026</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Dina Poäng</p>
              <p className="text-amber-400 font-bold text-lg leading-none">{profile.total_points || 0} PTS</p>
            </div>
            {user.email === ADMIN_EMAIL && (
              <button onClick={() => setView("admin")} className="p-2 hover:bg-white/5 rounded-full transition text-slate-400 hover:text-amber-400">
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-500 hover:text-white transition"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <button onClick={() => setView("matches")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === "matches" ? "bg-emerald-500 text-black" : "text-slate-400"}`}>Matcher</button>
          <button onClick={() => setView("leaderboard")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === "leaderboard"