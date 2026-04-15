"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Shield, Settings, LogOut, CheckCircle, BookOpen, Clock, Globe, Timer } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
const ADMIN_EMAIL = "fariz.syed@gmail.com";
const TOURNAMENT_START = new Date("2026-06-11T21:00:00+02:00");

// Extensive Flag Mapping
const getFlag = (team: string) => {
  if (!team || team.toUpperCase().includes("TBA")) return "https://flagcdn.com/w40/un.png";
  const name = team.toLowerCase().trim();
  const map: any = {
    "usa": "us", "mexico": "mx", "mexiko": "mx", "canada": "ca", "kanada": "ca",
    "argentina": "ar", "brazil": "br", "brasilien": "br", "france": "fr", "frankrike": "fr",
    "england": "gb-eng", "spain": "es", "spanien": "es", "germany": "de", "tyskland": "de",
    "portugal": "pt", "netherlands": "nl", "nederländerna": "nl", "belgium": "be", "belgien": "be",
    "italy": "it", "italien": "it", "croatia": "hr", "kroatien": "hr", "denmark": "dk", "danmark": "dk",
    "norway": "no", "norge": "no", "sweden": "se", "sverige": "se", "poland": "pl", "polen": "pl",
    "serbia": "rs", "serbien": "rs", "switzerland": "ch", "schweiz": "ch", "austria": "at", "österrike": "at",
    "turkey": "tr", "turkiet": "tr", "ukraine": "ua", "ukraina": "ua", "scotland": "gb-sct", "skottland": "gb-sct",
    "wales": "gb-wls", "hungary": "hu", "ungern": "hu", "greece": "gr", "grekland": "gr", "czech republic": "cz", "tjeckien": "cz",
    "uruguay": "uy", "colombia": "co", "chile": "cl", "ecuador": "ec", "peru": "pe", "paraguay": "py", "venezuela": "ve",
    "morocco": "ma", "marocko": "ma", "senegal": "sn", "nigeria": "ng", "egypt": "eg", "egypten": "eg",
    "ghana": "gh", "cameroon": "cm", "kamerun": "cm", "algeria": "dz", "algeriet": "dz", "tunisia": "tn", "tunisien": "tn",
    "ivory coast": "ci", "elfenbenskusten": "ci", "south africa": "za", "sydafrika": "za",
    "japan": "jp", "south korea": "kr", "sydkorea": "kr", "australia": "au", "australien": "au",
    "saudi arabia": "sa", "saudiarabien": "sa", "iran": "ir", "iraq": "iq", "irak": "iq", "qatar": "qa",
    "costa rica": "cr", "panama": "pa", "jamaica": "jm"
  };
  const code = map[name] || "un";
  return `https://flagcdn.com/w40/${code}.png`;
};

const COUNTRIES = [
  "Algeria", "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Cameroon", "Canada", "Chile", 
  "Colombia", "Costa Rica", "Croatia", "Czech Republic", "Denmark", "Ecuador", "Egypt", "England", 
  "France", "Germany", "Ghana", "Greece", "Hungary", "Iceland", "Iran", "Iraq", "Italy", "Ivory Coast", 
  "Japan", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Panama", "Paraguay", 
  "Peru", "Poland", "Portugal", "Saudi Arabia", "Scotland", "Senegal", "Serbia", "South Korea", 
  "Spain", "Sweden", "Switzerland", "Tunisia", "Turkey", "Ukraine", "Uruguay", "USA", "Wales"
].sort();

// --- COUNTDOWN COMPONENT ---
function CountdownTimer({ targetDate, label }: { targetDate: Date, label: string }) {
  const [timeLeft, setTimeLeft] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance < 0) {
        setTimeLeft("LOCKED");
        clearInterval(timer);
      } else {
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ d, h, m, s });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center mb-6 shadow-lg shadow-emerald-500/5">
      <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-[0.2em]">{label}</p>
      {timeLeft === "LOCKED" ? (
        <span className="text-rose-500 font-black uppercase text-sm italic tracking-widest flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Locked
        </span>
      ) : (
        <div className="flex gap-4 text-white font-black italic">
          <TimeBlock unit="Days" val={timeLeft.d} />
          <TimeBlock unit="Hours" val={timeLeft.h} />
          <TimeBlock unit="Mins" val={timeLeft.m} />
          <TimeBlock unit="Secs" val={timeLeft.s} />
        </div>
      )}
    </div>
  );
}

