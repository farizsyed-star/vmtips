"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Shield, Settings, LogOut, CheckCircle, BookOpen, Clock, AlertCircle } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
const ADMIN_EMAIL = "fariz.syed@gmail.com";
const TOURNAMENT_START = new Date("2026-06-11T21:00:00+02:00"); // CEST

export default function WorldCupApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("matches"); // matches, leaderboard, rules, bonus, admin
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState(1);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      if (session) fetchProfile(session.user.id);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    setProfile(data);
  };

  useEffect(() => {
    supabase.from("matches").select("*").order("kickoff_time", { ascending: true }).then(({ data }) => setMatches(data as any || []));
  }, [view]);

  if (loading) return <div className="min-h-screen bg-[#07090d] grid place-items-center text-emerald-400 font-bold tracking-widest uppercase">Initializing Tournament...</div>;
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
            <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black leading-none">Points</p>
            <p className="text-amber-400 font-black text-xl leading-none">{profile?.total_points || 0}</p>
          </div>
          {user?.email === ADMIN_EMAIL && <Settings onClick={() => setView("admin")} className="cursor-pointer hover:text-amber-400 w-5 h-5" />}
          <LogOut onClick={() => supabase.auth.signOut()} className="cursor-pointer hover:text-white w-5 h-5 text-slate-500" />
        </div>
      </header>

      <nav className="max-w-5xl mx-auto px-4 mt-6 flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto">
        <NavBtn active={view === "matches"} onClick={() => setView("matches")} label="Matches" />
        <NavBtn active={view === "bonus"} onClick={() => setView("bonus")} label="Bonus" />
        <NavBtn active={view === "leaderboard"} onClick={() => setView("leaderboard")} label="Leaderboard" />
        <NavBtn active={view === "rules"} onClick={() => setView("rules")} label="Rules" />
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {view === "matches" && <MatchList matches={matches} tab={tab} setTab={setTab} userId={user.id} />}
        {view === "bonus" && <BonusPage userId={user.id} />}
        {view === "leaderboard" && <Leaderboard />}
        {view === "rules" && <RulesPage />}
        {view === "admin" && <AdminPanel matches={matches} />}
      </main>
    </div>
  );
}

