"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Shield, Settings, LogOut, CheckCircle, BookOpen, Clock, Globe, AlertCircle, Lock, Users, Sparkles, ListOrdered, GitMerge, Goal } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
const ADMIN_EMAIL = "fariz.syed@gmail.com";
const TOURNAMENT_START = new Date("2026-06-11T21:00:00+02:00");

// Flags
const getFlag = (team: string) => {
  if (!team || team.toUpperCase().includes("WINNER") || team.toUpperCase().includes("RUNNER") || team.toUpperCase().includes("TBA") || team.toUpperCase().includes("LOSER") || team.toUpperCase().includes("GROUP") || team.toUpperCase().includes("3RD")) {
    return null;
  }
  const name = team.toLowerCase().trim();
  const map: any = {
    "usa": "us", "mexico": "mx", "canada": "ca", "argentina": "ar", "brazil": "br", "france": "fr",
    "england": "gb-eng", "spain": "es", "germany": "de", "portugal": "pt", "netherlands": "nl",
    "belgium": "be", "italy": "it", "croatia": "hr", "denmark": "dk", "norway": "no", "sweden": "se",
    "poland": "pl", "serbia": "rs", "switzerland": "ch", "austria": "at", "turkey": "tr", "ukraine": "ua",
    "scotland": "gb-sct", "wales": "gb-wls", "hungary": "hu", "greece": "gr", "czech republic": "cz",
    "uruguay": "uy", "colombia": "co", "chile": "cl", "ecuador": "ec", "peru": "pe", "paraguay": "py",
    "venezuela": "ve", "morocco": "ma", "senegal": "sn", "nigeria": "ng", "egypt": "eg", "ghana": "gh",
    "cameroon": "cm", "algeria": "dz", "tunisia": "tn", "ivory coast": "ci", "south africa": "za",
    "japan": "jp", "south korea": "kr", "australia": "au", "saudi arabia": "sa", "iran": "ir", "qatar": "qa"
  };
  const code = map[name];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
};

const COUNTRIES = ["Algeria", "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Cameroon", "Canada", "Chile", "Colombia", "Costa Rica", "Croatia", "Czech Republic", "Denmark", "Ecuador", "Egypt", "England", "France", "Germany", "Ghana", "Greece", "Hungary", "Iceland", "Iran", "Iraq", "Italy", "Ivory Coast", "Japan", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Panama", "Paraguay", "Peru", "Poland", "Portugal", "Saudi Arabia", "Scotland", "Senegal", "Serbia", "South Korea", "Spain", "Sweden", "Switzerland", "Tunisia", "Turkey", "Ukraine", "Uruguay", "USA", "Wales"].sort();

export default function WorldCupApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("bonus"); 
  const [bonusCompleted, setBonusCompleted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState(1);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        checkBonusStatus(session.user.id);
      }
      setLoading(false);
    });
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    setProfile(data);
  };

  const checkBonusStatus = async (id: string) => {
    const { data } = await supabase.from("bonus_predictions").select("user_id").eq("user_id", id).single();
    if (data) setBonusCompleted(true);
  };

  useEffect(() => {
    supabase.from("matches").select("*").order("kickoff_time", { ascending: true }).then(({ data }) => setMatches(data as any || []));
  }, [view]);

  if (loading) return <div className="min-h-screen bg-[#07090d] grid place-items-center text-emerald-400 font-black uppercase italic tracking-widest animate-pulse">Loading World Cup...</div>;
  if (!user) return <AuthScreen />;
  if (!profile?.username) return <UsernameSetup userId={user.id} onComplete={() => { setShowWelcome(true); fetchProfile(user.id); }} />;

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-200 font-sans pb-20">
      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
      
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

      <nav className="max-w-5xl mx-auto px-4 mt-6 flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => bonusCompleted && setView("matches")} 
          className={`flex-1 min-w-[110px] py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition flex items-center justify-center gap-2 ${view === "matches" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500"} ${!bonusCompleted && "opacity-40 cursor-not-allowed"}`}
        >
          {!bonusCompleted && <Lock className="w-2.5 h-2.5" />} Matches
        </button>
        <NavBtn active={view === "bonus"} onClick={() => setView("bonus")} label="Bonus" />
        <NavBtn active={view === "stats"} onClick={() => setView("stats")} label="Stats" />
        <NavBtn active={view === "leaderboard"} onClick={() => setView("leaderboard")} label="Leaderboard" />
        <NavBtn active={view === "rules"} onClick={() => setView("rules")} label="Rules" />
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {view === "matches" && <MatchList matches={matches} tab={tab} setTab={setTab} userId={user.id} />}
        {view === "bonus" && <BonusPage userId={user.id} isCompleted={bonusCompleted} onSaved={() => setBonusCompleted(true)} />}
        {view === "stats" && <StatsPage matches={matches} />}
        {view === "leaderboard" && <Leaderboard />}
        {view === "rules" && <RulesPage />}
        {view === "admin" && <AdminPanel matches={matches} />}
      </main>
    </div>
  );
}

