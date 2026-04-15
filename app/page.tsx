"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Shield, Settings, LogOut, CheckCircle } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = "fariz.syed@gmail.com";

export default function WorldCupApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("matches");
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState(1);

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
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-emerald-500 w-5 h-5" />
          <h1 className="font-bold text-xl text-white uppercase italic">World Cup <span className="text-emerald-400">2026</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">Poäng</p>
            <p className="text-amber-400 font-bold text-lg leading-none">{profile.total_points || 0}</p>
          </div>
          {user.email === ADMIN_EMAIL && <Settings onClick={() => setView("admin")} className="cursor-pointer hover:text-amber-400 w-5 h-5" />}
          <LogOut onClick={() => supabase.auth.signOut()} className="cursor-pointer hover:text-white w-5 h-5 text-slate-500" />
        </div>
      </header>

      <nav className="max-w-5xl mx-auto px-4 mt-6 flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
        <button onClick={() => setView("matches")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === "matches" ? "bg-emerald-500 text-black" : "text-slate-400"}`}>Matcher</button>
        <button onClick={() => setView("leaderboard")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === "leaderboard" ? "bg-emerald-500 text-black" : "text-slate-400"}`}>Tabell</button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {view === "matches" ? (
          <>
            <div className="flex gap-6 mb-8 border-b border-white/5 overflow-x-auto">
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setTab(n)} className={`pb-3 text-[10px] font-bold uppercase tracking-widest transition ${tab === n ? "border-b-2 border-emerald-400 text-white" : "text-slate-500"}`}>Phase {n}</button>
              ))}
            </div>
            <div className="grid gap-4">
              {matches.filter((m: any) => m.phase === tab).map((m: any) => <MatchCard key={m.id} match={m} userId={user.id} />)}
            </div>
          </>
        ) : view === "admin" ? (
          <AdminPanel matches={matches} />
        ) : (
          <div className="text-center py-20 text-slate-500 uppercase tracking-widest text-xs font-bold">Tabellen kommer snart!</div>
        )}
      </main>
    </div>
  );
}

function MatchCard({ match, userId }: any) {
  const [h, setH] = useState("");
  const [a, setA] = useState("");
  const [saved, setSaved] = useState(false);
  const date = new Date(match.kickoff_time);

  const savePrediction = async () => {
    if (h === "" || a === "") return;
    const { error } = await supabase.from("predictions").upsert({ user_id: userId, match_id: match.id, pred_home: parseInt(h), pred_away: parseInt(a) }, { onConflict: 'user_id,match_id' });
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition hover:border-emerald-500/20">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{date.toLocaleString('sv-SE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">{match.channel || "TBA"}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="flex-1 text-right font-bold text-lg uppercase">{match.home_team}</span>
        <div className="flex gap-2">
          <input type="number" value={h} onChange={(e) => setH(e.target.value)} onBlur={savePrediction} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-emerald-400 focus:outline-none" placeholder="-" />
          <input type="number" value={a} onChange={(e) => setA(e.target.value)} onBlur={savePrediction} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-emerald-400 focus:outline-none" placeholder="-" />
        </div>
        <span className="flex-1 text-left font-bold text-lg uppercase">{match.away_team}</span>
      </div>
      {saved && <div className="mt-2 text-center text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> SPARAT</div>}
    </div>
  );
}

function AdminPanel({ matches }: any) {
  return (
    <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6">
      <h2 className="text-amber-400 font-bold text-xl mb-4 flex items-center gap-2 uppercase italic"><Shield className="w-5 h-5" /> Admin</h2>
      <div className="space-y-4">
        {matches.map((m: any) => (
          <div key={m.id} className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
            <span className="text-xs font-bold uppercase">{m.home_team} - {m.away_team}</span>
            <button className="bg-emerald-500 text-black text-[10px] font-bold px-4 py-2 rounded-lg uppercase">Settle</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthScreen() {
  const handleLogin = () => supabase.auth.signInWithOAuth({ provider: 'google' });
  return (
    <div className="min-h-screen bg-[#07090d] grid place-items-center text-center p-4">
      <div>
        <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tighter uppercase italic">VM-Tips <span className="text-emerald-400">2026</span></h1>
        <button onClick={handleLogin} className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:bg-slate-200 transition uppercase tracking-widest text-xs mt-8">Logga in med Google</button>
      </div>
    </div>
  );
}

function UsernameSetup({ userId, onComplete }: any) {
  const [name, setName] = useState("");
  const handleSubmit = async () => {
    if (name.length < 3) return alert("Namnet måste vara minst 3 tecken!");
    const { error } = await supabase.from("profiles").upsert({ id: userId, username: name });
    if (!error) onComplete();
  };
  return (
    <div className="min-h-screen bg-[#07090d] grid place-items-center p-4">
      <div className="max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight italic">Ditt spelarnamn</h2>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white mb-6 text-center focus:border-emerald-400 font-bold" placeholder="Zlatan" />
        <button onClick={handleSubmit} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-bold uppercase tracking-widest">Starta</button>
      </div>
    </div>
  );
}
