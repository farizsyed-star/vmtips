"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Shield, Settings, LogOut, CheckCircle, BookOpen } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = "fariz.syed@gmail.com";

const PHASES = [
  { id: 1, label: "Group Stages" },
  { id: 2, label: "Knockout Stage 1/16th - 1/4th" },
  { id: 3, label: "Knockout Stage - Semifinals & Finals" }
];

export default function WorldCupApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [view, setView] = useState("matches"); // matches, leaderboard, rules, admin
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState(1);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
          setProfile(prof);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
      if (session) {
        setUser(session.user);
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await supabase.from("matches").select("*").order("kickoff_time", { ascending: true });
      if (data) setMatches(data as any);
    };
    fetchMatches();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#07090d] grid place-items-center text-emerald-400 font-bold uppercase tracking-widest">Loading...</div>;
  }

  if (recoveryMode) {
    return <UpdatePasswordScreen onComplete={() => setRecoveryMode(false)} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!profile?.username) {
    return <UsernameSetup userId={user.id} onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-200 font-sans pb-20">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-emerald-500 w-5 h-5" />
          <h1 className="font-bold text-xl text-white uppercase italic">World Cup <span className="text-emerald-400">2026</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">Points</p>
            <p className="text-amber-400 font-bold text-lg leading-none">{profile?.total_points || 0}</p>
          </div>
          {user?.email === ADMIN_EMAIL && (
            <Settings onClick={() => setView("admin")} className="cursor-pointer hover:text-amber-400 w-5 h-5" />
          )}
          <LogOut onClick={() => supabase.auth.signOut()} className="cursor-pointer hover:text-white w-5 h-5 text-slate-500" />
        </div>
      </header>

      <nav className="max-w-5xl mx-auto px-4 mt-6 flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
        <button onClick={() => setView("matches")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === "matches" ? "bg-emerald-500 text-black" : "text-slate-400"}`}>Matches</button>
        <button onClick={() => setView("leaderboard")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === "leaderboard" ? "bg-emerald-500 text-black" : "text-slate-400"}`}>Leaderboard</button>
        <button onClick={() => setView("rules")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${view === "rules" ? "bg-emerald-500 text-black" : "text-slate-400"}`}>Rules</button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {view === "matches" ? (
          <>
            <div className="flex gap-4 mb-8 border-b border-white/5 overflow-x-auto pb-2 scrollbar-hide">
              {PHASES.map(phase => (
                <button 
                  key={phase.id} 
                  onClick={() => setTab(phase.id)} 
                  className={`whitespace-nowrap pb-3 text-[10px] font-bold uppercase tracking-widest transition ${tab === phase.id ? "border-b-2 border-emerald-400 text-white" : "text-slate-500"}`}
                >
                  {phase.label}
                </button>
              ))}
            </div>
            <div className="grid gap-4">
              {matches.filter((m: any) => m.phase === tab).map((m: any) => <MatchCard key={m.id} match={m} userId={user.id} />)}
              {matches.filter((m: any) => m.phase === tab).length === 0 && (
                <div className="text-center py-10 text-slate-600 text-xs uppercase tracking-widest font-bold">No matches found for this stage yet.</div>
              )}
            </div>
          </>
        ) : view === "rules" ? (
          <RulesPage />
        ) : view === "admin" ? (
          <AdminPanel matches={matches} />
        ) : (
          <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest">Coming soon!</div>
        )}
      </main>
    </div>
  );
}

function MatchCard({ match, userId }: any) {
  const [h, setH] = useState("");
  const [a, setA] = useState("");
  const [saved, setSaved] = useState(false);
  
  // Format dates gracefully
  const dateObj = new Date(match.kickoff_time);
  const formattedDate = isNaN(dateObj.getTime()) ? "TBA" : dateObj.toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

  const savePrediction = async () => {
    if (h === "" || a === "") return;
    const { error } = await supabase.from("predictions").upsert({ user_id: userId, match_id: match.id, pred_home: parseInt(h), pred_away: parseInt(a) }, { onConflict: 'user_id,match_id' });
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const preventNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') {
      e.preventDefault();
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition hover:border-emerald-500/20">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{formattedDate}</span>
        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">{match.channel || "TBA"}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="flex-1 text-right font-bold text-lg uppercase">{match.home_team}</span>
        <div className="flex gap-2">
          <input 
            type="number" min="0" value={h} onChange={(e) => setH(e.target.value)} onBlur={savePrediction} onKeyDown={preventNegative}
            className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-emerald-400 focus:outline-none" placeholder="-" 
          />
          <input 
            type="number" min="0" value={a} onChange={(e) => setA(e.target.value)} onBlur={savePrediction} onKeyDown={preventNegative}
            className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-emerald-400 focus:outline-none" placeholder="-" 
          />
        </div>
        <span className="flex-1 text-left font-bold text-lg uppercase">{match.away_team}</span>
      </div>
      {saved && <div className="mt-2 text-center text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> SAVED</div>}
    </div>
  );
}

function RulesPage() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
      <h2 className="text-emerald-400 font-bold text-xl mb-6 flex items-center gap-2 uppercase italic"><BookOpen className="w-5 h-5" /> Rules & Scoring</h2>
      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        <section>
          <h3 className="text-white font-bold mb-2 uppercase tracking-wide text-xs">How to play</h3>
          <p>Predict the exact score of every match in the tournament. You can change your prediction up until the match officially kicks off.</p>
        </section>
        <section>
          <h3 className="text-white font-bold mb-2 uppercase tracking-wide text-xs">Points System</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="text-amber-400 font-bold">Exact Score:</span> 3 Points (e.g., you guess 2-1 and the match ends 2-1).</li>
            <li><span className="text-emerald-400 font-bold">Correct Outcome:</span> 1 Point (e.g., you guess 2-0, match ends 3-1. You got the winning team right).</li>
            <li><span className="text-rose-400 font-bold">Wrong:</span> 0 Points.</li>
          </ul>
        </section>
        <section>
          <h3 className="text-white font-bold mb-2 uppercase tracking-wide text-xs">Knockout Stages</h3>
          <p>Predictions are based on the score at the end of regular time (including injury time) but <span className="underline">excluding</span> extra time and penalty shootouts.</p>
        </section>
      </div>
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
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setMsg({ text: "Processing...", type: "info" });

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg({ text: error.message, type: "error" });
      else setMsg({ text: "Success! Please check your email to verify your account.", type: "success" });
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ text: error.message, type: "error" });
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) setMsg({ text: error.message, type: "error" });
      else setMsg({ text: "Password reset link sent to your email!", type: "success" });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090d] grid place-items-center text-center p-4">
      <div className="w-full max-w-sm">
        <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tighter uppercase italic">World Cup <span className="text-emerald-400">2026</span></h1>
        
        <form onSubmit={handleAuth} className="mt-8 flex flex-col gap-4">
          <input 
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="Email address" 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center focus:border-emerald-400 font-bold outline-none"
          />
          {mode !== "forgot" && (
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              placeholder="Password (min 6 chars)" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center focus:border-emerald-400 font-bold outline-none"
            />
          )}

          <button type="submit" className="bg-emerald-500 text-black px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs mt-2">
            {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </button>
        </form>

        {msg.text && (
          <div className={`mt-4 text-sm font-bold p-3 rounded-lg ${msg.type === 'error' ? 'text-rose-400 bg-rose-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
            {msg.text}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          {mode !== "login" && <button onClick={() => { setMode("login"); setMsg({text:"", type:""}); }}>Back to Sign In</button>}
          {mode !== "signup" && <button onClick={() => { setMode("signup"); setMsg({text:"", type:""}); }}>Create a new account</button>}
          {mode !== "forgot" && <button onClick={() => { setMode("forgot"); setMsg({text:"", type:""}); }}>Forgot your password?</button>}
        </div>
      </div>
    </div>
  );
}

function UpdatePasswordScreen({ onComplete }: any) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMsg(error.message);
    else {
      alert("Password updated successfully!");
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-[#07090d] grid place-items-center text-center p-4">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-6 uppercase italic">Reset Password</h2>
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <input 
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            placeholder="Enter new password" 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center focus:border-emerald-400 font-bold outline-none"
          />
          <button type="submit" className="bg-emerald-500 text-black px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs">
            Save New Password
          </button>
        </form>
        {msg && <p className="text-rose-400 text-sm mt-4">{msg}</p>}
      </div>
    </div>
  );
}

function UsernameSetup({ userId, onComplete }: any) {
  const [name, setName] = useState("");
  const save = async () => {
    if (name.length < 3) return alert("Must be at least 3 characters!");
    const { error } = await supabase.from("profiles").upsert({ id: userId, username: name });
    if (!error) onComplete();
  };
  return (
    <div className="min-h-screen bg-[#07090d] grid place-items-center p-4">
      <div className="max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-white mb-6 uppercase italic">Choose Player Name</h2>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white mb-6 text-center focus:border-emerald-400 font-bold outline-none" placeholder="e.g. Zlatan" />
        <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-bold uppercase tracking-widest italic">Start Playing</button>
      </div>
    </div>
  );
}