// --- STATS PAGE ---
function StatsPage({ matches }: { matches: any[] }) {
  const [subTab, setSubTab] = useState(1);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("tournament_players").select("*").order("goals", { ascending: false }).then(({ data }) => setPlayers(data || []));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide">
        <button onClick={() => setSubTab(1)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition ${subTab === 1 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Standings Group Stage</button>
        <button onClick={() => setSubTab(2)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition ${subTab === 2 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Knockout Bracket</button>
        <button onClick={() => setSubTab(3)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition ${subTab === 3 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Top Scorers & Assists</button>
      </div>

      {subTab === 1 && <StandingsTable matches={matches} />}
      {subTab === 2 && <KnockoutBracket matches={matches} />}
      {subTab === 3 && <TopPerformers players={players} />}
    </div>
  );
}

function StandingsTable({ matches }: { matches: any[] }) {
  const groups = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L'];
  
  const calculateGroup = (groupName: string) => {
    const table: any = {};
    const groupMatches = matches.filter(m => m.group_name === groupName && m.settled);
    
    // Initialize teams from matches in this group
    const groupTeams = Array.from(new Set(matches.filter(m => m.group_name === groupName).flatMap(m => [m.home_team, m.away_team])));
    groupTeams.forEach(t => table[t] = { name: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });

    groupMatches.forEach(m => {
      const h = table[m.home_team];
      const a = table[m.away_team];
      h.p++; a.p++;
      h.gf += m.home_score; h.ga += m.away_score;
      a.gf += m.away_score; a.ga += m.home_score;
      if (m.home_score > m.away_score) { h.w++; h.pts += 3; a.l++; }
      else if (m.home_score < m.away_score) { a.w++; a.pts += 3; h.l++; }
      else { h.d++; a.d++; h.pts += 1; a.pts += 1; }
      h.gd = h.gf - h.ga; a.gd = a.gf - a.ga;
    });

    return Object.values(table).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {groups.map(g => (
        <div key={g} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="bg-emerald-500/10 px-4 py-2 border-b border-white/5">
            <span className="text-[10px] font-black uppercase text-emerald-400 italic">{g}</span>
          </div>
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="text-slate-500 border-b border-white/5 uppercase">
                <th className="px-4 py-2">Team</th>
                <th className="py-2 text-center">P</th>
                <th className="py-2 text-center">GD</th>
                <th className="py-2 text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {calculateGroup(g).map((t: any, i) => (
                <tr key={t.name} className={`border-b border-white/5 last:border-0 ${i < 2 ? "bg-emerald-500/5" : ""}`}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <img src={getFlag(t.name) || ""} className="w-4 h-2.5 object-cover rounded-sm" alt="" />
                    <span className="font-bold text-white uppercase">{t.name}</span>
                  </td>
                  <td className="text-center font-bold text-slate-400">{t.p}</td>
                  <td className="text-center font-bold text-slate-400">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                  <td className="text-center font-black text-emerald-400">{t.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function KnockoutBracket({ matches }: { matches: any[] }) {
  const renderMatch = (subPhase: string, title: string) => {
    const mList = matches.filter(m => m.sub_phase === subPhase);
    return (
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">{title}</p>
        {mList.map(m => (
          <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 min-w-[180px]">
            <div className="flex justify-between items-center">
              <span className={`text-[10px] font-bold uppercase flex items-center gap-2 ${m.settled && m.home_score > m.away_score ? "text-emerald-400" : "text-slate-400"}`}>
                <img src={getFlag(m.home_team) || ""} className="w-3 h-2" alt="" /> {m.home_team}
              </span>
              <span className="font-black text-white">{m.settled ? m.home_score : "-"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-[10px] font-bold uppercase flex items-center gap-2 ${m.settled && m.away_score > m.home_score ? "text-emerald-400" : "text-slate-400"}`}>
                <img src={getFlag(m.away_team) || ""} className="w-3 h-2" alt="" /> {m.away_team}
              </span>
              <span className="font-black text-white">{m.settled ? m.away_score : "-"}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 overflow-x-auto">
      <div className="flex gap-12 min-w-[1000px] justify-between items-start">
        {renderMatch('r16', 'Round of 16')}
        {renderMatch('quarter', 'Quarter Finals')}
        {renderMatch('semi', 'Semi Finals')}
        <div className="space-y-12">
          {renderMatch('bronze', '3rd Place')}
          {renderMatch('final', 'The Final')}
        </div>
      </div>
    </div>
  );
}

function TopPerformers({ players }: { players: any[] }) {
  const scorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 10);
  const assisters = [...players].sort((a, b) => b.assists - a.assists).slice(0, 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <h3 className="p-6 text-xl font-black text-emerald-400 uppercase italic flex items-center gap-3">
          <Goal className="w-6 h-6" /> Golden Boot
        </h3>
        {scorers.map((p, i) => (
          <div key={p.id} className="px-6 py-4 flex justify-between items-center border-t border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-black italic w-4">{i + 1}</span>
              <div>
                <p className="font-black text-white uppercase leading-none">{p.name}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{p.team}</p>
              </div>
            </div>
            <span className="text-2xl font-black text-emerald-400 italic">{p.goals}</span>
          </div>
        ))}
      </section>

      <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <h3 className="p-6 text-xl font-black text-amber-400 uppercase italic flex items-center gap-3">
          <Star className="w-6 h-6" /> Assist Kings
        </h3>
        {assisters.map((p, i) => (
          <div key={p.id} className="px-6 py-4 flex justify-between items-center border-t border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-black italic w-4">{i + 1}</span>
              <div>
                <p className="font-black text-white uppercase leading-none">{p.name}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{p.team}</p>
              </div>
            </div>
            <span className="text-2xl font-black text-amber-400 italic">{p.assists}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

// --- ADMIN PANEL ADDITIONS ---
function AdminPanel({ matches }: any) {
  const [scores, setScores] = useState<any>({});
  const [newPlayer, setNewPlayer] = useState({ name: "", team: "", goals: 0, assists: 0 });

  const addPlayer = async () => {
    if (!newPlayer.name || !newPlayer.team) return alert("Fill in name and team!");
    await supabase.from("tournament_players").insert(newPlayer);
    alert("Player added/updated!");
  };

  const settleMatch = async (m: any) => {
    const s = scores[m.id];
    if (!s || s.h === "" || s.a === "") return alert("Enter scores!");
    const { data: preds } = await supabase.from("predictions").select("*").eq("match_id", m.id);
    if (!preds) return;
    for (const p of preds) {
      let pts = 0;
      const actH = parseInt(s.h);
      const actA = parseInt(s.a);
      const isExact = p.pred_home === actH && p.pred_away === actA;
      const isOutcome = (Math.sign(p.pred_home - p.pred_away) === Math.sign(actH - actA));
      if (m.sub_phase === 'group') pts = isExact ? 2 : (isOutcome ? 1 : 0);
      else if (['r32', 'r16', 'quarter'].includes(m.sub_phase)) pts = isExact ? 3 : (isOutcome ? 2 : 0);
      else if (m.sub_phase === 'semi') pts = isExact ? 4 : (isOutcome ? 3 : 0);
      else if (m.sub_phase === 'bronze') pts = isExact ? 5 : (isOutcome ? 4 : 0);
      else if (m.sub_phase === 'final') pts = isExact ? 6 : (isOutcome ? 5 : 0);
      if (m.phase > 1 && actH === actA && p.penalty_winner_pred === s.pw) pts += 1;
      if (pts > 0) await supabase.rpc('increment_points', { user_id: p.user_id, amount: pts });
    }
    await supabase.from("matches").update({ home_score: s.h, away_score: s.a, penalty_winner_actual: s.pw, settled: true }).eq("id", m.id);
    alert(`Match Settled!`);
  };

  return (
    <div className="space-y-8">
      <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6">
        <h2 className="text-amber-400 font-black text-xl mb-6 uppercase italic underline flex items-center gap-2"><Shield className="w-5 h-5" /> Admin: Match Scores</h2>
        <div className="space-y-4">
          {matches.filter((m: any) => !m.settled).map((m: any) => (
            <div key={m.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-tight">{m.home_team} vs {m.away_team} ({m.sub_phase})</span>
              <div className="flex gap-2">
                <input type="number" placeholder="H" className="w-10 bg-white/5 rounded p-1 text-center" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], h: e.target.value}})} />
                <input type="number" placeholder="A" className="w-10 bg-white/5 rounded p-1 text-center" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], a: e.target.value}})} />
                <button onClick={() => settleMatch(m)} className="bg-emerald-500 text-black px-4 py-1 rounded font-black uppercase text-[9px]">Settle</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-2xl p-6">
        <h2 className="text-emerald-400 font-black text-xl mb-6 uppercase italic underline flex items-center gap-2"><Users className="w-5 h-5" /> Admin: Player Stats</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Player Name" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm" onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})} />
          <input type="text" placeholder="Team" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm" onChange={(e) => setNewPlayer({...newPlayer, team: e.target.value})} />
          <input type="number" placeholder="Goals" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm" onChange={(e) => setNewPlayer({...newPlayer, goals: parseInt(e.target.value) || 0})} />
          <input type="number" placeholder="Assists" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm" onChange={(e) => setNewPlayer({...newPlayer, assists: parseInt(e.target.value) || 0})} />
        </div>
        <button onClick={addPlayer} className="w-full bg-emerald-500 text-black py-3 rounded-xl font-black uppercase text-xs tracking-widest">Update Player Database</button>
      </div>
    </div>
  );
}

// --- REMAINING COMPONENTS ---

function NavBtn({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`flex-1 min-w-[100px] py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition ${active ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-slate-300"}`}>
      {label}
    </button>
  );
}

function WelcomePopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl grid place-items-center p-6">
      <div className="bg-[#0f1117] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full relative shadow-2xl text-center">
        <Sparkles className="text-amber-400 w-12 h-12 mb-6 mx-auto animate-pulse" />
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">Welcome to the <br/><span className="text-emerald-400">Cup League</span></h2>
        <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
          <p>Predict match scores and nail your tournament bonuses to win. Correct scores earn the most points, so choose wisely!</p>
          <div className="bg-emerald-500/10 text-emerald-400 font-bold p-4 rounded-2xl border border-emerald-500/20 text-xs uppercase tracking-tight">
            ⚠️ FIRST STEP: You must complete your <span className="underline italic">Bonus Predictions</span>. The Matches tab will unlock once you save them!
          </div>
        </div>
        <button onClick={onClose} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase mt-10 tracking-[0.2em] text-xs hover:scale-[1.02] transition-all">Let's Get Started</button>
      </div>
    </div>
  );
}

function MatchList({ matches, tab, setTab, userId }: any) {
  const now = new Date();
  const groupEnd = matches.filter((m: any) => m.sub_phase === 'group').slice(-1)[0];
  const r32End = matches.filter((m: any) => m.sub_phase === 'r32').slice(-1)[0];
  const r16End = matches.filter((m: any) => m.sub_phase === 'r16').slice(-1)[0];
  const sfEnd = matches.filter((m: any) => m.sub_phase === 'semi').slice(-1)[0];

  const firstR32 = matches.find((m: any) => m.sub_phase === 'r32');
  const firstR16 = matches.find((m: any) => m.sub_phase === 'r16');
  const firstQF = matches.find((m: any) => m.sub_phase === 'quarter');
  const firstFinal = matches.find((m: any) => m.sub_phase === 'bronze' || m.sub_phase === 'final');

  let lockTime: Date | null = null;
  let isPending = false;
  let matchesLocked = false;
  let filtered = [];

  if (tab === 1) { lockTime = TOURNAMENT_START; matchesLocked = now > TOURNAMENT_START; filtered = matches.filter((m: any) => m.sub_phase === 'group'); } 
  else if (tab === 2) { if (groupEnd && now < new Date(groupEnd.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = firstR32 ? new Date(firstR32.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } filtered = matches.filter((m: any) => m.sub_phase === 'r32'); } 
  else if (tab === 3) { if (r32End && now < new Date(r32End.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = firstR16 ? new Date(firstR16.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } filtered = matches.filter((m: any) => m.sub_phase === 'r16'); } 
  else if (tab === 4) { if (r16End && now < new Date(r16End.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = firstQF ? new Date(firstQF.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } filtered = matches.filter((m: any) => m.sub_phase === 'quarter' || m.sub_phase === 'semi'); } 
  else if (tab === 5) { if (sfEnd && now < new Date(sfEnd.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = firstFinal ? new Date(firstFinal.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } filtered = matches.filter((m: any) => m.sub_phase === 'bronze' || m.sub_phase === 'final'); }

  const roundLabels = ["", "Group Stage", "Round of 32", "Round of 16", "Quarter & Semi Finals", "Gold & Bronze Finals"];

  return (
    <>
      <CountdownTimer targetDate={lockTime} label={`Locking ${roundLabels[tab]} in`} isPending={isPending} />
      <div className="flex gap-4 mb-8 border-b border-white/5 overflow-x-auto pb-2 scrollbar-hide">
        <PhaseTab id={1} label="Group Stage" active={tab === 1} onClick={setTab} />
        <PhaseTab id={2} label="Round of 32" active={tab === 2} onClick={setTab} />
        <PhaseTab id={3} label="Round of 16" active={tab === 3} onClick={setTab} />
        <PhaseTab id={4} label="Quarter & Semi Finals" active={tab === 4} onClick={setTab} />
        <PhaseTab id={5} label="Gold & Bronze Finals" active={tab === 5} onClick={setTab} />
      </div>
      <div className="grid gap-4">
        {filtered.map((m: any) => <MatchCard key={m.id} match={m} userId={userId} locked={matchesLocked} isPending={isPending} />)}
      </div>
    </>
  );
}

function PhaseTab({ id, label, active, onClick }: any) {
  return (
    <button onClick={() => onClick(id)} className={`whitespace-nowrap pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${active ? "border-b-2 border-emerald-400 text-white" : "text-slate-600"}`}>{label}</button>
  );
}

function MatchCard({ match, userId, locked, isPending }: any) {
  const [pred, setPred] = useState({ h: "", a: "", pw: "" });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    supabase.from("predictions").select("*").eq("user_id", userId).eq("match_id", match.id).single().then(({ data }) => data && setPred({ h: data.pred_home.toString(), a: data.pred_away.toString(), pw: data.penalty_winner_pred || "" }));
  }, [match.id, userId]);
  const save = async () => {
    if (locked || pred.h === "" || pred.a === "") return;
    await supabase.from("predictions").upsert({ user_id: userId, match_id: match.id, pred_home: parseInt(pred.h), pred_away: parseInt(pred.a), penalty_winner_pred: pred.pw }, { onConflict: 'user_id,match_id' });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className={`bg-white/5 border rounded-2xl p-6 transition-all ${locked ? "border-white/5 opacity-60 grayscale-[0.5]" : "border-white/10 hover:border-emerald-500/30"}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">{locked && <Clock className="w-3 h-3 text-rose-500" />}{new Date(match.kickoff_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="bg-white/5 text-slate-400 text-[8px] font-black px-2 py-0.5 rounded uppercase italic">{match.group_name || match.sub_phase}</span>
        </div>
        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{match.channel}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
          {getFlag(match.home_team) ? <img src={getFlag(match.home_team)!} className="w-10 h-6 object-cover rounded shadow-md" alt="" /> : <Users className="w-10 h-6 text-slate-700" />}
          <span className={`font-black text-xs uppercase text-center truncate w-full tracking-tight ${!getFlag(match.home_team) ? "text-slate-500 italic text-[10px]" : ""}`}>{match.home_team}</span>
        </div>
        <div className="flex gap-2">
          <input type="number" min="0" disabled={locked} value={pred.h} onBlur={save} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:border-emerald-400 outline-none" placeholder="-" />
          <input type="number" min="0" disabled={locked} value={pred.a} onBlur={save} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:border-emerald-400 outline-none" placeholder="-" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
          {getFlag(match.away_team) ? <img src={getFlag(match.away_team)!} className="w-10 h-6 object-cover rounded shadow-md" alt="" /> : <Users className="w-10 h-6 text-slate-700" />}
          <span className={`font-black text-xs uppercase text-center truncate w-full tracking-tight ${!getFlag(match.away_team) ? "text-slate-500 italic text-[10px]" : ""}`}>{match.away_team}</span>
        </div>
      </div>
    </div>
  );
}

function BonusPage({ userId, isCompleted, onSaved }: { userId: string, isCompleted: boolean, onSaved: () => void }) {
  const isPermanentlyLocked = (new Date() > TOURNAMENT_START) || isCompleted;
  const [form, setForm] = useState({ scorer: "", assister: "", cards: "", mvp: "", goals: "" });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("bonus_predictions").select("*").eq("user_id", userId).single().then(({ data }) => { if (data) setForm({ scorer: data.top_scorer, assister: data.top_assister, cards: data.most_cards_team, mvp: data.mvp, goals: data.total_goals_guess?.toString() || "" }); setLoading(false); });
  }, [userId]);
  const save = async () => {
    if (isPermanentlyLocked || !form.goals) return;
    await supabase.from("bonus_predictions").upsert({ user_id: userId, top_scorer: form.scorer, top_assister: form.assister, most_cards_team: form.cards, mvp: form.mvp, total_goals_guess: parseInt(form.goals) });
    onSaved();
  };
  if (loading) return null;
  return (
    <div className="space-y-6">
      <CountdownTimer targetDate={TOURNAMENT_START} label="Bonus Predictions Lock In" />
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12">
        <h2 className="text-emerald-400 font-black text-4xl uppercase italic tracking-tighter mb-4">Bonus Predictions</h2>
        <p className="text-slate-400 text-sm font-bold mb-12 uppercase tracking-widest italic">Put your football brain to the test and predict the following:</p>
        <div className="space-y-10">
          <BonusField label="Golden Boot: Who will score the most goals?" points="5 points" value={form.scorer} onChange={(v) => setForm({...form, scorer: v})} disabled={isPermanentlyLocked} />
          <BonusField label="Assist King: Who will provide the most assists?" points="5 points" value={form.assister} onChange={(v) => setForm({...form, assister: v})} disabled={isPermanentlyLocked} />
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Card Magnets: Which team will collect the most cards? (5 pts)</p>
            <select disabled={isPermanentlyLocked} value={form.cards} onChange={(e) => setForm({...form, cards: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-emerald-400 outline-none font-bold">
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <BonusField label="Tournament MVP: Who will be crowned player of tournament?" points="5 points" value={form.mvp} onChange={(v) => setForm({...form, mvp: v})} disabled={isPermanentlyLocked} />
          <BonusField label="Goal Rush: Total goals scored? (extra time incl, no shootouts)" points="5/10 points" value={form.goals} onChange={(v) => setForm({...form, goals: v})} disabled={isPermanentlyLocked} type="number" />
          {!isPermanentlyLocked && <button onClick={save} className="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black uppercase mt-6 tracking-[0.2em] shadow-lg">Save & Unlock Matches</button>}
        </div>
      </div>
    </div>
  );
}

function BonusField({ label, points, value, onChange, disabled, type="text" }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <span className="text-[10px] font-black text-emerald-400">{points}</span>
      </div>
      <input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-emerald-400 outline-none font-bold italic" />
    </div>
  );
}

function CountdownTimer({ targetDate, label, isPending }: any) {
  const [timeLeft, setTimeLeft] = useState<any>(null);
  useEffect(() => {
    if (!targetDate || isPending) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance < 0) { setTimeLeft("LOCKED"); clearInterval(timer); } 
      else {
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ d, h, m, s });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, isPending]);

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center mb-6">
      <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-[0.2em]">{label}</p>
      {isPending ? (
        <span className="text-slate-500 font-black uppercase text-xs flex items-center gap-2 tracking-[0.2em]"><Lock className="w-3 h-3" /> Waiting...</span>
      ) : timeLeft === "LOCKED" ? (
        <span className="text-rose-500 font-black uppercase text-sm tracking-widest">Locked</span>
      ) : timeLeft ? (
        <div className="flex gap-4 text-white font-black italic">
          <TimeBlock unit="Days" val={timeLeft.d} /> <TimeBlock unit="Hours" val={timeLeft.h} /> <TimeBlock unit="Mins" val={timeLeft.m} /> <TimeBlock unit="Secs" val={timeLeft.s} />
        </div>
      ) : <span className="text-slate-600 font-black animate-pulse">...</span>}
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

function Leaderboard() {
  const [list, setList] = useState([]);
  useEffect(() => { supabase.from("profiles").select("*").order("total_points", { ascending: false }).then(({ data }) => setList(data as any || [])); }, []);
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
      <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Player</span><span>Points</span></div>
      {list.map((p: any, i) => (
        <div key={p.id} className={`p-6 flex justify-between items-center ${i < 3 ? "bg-emerald-500/5" : ""}`}>
          <div className="flex items-center gap-4">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black ${i === 0 ? "bg-amber-400 text-black" : "bg-white/10"}`}>{i + 1}</span>
            <span className="font-black uppercase text-lg tracking-tighter">{p.username}</span>
          </div>
          <span className="text-amber-400 font-black text-2xl italic">{p.total_points}</span>
        </div>
      ))}
    </div>
  );
}

function RulesPage() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-10">
      <h3 className="text-emerald-400 font-black uppercase italic text-xl underline tracking-widest">Scoring Engine</h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Group Stage</span> 1pt Win / 2pt Score</li>
        <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Knockouts</span> 2pt Win / 3pt Score</li>
        <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Gold Final</span> 5pt Win / 6pt Score</li>
      </ul>
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
          <button type="submit" className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-widest">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        {err && <p className="text-rose-400 text-[10px] font-bold mt-4 uppercase animate-pulse">{err}</p>}
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-6 text-[10px] font-black uppercase text-slate-500 underline">{mode === 'login' ? 'Need an account?' : 'Already have one?'}</button>
      </div>
    </div>
  );
}

function UsernameSetup({ userId, onComplete }: any) {
  const [name, setName] = useState("");
  const save = async () => {
    if (name.length < 3) return alert("Min 3 characters!");
    await supabase.from("profiles").upsert({ id: userId, username: name });
    onComplete();
  };
  return (
    <div className="min-h-screen bg-[#07090d] grid place-items-center p-4">
      <div className="text-center w-full max-w-sm">
        <h2 className="text-2xl font-black text-white mb-6 uppercase italic tracking-widest underline decoration-emerald-500">Choose Player Name</h2>
        <input type="text" placeholder="e.g. Zlatan" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center focus:border-emerald-400 outline-none font-bold italic" />
        <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase mt-6 shadow-lg">Start Tournament</button>
      </div>
    </div>
  );
}