function NavBtn({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition ${active ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-slate-300"}`}>
      {label}
    </button>
  );
}

// --- MATCH LIST & LOCKING LOGIC ---
function MatchList({ matches, tab, setTab, userId }: any) {
  const now = new Date();
  
  // Locking logic per Round
  const isRound1Locked = now > TOURNAMENT_START;
  const isRound2Locked = matches.find((m: any) => m.phase === 2 && now > new Date(m.kickoff_time));
  const isRound3Locked = matches.find((m: any) => m.phase === 3 && now > new Date(m.kickoff_time));

  const isLocked = (mPhase: number) => {
    if (mPhase === 1) return isRound1Locked;
    if (mPhase === 2) return isRound2Locked;
    if (mPhase === 3) return isRound3Locked;
    return false;
  };

  return (
    <>
      <div className="flex gap-4 mb-8 border-b border-white/5 overflow-x-auto pb-2">
        <PhaseTab id={1} label="Group Stages" active={tab === 1} onClick={setTab} />
        <PhaseTab id={2} label="Knockout 1/16 - 1/4" active={tab === 2} onClick={setTab} />
        <PhaseTab id={3} label="Semis & Finals" active={tab === 3} onClick={setTab} />
      </div>
      <div className="grid gap-4">
        {matches.filter((m: any) => m.phase === tab).map((m: any) => (
          <MatchCard key={m.id} match={m} userId={userId} locked={isLocked(m.phase)} />
        ))}
      </div>
    </>
  );
}

function PhaseTab({ id, label, active, onClick }: any) {
  return (
    <button onClick={() => onClick(id)} className={`whitespace-nowrap pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${active ? "border-b-2 border-emerald-400 text-white" : "text-slate-600"}`}>
      {label}
    </button>
  );
}

// --- MATCH CARD COMPONENT ---
function MatchCard({ match, userId, locked }: any) {
  const [pred, setPred] = useState({ h: "", a: "", pw: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("predictions").select("*").eq("user_id", userId).eq("match_id", match.id).single()
      .then(({ data }) => data && setPred({ h: data.pred_home.toString(), a: data.pred_away.toString(), pw: data.penalty_winner_pred || "" }));
  }, [match.id, userId]);

  const save = async () => {
    if (locked || pred.h === "" || pred.a === "") return;
    const { error } = await supabase.from("predictions").upsert({ 
      user_id: userId, match_id: match.id, pred_home: parseInt(pred.h), pred_away: parseInt(pred.a), penalty_winner_pred: pred.pw 
    }, { onConflict: 'user_id,match_id' });
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const isDraw = pred.h !== "" && pred.h === pred.a && match.phase > 1;

  return (
    <div className={`bg-white/5 border rounded-2xl p-6 transition-all ${locked ? "border-white/5 opacity-80" : "border-white/10 hover:border-emerald-500/30"}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
          {locked ? <Clock className="w-3 h-3 text-rose-500" /> : null}
          {new Date(match.kickoff_time).toLocaleString('sv-SE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{match.channel}</span>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <span className="flex-1 text-right font-black text-lg uppercase truncate">{match.home_team}</span>
        <div className="flex gap-2">
          <ScoreInput value={pred.h} onChange={(v) => setPred({...pred, h: v})} onBlur={save} disabled={locked} />
          <ScoreInput value={pred.a} onChange={(v) => setPred({...pred, a: v})} onBlur={save} disabled={locked} />
        </div>
        <span className="flex-1 text-left font-black text-lg uppercase truncate">{match.away_team}</span>
      </div>

      {isDraw && !locked && (
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Penalty Winner Bonus (+1pt)</p>
          <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
            <PWBtn active={pred.pw === 'home'} onClick={() => {setPred({...pred, pw: 'home'}); save();}} label={match.home_team} />
            <PWBtn active={pred.pw === 'away'} onClick={() => {setPred({...pred, pw: 'away'}); save();}} label={match.away_team} />
          </div>
        </div>
      )}
      
      {saved && <div className="mt-2 text-center text-[9px] text-emerald-400 font-black tracking-tighter uppercase italic">Prediction Locked & Saved</div>}
    </div>
  );
}

function ScoreInput({ value, onChange, onBlur, disabled }: any) {
  return (
    <input 
      type="number" min="0" disabled={disabled} value={value} onBlur={onBlur}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:border-emerald-400 outline-none disabled:text-slate-600" placeholder="-" 
    />
  );
}

function PWBtn({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${active ? "bg-emerald-500 text-black shadow-lg" : "text-slate-500"}`}>{label}</button>
  );
}

// --- BONUS QUESTIONS PAGE ---
function BonusPage({ userId }: any) {
  const locked = new Date() > TOURNAMENT_START;
  const [form, setForm] = useState({ scorer: "", assister: "", cards: "", mvp: "", goals: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("bonus_predictions").select("*").eq("user_id", userId).single()
      .then(({ data }) => data && setForm({ 
        scorer: data.top_scorer, assister: data.top_assister, cards: data.most_cards_team, mvp: data.mvp, goals: data.total_goals_guess.toString() 
      }));
  }, [userId]);

  const save = async () => {
    if (locked) return;
    const { error } = await supabase.from("bonus_predictions").upsert({
      user_id: userId, top_scorer: form.scorer, top_assister: form.assister, most_cards_team: form.cards, mvp: form.mvp, total_goals_guess: parseInt(form.goals)
    });
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-amber-400 font-black text-xl mb-6 flex items-center gap-2 uppercase italic">Tournament Bonus <span className="text-white text-xs opacity-50">(3pts each)</span></h2>
      <div className="space-y-4">
        <BonusInp label="Tournament Top Scorer" value={form.scorer} onChange={(v) => setForm({...form, scorer: v})} disabled={locked} />
        <BonusInp label="Tournament Top Assister" value={form.assister} onChange={(v) => setForm({...form, assister: v})} disabled={locked} />
        <BonusInp label="Team with Most Cards" value={form.cards} onChange={(v) => setForm({...form, cards: v})} disabled={locked} />
        <BonusInp label="Tournament MVP" value={form.mvp} onChange={(v) => setForm({...form, mvp: v})} disabled={locked} />
        <BonusInp label="Total Goals Scored (Tie-breaker)" value={form.goals} onChange={(v) => setForm({...form, goals: v})} disabled={locked} type="number" />
        
        {!locked && (
          <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-widest mt-4 hover:scale-[1.02] transition-all">Save Bonus Predictions</button>
        )}
        {saved && <p className="text-center text-[10px] text-emerald-400 font-black uppercase italic">Bonus Locked & Saved!</p>}
        {locked && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-black uppercase text-center">Bonus is now locked for the tournament</div>}
      </div>
    </div>
  );
}

function BonusInp({ label, value, onChange, disabled, type="text" }: any) {
  return (
    <div>
      <p className="text-[9px] font-black text-slate-500 uppercase mb-1 px-1">{label}</p>
      <input 
        type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 outline-none disabled:opacity-50 font-bold"
      />
    </div>
  );
}

// --- LEADERBOARD COMPONENT ---
function Leaderboard() {
  const [list, setList] = useState([]);

  useEffect(() => {
    supabase.from("profiles").select("*").order("total_points", { ascending: false }).order("total_goals_tiebreaker", { ascending: true })
      .then(({ data }) => setList(data as any || []));
  }, []);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span>Player</span>
        <div className="flex gap-8">
          <span>Goals (T)</span>
          <span>Pts</span>
        </div>
      </div>
      {list.map((p: any, i) => (
        <div key={p.id} className={`p-5 flex justify-between items-center ${i < 3 ? "bg-emerald-500/5" : ""}`}>
          <div className="flex items-center gap-4">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? "bg-amber-400 text-black" : "bg-white/10"}`}>{i + 1}</span>
            <span className="font-black uppercase tracking-tight">{p.username}</span>
          </div>
          <div className="flex gap-12 items-center">
            <span className="text-slate-500 font-bold">{p.total_goals_tiebreaker}</span>
            <span className="text-amber-400 font-black text-xl">{p.total_points}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- ADMIN PANEL & SCORING ENGINE ---
function AdminPanel({ matches }: any) {
  const [scores, setScores] = useState<any>({});

  const settleMatch = async (m: any) => {
    const s = scores[m.id];
    if (!s || s.h === "" || s.a === "") return alert("Enter scores first!");
    
    // 1. Fetch all predictions for this match
    const { data: preds } = await supabase.from("predictions").select("*").eq("match_id", m.id);
    if (!preds) return;

    // 2. Calculate points for each user
    for (const p of preds) {
      let pts = 0;
      const actualH = parseInt(s.h);
      const actualA = parseInt(s.a);
      
      const isExact = p.pred_home === actualH && p.pred_away === actualA;
      const isOutcome = (Math.sign(p.pred_home - p.pred_away) === Math.sign(actualH - actualA));
      
      // Tiered Scoring Logic
      if (m.sub_phase === 'group') {
        pts = isExact ? 2 : (isOutcome ? 1 : 0);
      } else if (m.sub_phase === 'r16' || m.sub_phase === 'quarter') {
        pts = isExact ? 3 : (isOutcome ? 2 : 0);
      } else if (m.sub_phase === 'semi') {
        pts = isExact ? 4 : (isOutcome ? 3 : 0);
      } else if (m.sub_phase === 'bronze') {
        pts = isExact ? 5 : (isOutcome ? 4 : 0);
      } else if (m.sub_phase === 'final') {
        pts = isExact ? 6 : (isOutcome ? 5 : 0);
      }

      // Penalty Bonus (+1)
      if (m.phase > 1 && actualH === actualA && p.penalty_winner_pred === s.pw) {
        pts += 1;
      }

      // 3. Update User Profile Points
      if (pts > 0) {
        await supabase.rpc('increment_points', { user_id: p.user_id, amount: pts });
      }
    }

    // 4. Mark match as settled
    await supabase.from("matches").update({ home_score: s.h, away_score: s.a, penalty_winner_actual: s.pw, settled: true }).eq("id", m.id);
    alert(`Match Settled! Points calculated for ${preds.length} users.`);
  };

  return (
    <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6">
      <h2 className="text-amber-400 font-black text-xl mb-6 flex items-center gap-2 uppercase italic"><Shield className="w-5 h-5" /> Admin Settlement</h2>
      <div className="space-y-4">
        {matches.filter((m: any) => !m.settled).map((m: any) => (
          <div key={m.id} className="bg-black/40 border border-white/5 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase text-slate-400">{m.home_team} vs {m.away_team} ({m.sub_phase})</span>
              <button onClick={() => settleMatch(m)} className="bg-emerald-500 text-black text-[9px] font-black px-4 py-2 rounded-lg uppercase">Settle Points</button>
            </div>
            <div className="flex gap-2">
              <input type="number" placeholder="H" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center font-bold" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], h: e.target.value}})} />
              <input type="number" placeholder="A" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center font-bold" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], a: e.target.value}})} />
              {m.phase > 1 && (
                 <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[9px] font-bold" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], pw: e.target.value}})}>
                   <option value="">PW?</option>
                   <option value="home">{m.home_team}</option>
                   <option value="away">{m.away_team}</option>
                 </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- UTILS & AUTH COMPONENTS ---
function ScoreRulesList() {
  return (
    <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs mt-2">
      <li>Groups: <span className="text-white">1pt Outcome / 2pt Score</span></li>
      <li>R16/QF: <span className="text-white">2pt Outcome / 3pt Score</span></li>
      <li>Semis: <span className="text-white">3pt Outcome / 4pt Score</span></li>
      <li>Bronze: <span className="text-white">4pt Outcome / 5pt Score</span></li>
      <li>Final: <span className="text-white">5pt Outcome / 6pt Score</span></li>
    </ul>
  );
}

function RulesPage() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
      <section>
        <h3 className="text-emerald-400 font-black uppercase italic mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Scoring Engine</h3>
        <ScoreRulesList />
      </section>
      <section className="bg-black/40 p-6 rounded-2xl border border-white/5">
        <h3 className="text-amber-400 font-black uppercase text-[10px] mb-2 tracking-widest">Penalties Bonus</h3>
        <p className="text-xs text-slate-400 leading-relaxed italic">In knockout stages, if a match ends in a draw after 120 minutes, you get <span className="text-white">+1 bonus point</span> if you correctly guessed the penalty winner, regardless of your match score guess.</p>
      </section>
      <section className="bg-black/40 p-6 rounded-2xl border border-white/5">
        <h3 className="text-amber-400 font-black uppercase text-[10px] mb-2 tracking-widest">Tie-Breaking</h3>
        <p className="text-xs text-slate-400 leading-relaxed italic">If points are tied, the player whose "Total Goals" prediction is closest to the real tournament total (including injury time/extra time) wins.</p>
      </section>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ e: "", p: "" });
  const [err, setErr] = useState("");

  const handle = async (e: any) => {
    e.preventDefault();
    const { error } = mode === 'signup' ? await supabase.auth.signUp({ email: form.e, password: form.p }) : await supabase.auth.signInWithPassword({ email: form.e, password: form.p });
    if (error) setErr(error.message);
  };

  return (
    <div className="min-h-screen bg-[#07090d] grid place-items-center p-4">
      <div className="w-full max-w-sm text-center">
        <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic italic">World Cup <span className="text-emerald-400">2026</span></h1>
        <form onSubmit={handle} className="mt-8 space-y-3">
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none focus:border-emerald-400" onChange={(e) => setForm({...form, e: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none focus:border-emerald-400" onChange={(e) => setForm({...form, p: e.target.value})} />
          <button type="submit" className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:scale-[1.02] transition-all">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        {err && <p className="text-rose-400 text-[10px] font-bold mt-4 uppercase">{err}</p>}
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">{mode === 'login' ? 'Need an account? Sign Up' : 'Already have one? Sign In'}</button>
      </div>
    </div>
  );
}

function UsernameSetup({ userId, onComplete }: any) {
  const [name, setName] = useState("");
  const save = async () => {
    if (name.length < 3) return alert("Min 3 characters!");
    const { error } = await supabase.from("profiles").upsert({ id: userId, username: name });
    if (!error) onComplete();
  };
  return (
    <div className="min-h-screen bg-[#07090d] grid place-items-center p-4">
      <div className="text-center w-full max-w-sm">
        <h2 className="text-2xl font-black text-white mb-6 uppercase italic">Choose Player Name</h2>
        <input type="text" placeholder="Zlatan" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center focus:border-emerald-400 outline-none font-bold" />
        <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase mt-6 tracking-widest">Start Tournament</button>
      </div>
    </div>
  );
}