function TimeBlock({ unit, val }: any) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl leading-none tabular-nums tracking-tighter">{val.toString().padStart(2, '0')}</span>
      <span className="text-[8px] text-slate-500 not-italic uppercase font-bold mt-1 tracking-widest">{unit}</span>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function WorldCupApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("matches"); 
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

  if (loading) return <div className="min-h-screen bg-[#07090d] grid place-items-center text-emerald-400 font-black uppercase italic tracking-widest">Loading...</div>;
  if (!user) return <AuthScreen />;
  if (!profile?.username) return <UsernameSetup userId={user.id} onComplete={() => fetchProfile(user.id)} />;

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-200 font-sans pb-20">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-emerald-500 w-5 h-5" />
          <h1 className="font-black text-xl text-white uppercase italic tracking-tighter">World Cup <span className="text-emerald-400">2026</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[8px] text-slate-500 uppercase font-black leading-none tracking-widest">Points</p>
            <p className="text-amber-400 font-black text-xl leading-none">{profile?.total_points || 0}</p>
          </div>
          {user?.email === ADMIN_EMAIL && <Shield onClick={() => setView("admin")} className="cursor-pointer hover:text-amber-400 w-5 h-5" />}
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

function MatchList({ matches, tab, setTab, userId }: any) {
  const now = new Date();
  
  // Find the first match of the current tab to use as the lock time
  const firstMatchOfTab = matches.find((m: any) => m.phase === tab);
  const lockTime = tab === 1 ? TOURNAMENT_START : (firstMatchOfTab ? new Date(firstMatchOfTab.kickoff_time) : TOURNAMENT_START);
  const isLocked = now > lockTime;

  return (
    <>
      <CountdownTimer targetDate={lockTime} label={`Locking ${tab === 1 ? "Group Stages" : tab === 2 ? "Knockout 1/16 - 1/4" : "Semis & Finals"} in`} />
      
      <div className="flex gap-4 mb-8 border-b border-white/5 overflow-x-auto pb-2">
        <PhaseTab id={1} label="Group Stages" active={tab === 1} onClick={setTab} />
        <PhaseTab id={2} label="Knockout 1/16 - 1/4" active={tab === 2} onClick={setTab} />
        <PhaseTab id={3} label="Semis & Finals" active={tab === 3} onClick={setTab} />
      </div>
      <div className="grid gap-4">
        {matches.filter((m: any) => m.phase === tab).map((m: any) => (
          <MatchCard key={m.id} match={m} userId={userId} locked={isLocked} />
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

  return (
    <div className={`bg-white/5 border rounded-2xl p-6 transition-all ${locked ? "border-white/5 opacity-80" : "border-white/10 hover:border-emerald-500/30"}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
          {locked && <Clock className="w-3 h-3 text-rose-500" />}
          {new Date(match.kickoff_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{match.channel}</span>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
          <img src={getFlag(match.home_team)} className="w-10 h-6 object-cover rounded shadow-md" alt="" />
          <span className="font-black text-xs uppercase text-center truncate w-full tracking-tight">{match.home_team}</span>
        </div>
        
        <div className="flex gap-2">
          <input type="number" min="0" disabled={locked} value={pred.h} onBlur={save} onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
            onChange={(e) => setPred({...pred, h: e.target.value.replace(/[^0-9]/g, "")})} 
            className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:border-emerald-400 outline-none disabled:text-slate-600" placeholder="-" 
          />
          <input type="number" min="0" disabled={locked} value={pred.a} onBlur={save} onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
            onChange={(e) => setPred({...pred, a: e.target.value.replace(/[^0-9]/g, "")})} 
            className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:border-emerald-400 outline-none disabled:text-slate-600" placeholder="-" 
          />
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
          <img src={getFlag(match.away_team)} className="w-10 h-6 object-cover rounded shadow-md" alt="" />
          <span className="font-black text-xs uppercase text-center truncate w-full tracking-tight">{match.away_team}</span>
        </div>
      </div>

      {pred.h !== "" && pred.h === pred.a && match.phase > 1 && !locked && (
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 italic">Penalty Winner Bonus (+1pt)</p>
          <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
            <button onClick={() => {setPred({...pred, pw: 'home'}); save();}} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${pred.pw === 'home' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500"}`}>{match.home_team}</button>
            <button onClick={() => {setPred({...pred, pw: 'away'}); save();}} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${pred.pw === 'away' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500"}`}>{match.away_team}</button>
          </div>
        </div>
      )}
      {saved && <div className="mt-2 text-center text-[9px] text-emerald-400 font-black uppercase italic tracking-tighter">Prediction Saved</div>}
    </div>
  );
}

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
    <div className="space-y-6">
      <CountdownTimer targetDate={TOURNAMENT_START} label="Bonus Questions Lock In" />
      
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-amber-400 font-black text-xl mb-6 flex items-center gap-2 uppercase italic underline decoration-emerald-500 tracking-tight">Tournament Bonus</h2>
        <div className="space-y-6">
          <BonusField label="Top Scorer" value={form.scorer} onChange={(v) => setForm({...form, scorer: v})} disabled={locked} />
          <BonusField label="Top Assister" value={form.assister} onChange={(v) => setForm({...form, assister: v})} disabled={locked} />
          
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Team with Most Cards</p>
            <select 
              disabled={locked} value={form.cards} onChange={(e) => setForm({...form, cards: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 outline-none font-bold appearance-none cursor-pointer"
            >
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <BonusField label="Tournament MVP" value={form.mvp} onChange={(v) => setForm({...form, mvp: v})} disabled={locked} />
          <BonusField label="Total Goals Scored" value={form.goals} onChange={(v) => setForm({...form, goals: v.replace(/[^0-9]/g, "")})} disabled={locked} type="number" />
          
          {!locked && <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-widest mt-4 shadow-lg shadow-emerald-500/10 hover:scale-[1.01] transition-all">Save Predictions</button>}
          {saved && <p className="text-center text-[10px] text-emerald-400 font-black italic mt-2 uppercase">Saved successfully!</p>}
        </div>
      </div>
    </div>
  );
}

function BonusField({ label, value, onChange, disabled, type="text" }: any) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">{label}</p>
      <input 
        type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => type === 'number' && (e.key === '-' || e.key === 'e') && e.preventDefault()}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 outline-none font-bold"
      />
    </div>
  );
}

function Leaderboard() {
  const [list, setList] = useState([]);
  useEffect(() => {
    supabase.from("profiles").select("*").order("total_points", { ascending: false }).then(({ data }) => setList(data as any || []));
  }, []);
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
      <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span>Player</span>
        <span>Points</span>
      </div>
      {list.map((p: any, i) => (
        <div key={p.id} className={`p-6 flex justify-between items-center ${i < 3 ? "bg-emerald-500/5" : ""}`}>
          <div className="flex items-center gap-4">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black ${i === 0 ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" : "bg-white/10"}`}>{i + 1}</span>
            <span className="font-black uppercase tracking-tighter text-lg">{p.username}</span>
          </div>
          <span className="text-amber-400 font-black text-2xl tracking-tighter italic">{p.total_points}</span>
        </div>
      ))}
    </div>
  );
}

function AdminPanel({ matches }: any) {
  const [scores, setScores] = useState<any>({});
  const [totalGoalsActual, setTotalGoalsActual] = useState("");

  const settleMatch = async (m: any) => {
    const s = scores[m.id];
    if (!s || s.h === "" || s.a === "") return alert("Enter scores first!");
    
    const { data: preds } = await supabase.from("predictions").select("*").eq("match_id", m.id);
    if (!preds) return;

    for (const p of preds) {
      let pts = 0;
      const actualH = parseInt(s.h);
      const actualA = parseInt(s.a);
      
      const isExact = p.pred_home === actualH && p.pred_away === actualA;
      const isOutcome = (Math.sign(p.pred_home - p.pred_away) === Math.sign(actualH - actualA));
      
      if (m.sub_phase === 'group') { pts = isExact ? 2 : (isOutcome ? 1 : 0); } 
      else if (m.sub_phase === 'r16' || m.sub_phase === 'quarter') { pts = isExact ? 3 : (isOutcome ? 2 : 0); } 
      else if (m.sub_phase === 'semi') { pts = isExact ? 4 : (isOutcome ? 3 : 0); } 
      else if (m.sub_phase === 'bronze') { pts = isExact ? 5 : (isOutcome ? 4 : 0); } 
      else if (m.sub_phase === 'final') { pts = isExact ? 6 : (isOutcome ? 5 : 0); }

      if (m.phase > 1 && actualH === actualA && p.penalty_winner_pred === s.pw) { pts += 1; }

      if (pts > 0) { await supabase.rpc('increment_points', { user_id: p.user_id, amount: pts }); }
    }

    await supabase.from("matches").update({ home_score: s.h, away_score: s.a, penalty_winner_actual: s.pw, settled: true }).eq("id", m.id);
    alert(`Match Settled! Points calculated for ${preds.length} users.`);
  };

  const settleTotalGoals = async () => {
    const actual = parseInt(totalGoalsActual);
    if (isNaN(actual)) return alert("Enter actual total goals first!");
    const { data: preds } = await supabase.from("bonus_predictions").select("*");
    if (!preds) return;
    let minDiff = Math.min(...preds.map(p => Math.abs(p.total_goals_guess - actual)));
    for (const p of preds) {
      const diff = Math.abs(p.total_goals_guess - actual);
      const pts = diff === 0 ? 10 : (diff === minDiff ? 5 : 0);
      if (pts > 0) await supabase.rpc('increment_points', { user_id: p.user_id, amount: pts });
    }
    alert("Total Goals points settled for winners!");
  };

  return (
    <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6">
      <h2 className="text-amber-400 font-black text-xl mb-6 flex items-center gap-2 uppercase italic underline"><Shield className="w-5 h-5" /> Admin Settlement</h2>
      <div className="mb-8 p-4 bg-black/40 rounded-xl border border-white/5">
        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Final Tournament Total Goals</p>
        <div className="flex gap-2">
          <input type="number" value={totalGoalsActual} onChange={(e) => setTotalGoalsActual(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 font-bold" placeholder="Final Total" />
          <button onClick={settleTotalGoals} className="bg-amber-400 text-black px-6 rounded-lg font-black uppercase text-[10px] shadow-lg shadow-amber-400/10 hover:scale-[1.02] transition-all">Settle</button>
        </div>
      </div>
      <div className="space-y-4">
        {matches.filter((m: any) => !m.settled).map((m: any) => (
          <div key={m.id} className="p-4 bg-black/40 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-tight">{m.home_team} vs {m.away_team}</span>
              <button onClick={() => settleMatch(m)} className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-black uppercase text-[9px] hover:scale-[1.02] transition-all italic">Settle Match</button>
            </div>
            <div className="flex gap-2">
              <input type="number" placeholder="H" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], h: e.target.value}})} />
              <input type="number" placeholder="A" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], a: e.target.value}})} />
              {m.phase > 1 && (
                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[9px]" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], pw: e.target.value}})}>
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

function RulesPage() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-10">
      <section>
        <h3 className="text-emerald-400 font-black uppercase italic mb-4 flex items-center gap-2 underline tracking-widest italic"><Globe className="w-4 h-4" /> Scoring Engine</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Group Stages</span> 1pt Outcome / 2pt Score</li>
          <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">R16 & Quarters</span> 2pt Outcome / 3pt Score</li>
          <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Semifinals</span> 3pt Outcome / 4pt Score</li>
          <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Bronze Match</span> 4pt Outcome / 5pt Score</li>
          <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">The Final</span> 5pt Outcome / 6pt Score</li>
        </ul>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20">
          <h3 className="text-emerald-400 font-black uppercase text-[10px] mb-3 tracking-widest italic underline">Penalties Bonus</h3>
          <p className="text-xs text-slate-400 leading-relaxed italic font-medium">In knockouts, if it's a draw after 120m, get <span className="text-white font-bold">+1 bonus point</span> for the correct Penalty Winner.</p>
        </section>
        <section className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/20">
          <h3 className="text-amber-400 font-black uppercase text-[10px] mb-3 tracking-widest italic underline">Total Goals Bonus</h3>
          <p className="text-xs text-slate-400 leading-relaxed italic font-medium"><span className="text-white font-bold">10 Points</span> for exactly right. <span className="text-white font-bold">5 Points</span> for the closest guess (shared among winners).</p>
        </section>
      </div>
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
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">World Cup <span className="text-emerald-400">2026</span></h1>
        <form onSubmit={handle} className="mt-8 space-y-3">
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none focus:border-emerald-400 font-bold" onChange={(e) => setForm({...form, e: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none focus:border-emerald-400 font-bold" onChange={(e) => setForm({...form, p: e.target.value})} />
          <button type="submit" className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:scale-[1.02] transition-all italic">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        {err && <p className="text-rose-400 text-[10px] font-bold mt-4 uppercase italic">{err}</p>}
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-6 text-[10px] font-black uppercase text-slate-500 tracking-widest underline decoration-white/10 italic">{mode === 'login' ? 'Need an account? Sign Up' : 'Already have one? Sign In'}</button>
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
        <h2 className="text-2xl font-black text-white mb-6 uppercase italic tracking-widest underline decoration-emerald-500">Choose Player Name</h2>
        <input type="text" placeholder="e.g. Zlatan" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center focus:border-emerald-400 outline-none font-bold italic" />
        <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase mt-6 tracking-widest shadow-lg shadow-emerald-500/10 italic">Start Tournament</button>
      </div>
    </div>
  );
}
