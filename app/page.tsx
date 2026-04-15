"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Shield, LogOut, Clock, Globe, AlertCircle, Lock, Users, Sparkles, Goal, Star, Target, CheckCircle, X, Info } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
const ADMIN_EMAIL = "fariz.syed@gmail.com";
const TOURNAMENT_START = new Date("2026-06-11T21:00:00+02:00");

// --- UTILS: Flags & 3-Letter Abbreviations ---
const TEAM_ABBREVIATIONS: Record<string, string> = {
  "mexico": "MEX", "usa": "USA", "united states": "USA", "canada": "CAN", "argentina": "ARG",
  "brazil": "BRA", "france": "FRA", "england": "ENG", "spain": "ESP", "germany": "GER",
  "portugal": "POR", "netherlands": "NED", "belgium": "BEL", "italy": "ITA", "croatia": "CRO",
  "denmark": "DEN", "norway": "NOR", "sweden": "SWE", "poland": "POL", "serbia": "SRB",
  "switzerland": "SUI", "austria": "AUT", "turkey": "TUR", "ukraine": "UKR", "scotland": "SCO",
  "wales": "WAL", "hungary": "HUN", "greece": "GRE", "czech republic": "CZE", "uruguay": "URU",
  "colombia": "COL", "chile": "CHI", "ecuador": "ECU", "peru": "PER", "paraguay": "PAR",
  "venezuela": "VEN", "morocco": "MAR", "senegal": "SEN", "nigeria": "NGA", "egypt": "EGY",
  "ghana": "GHA", "cameroon": "CMR", "algeria": "ALG", "tunisia": "TUN", "ivory coast": "CIV",
  "south africa": "RSA", "japan": "JPN", "south korea": "KOR", "australia": "AUS",
  "saudi arabia": "KSA", "iran": "IRN", "qatar": "QAT", "costa rica": "CRC", "iceland": "ISL", 
  "iraq": "IRQ", "new zealand": "NZL", "panama": "PAN"
};

const FULL_COUNTRIES = [
  "Algeria", "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Cameroon",
  "Canada", "Chile", "Colombia", "Costa Rica", "Croatia", "Czech Republic", "Denmark",
  "Ecuador", "Egypt", "England", "France", "Germany", "Ghana", "Greece", "Hungary",
  "Iceland", "Iran", "Iraq", "Italy", "Ivory Coast", "Japan", "Mexico", "Morocco",
  "Netherlands", "New Zealand", "Nigeria", "Norway", "Panama", "Paraguay", "Peru",
  "Poland", "Portugal", "Qatar", "Saudi Arabia", "Scotland", "Senegal", "Serbia",
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Tunisia", "Turkey",
  "USA", "Ukraine", "Uruguay", "Venezuela", "Wales"
].sort();

const getTeamLabel = (team: any): string => {
  if (!team || typeof team !== 'string') return "TBD";
  const t = team.toUpperCase();
  if (t.includes("WINNER") || t.includes("RUNNER") || t.includes("TBA") || t.includes("LOSER")) {
    const groupPosMatch = team.match(/[1-4][A-L]/); 
    if (groupPosMatch) return groupPosMatch[0];
    return "TBD";
  }
  return TEAM_ABBREVIATIONS[team.toLowerCase().trim()] || team.substring(0, 3).toUpperCase();
};

const getFlag = (team: any) => {
  if (!team || typeof team !== 'string') return null;
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
    "japan": "jp", "south korea": "kr", "australia": "au", "saudi arabia": "sa", "iran": "ir", "qatar": "qa",
    "costa rica": "cr", "iceland": "is", "iraq": "iq", "new zealand": "nz", "panama": "pa"
  };
  const code = map[name];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
};

// --- MAIN APP ---
export default function WorldCupApp() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("loading"); 
  const [bonusCompleted, setBonusCompleted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [tab, setTab] = useState(1);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    setProfile(data);
  };

  const checkBonusStatus = async (id: string) => {
    const { data } = await supabase.from("bonus_predictions").select("user_id").eq("user_id", id).maybeSingle();
    if (data) {
      setBonusCompleted(true);
      setView("matches");
    } else {
      setBonusCompleted(false);
      setView("bonus");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        checkBonusStatus(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
        setView("matches");
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        checkBonusStatus(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setView("matches");
      }
      setLoading(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.from("matches").select("*").order("kickoff_time", { ascending: true }).then(({ data }) => {
      const fetchedMatches = data || [];
      setMatches(fetchedMatches);
      setLoading(false);

      if (fetchedMatches.length > 0) {
        const now = new Date();
        const groupEnd = new Date(fetchedMatches.filter((m: any) => m?.sub_phase === 'group').slice(-1)[0]?.kickoff_time || 0);
        const r32End = new Date(fetchedMatches.filter((m: any) => m?.sub_phase === 'r32').slice(-1)[0]?.kickoff_time || 0);
        const r16End = new Date(fetchedMatches.filter((m: any) => m?.sub_phase === 'r16').slice(-1)[0]?.kickoff_time || 0);
        const semiEnd = new Date(fetchedMatches.filter((m: any) => m?.sub_phase === 'semi').slice(-1)[0]?.kickoff_time || 0);
        if (fetchedMatches.every(m => m.settled)) setTab(6);
        else if (now > semiEnd) setTab(5);
        else if (now > r16End) setTab(4);
        else if (now > r32End) setTab(3);
        else if (now > groupEnd) setTab(2);
        else setTab(1);
      }
    });
  }, []);

  const syncFromAPI = async () => {
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Sync complete. Settled ${data.settledCount} match(es). Refreshing...`);
        // Force refresh the match list to show updated scores
        const { data: updated } = await supabase.from("matches").select("*").order("kickoff_time", { ascending: true });
        setMatches(updated || []);
      } else {
        alert("Sync Error: " + data.error);
      }
    } catch (err) {
      alert("Network Error during sync.");
    }
  };

  if (loading || view === "loading") return <div className="min-h-screen bg-[#07090d] grid place-items-center text-emerald-400 font-black uppercase italic tracking-widest animate-pulse">Loading World Cup...</div>;
  if (!user) return <AuthScreen />;
  if (!profile?.username) return <UsernameSetup userId={user.id} onComplete={() => { setShowWelcome(true); fetchProfile(user.id); }} />;

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-200 font-sans pb-20">
      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
      <div className="sticky top-0 z-50 bg-[#07090d]/95 backdrop-blur-xl border-b border-white/5">
        <header className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="text-emerald-500 w-8 h-8" />
            <h1 className="font-black text-2xl md:text-3xl text-white uppercase italic tracking-tighter leading-none">
              World Cup '26<br/>
              <span className="text-emerald-400 text-xs md:text-sm tracking-widest block mt-1">Couch Potato Edition</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] text-slate-500 uppercase font-black leading-none tracking-widest">Points</p>
              <p className="text-amber-400 font-black text-xl leading-none">{profile?.total_points || 0}</p>
            </div>
            {user?.email === ADMIN_EMAIL && <Shield onClick={() => setView("admin")} className="cursor-pointer hover:text-amber-400 w-5 h-5" />}
            <LogOut onClick={async () => { await supabase.auth.signOut(); }} className="cursor-pointer hover:text-white w-5 h-5 text-slate-500" />
          </div>
        </header>

        <nav className="max-w-[1400px] mx-auto px-4 pb-4 flex gap-1 md:gap-2 md:justify-center overflow-x-auto scrollbar-hide">
          <button onClick={() => bonusCompleted && setView("matches")} className={`flex-1 md:flex-none md:w-32 py-3 text-[11px] font-black uppercase tracking-widest rounded-lg transition flex items-center justify-center gap-2 ${view === "matches" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500"} ${!bonusCompleted && "opacity-40 cursor-not-allowed"}`}>
            {!bonusCompleted && <Lock className="w-2.5 h-2.5" />} Matches
          </button>
          <NavBtn active={view === "bonus"} onClick={() => setView("bonus")} label="Bonus" />
          <NavBtn active={view === "stats"} onClick={() => setView("stats")} label="Stats" />
          <NavBtn active={view === "leaderboard"} onClick={() => setView("leaderboard")} label="Leaderboard" />
          <NavBtn active={view === "rules"} onClick={() => setView("rules")} label="Rules" />
        </nav>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 mt-6">
        {view === "matches" && <MatchList matches={matches} tab={tab} setTab={setTab} userId={user.id} />}
        {view === "bonus" && <BonusPage userId={user.id} isCompleted={bonusCompleted} onSaved={() => { setBonusCompleted(true); setView("matches"); }} />}
        {view === "stats" && <StatsPage matches={matches} />}
        {view === "leaderboard" && <Leaderboard />}
        {view === "rules" && <RulesPage />}
        {view === "admin" && <AdminPanel matches={matches} syncFromAPI={syncFromAPI} />}
      </main>
    </div>
  );
}

// --- ALL OTHER COMPONENTS STAY THE SAME UNTIL ADMIN PANEL ---

function StatsPage({ matches }: { matches: any[] }) {
  const [subTab, setSubTab] = useState(1);
  const [players, setPlayers] = useState<any[]>([]);
  useEffect(() => { supabase.from("tournament_players").select("*").order("goals", { ascending: false }).then(({ data }) => setPlayers(data || [])); }, []);
  return (
    <div className="space-y-6">
      <div className="sticky top-[100px] z-40 bg-[#07090d]/95 backdrop-blur-xl pt-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide max-w-5xl mx-auto">
          <button onClick={() => setSubTab(1)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition whitespace-nowrap ${subTab === 1 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Standings</button>
          <button onClick={() => setSubTab(2)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition whitespace-nowrap ${subTab === 2 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Bracket</button>
          <button onClick={() => setSubTab(3)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition whitespace-nowrap ${subTab === 3 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Scorers</button>
        </div>
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
    const groupMatches = (matches || []).filter(m => m?.group_name === groupName && m?.settled);
    const groupTeams = Array.from(new Set((matches || []).filter(m => m?.group_name === groupName).flatMap(m => [m?.home_team, m?.away_team]).filter(Boolean)));
    groupTeams.forEach(t => table[t as string] = { name: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
    groupMatches.forEach(m => {
      const h = table[m.home_team]; const a = table[m.away_team]; if (!h || !a) return;
      h.p++; a.p++; h.gf += m.home_score || 0; h.ga += m.away_score || 0; a.gf += m.away_score || 0; a.ga += m.home_score || 0;
      if (m.home_score > m.away_score) { h.w++; h.pts += 3; a.l++; } else if (m.home_score < m.away_score) { a.w++; a.pts += 3; h.l++; } else { h.d++; a.d++; h.pts += 1; a.pts += 1; }
      h.gd = h.gf - h.ga; a.gd = a.gf - a.ga;
    });
    return Object.values(table).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {groups.map(g => {
        const teams = calculateGroup(g); if (teams.length === 0) return null;
        return (
          <div key={g} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-[11px] md:text-xs">
              <thead><tr className="text-slate-400 border-b border-white/5"><th className="px-4 py-4 font-bold uppercase w-full">{g}</th><th className="px-3 text-center">P</th><th className="px-3 text-center">GD</th><th className="px-4 text-center font-bold">Pts</th></tr></thead>
              <tbody>{teams.map((t: any, i) => (
                <tr key={t.name} className={`border-b border-white/5 last:border-0 hover:bg-white/5 ${i < 2 ? "bg-emerald-500/5" : ""}`}>
                  <td className="px-4 py-3 flex items-center gap-3"><span className="font-bold text-slate-500 w-3">{i + 1}</span><img src={getFlag(t.name) || ""} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" alt="" /><span className="font-bold text-white tracking-tight">{t.name}</span></td>
                  <td className="text-center text-slate-300">{t.p}</td><td className="text-center text-slate-300">{t.gd > 0 ? `+${t.gd}` : t.gd}</td><td className="text-center px-4 font-black text-white">{t.pts}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

const BracketMatch = ({ match }: { match?: any }) => {
  const hWin = match?.settled && (match.home_score > match.away_score || match.penalty_winner_actual === 'home');
  const aWin = match?.settled && (match.away_score > match.home_score || match.penalty_winner_actual === 'away');
  if (!match) return <div className="relative flex justify-center items-center w-[130px] h-[56px] bg-[#1a1d24]/30 border border-white/5 rounded-lg"><span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">Match TBD</span></div>;
  return (
    <div className={`relative flex flex-col justify-between w-[130px] h-[56px] bg-[#1a1d24] border ${match?.settled ? 'border-white/10' : 'border-white/5 opacity-80'} rounded-lg hover:border-emerald-500/50 transition-colors shadow-lg px-2 py-1 z-10`}>
      <div className="w-full flex justify-between items-center mb-0.5 border-b border-white/5 pb-0.5 h-1/2">
         <div className="flex items-center gap-1.5 overflow-hidden">
           <img src={getFlag(match?.home_team) || ""} className="w-3.5 h-2.5 object-cover" alt="" />
           <span className={`text-[9px] font-black uppercase truncate ${hWin ? "text-emerald-400" : "text-slate-300"}`}>{getTeamLabel(match?.home_team)}</span>
         </div>
         <span className={`text-[10px] font-black tabular-nums ${hWin ? "text-emerald-400" : "text-slate-400"}`}>{match?.settled ? match.home_score : "-"}</span>
      </div>
      <div className="w-full flex justify-between items-center px-1 py-0.5 h-1/2">
         <div className="flex items-center gap-1.5 overflow-hidden">
           <img src={getFlag(match?.away_team) || ""} className="w-3.5 h-2.5 object-cover" alt="" />
           <span className={`text-[9px] font-black uppercase truncate ${aWin ? "text-emerald-400" : "text-slate-300"}`}>{getTeamLabel(match?.away_team)}</span>
         </div>
         <span className={`text-[10px] font-black tabular-nums ${aWin ? "text-emerald-400" : "text-slate-400"}`}>{match?.settled ? match.away_score : "-"}</span>
      </div>
    </div>
  );
};

const MatchWrapper = ({ children, height }: { children: React.ReactNode, height: number }) => ( <div style={{ height: `${height}px` }} className="flex flex-col justify-center items-center w-full relative z-10">{children}</div> );
const ForkRight = ({ height }: { height: number }) => ( <div style={{ height: `${height}px` }} className="flex flex-col justify-center items-end w-6 relative"><div className="w-1/2 h-1/2 border-white/10 border-t-[1.5px] border-b-[1.5px] border-r-[1.5px] rounded-r-md relative"><div className="absolute top-1/2 left-full w-3 h-[1.5px] bg-white/10 -mt-[0.75px]" /></div></div> );
const ForkLeft = ({ height }: { height: number }) => ( <div style={{ height: `${height}px` }} className="flex flex-col justify-center items-start w-6 relative"><div className="w-1/2 h-1/2 border-white/10 border-t-[1.5px] border-b-[1.5px] border-l-[1.5px] rounded-l-md relative"><div className="absolute top-1/2 right-full w-3 h-[1.5px] bg-white/10 -mt-[0.75px]" /></div></div> );
const SingleLine = ({ height }: { height: number }) => ( <div style={{ height: `${height}px` }} className="flex flex-col justify-center items-center w-4 relative"><div className="w-full h-[1.5px] bg-white/10" /></div> );

function KnockoutBracket({ matches }: { matches: any[] }) {
  const r32 = (matches || []).filter(m => m.sub_phase === 'r32').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const r16 = (matches || []).filter(m => m.sub_phase === 'r16').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const qf = (matches || []).filter(m => m.sub_phase === 'quarter').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const sf = (matches || []).filter(m => m.sub_phase === 'semi').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const bronze = (matches || []).find(m => m.sub_phase === 'bronze');
  const final = (matches || []).find(m => m.sub_phase === 'final');
  const matchMap: Record<string, any> = { "M73": r32[0], "M74": r32[1], "M75": r32[2], "M76": r32[3], "M77": r32[4], "M78": r32[5], "M79": r32[6], "M80": r32[7], "M81": r32[8], "M82": r32[9], "M83": r32[10], "M84": r32[11], "M85": r32[12], "M86": r32[13], "M87": r32[14], "M88": r32[15], "M89": r16[0], "M90": r16[1], "M91": r16[2], "M92": r16[3], "M93": r16[4], "M94": r16[5], "M95": r16[6], "M96": r16[7], "M97": qf[0], "M98": qf[1], "M99": qf[2], "M100": qf[3], "M101": sf[0], "M102": sf[1], "M103": bronze, "M104": final };
  const H = 64; 
  return (
    <div className="bg-[#0b0d14] border border-white/5 rounded-3xl p-8 overflow-x-auto shadow-2xl scrollbar-hide">
      <div className="flex min-w-[1200px] mb-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center justify-between"><div className="w-[130px]">R32</div><div className="w-[130px]">R16</div><div className="w-[130px]">Quarter</div><div className="w-[130px]">Semi</div><div className="w-[160px] text-emerald-400/50">Final</div><div className="w-[130px]">Semi</div><div className="w-[130px]">Quarter</div><div className="w-[130px]">R16</div><div className="w-[130px]">R32</div></div>
      <div className="flex min-w-[1200px] justify-between items-center text-center">
        <div className="flex w-[130px] flex-col">{["M74", "M77", "M73", "M75", "M83", "M84", "M81", "M82"].map(id => <MatchWrapper key={id} height={H}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}</div>
        <div className="flex flex-col">{Array(4).fill(0).map((_,i) => <ForkRight key={i} height={H*2} />)}</div>
        <div className="flex w-[130px] flex-col">{["M89", "M90", "M93", "M94"].map(id => <MatchWrapper key={id} height={H*2}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}</div>
        <div className="flex flex-col">{Array(2).fill(0).map((_,i) => <ForkRight key={i} height={H*4} />)}</div>
        <div className="flex w-[130px] flex-col">{["M97", "M98"].map(id => <MatchWrapper key={id} height={H*4}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}</div>
        <div className="flex flex-col"><ForkRight height={H*8} /></div>
        <div className="flex w-[130px] flex-col">{["M101"].map(id => <MatchWrapper key={id} height={H*8}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}</div>
        <SingleLine height={H*8} />
        <div className="flex flex-col justify-center items-center w-[160px] relative z-10" style={{ height: `${H*8}px` }}><div className="absolute top-[12%]"><Trophy className="w-10 h-10 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" /></div><BracketMatch match={matchMap["M104"]} /><div className="absolute bottom-[12%] flex flex-col items-center w-full"><span className="text-[8px] font-black uppercase text-slate-500 mb-2">3rd Place</span><BracketMatch match={matchMap["M103"]} /></div></div>
        <SingleLine height={H*8} />
        <div className="flex w-[130px] flex-col">{["M102"].map(id => <MatchWrapper key={id} height={H*8}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}</div>
        <div className="flex flex-col"><ForkLeft height={H*8} /></div>
        <div className="flex w-[130px] flex-col">{["M99", "M100"].map(id => <MatchWrapper key={id} height={H*4}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}</div>
        <div className="flex flex-col">{Array(2).fill(0).map((_,i) => <ForkLeft key={i} height={H*4} />)}</div>
        <div className="flex w-[130px] flex-col">{["M91", "M92", "M95", "M96"].map(id => <MatchWrapper key={id} height={H*2}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}</div>
        <div className="flex flex-col">{Array(4).fill(0).map((_,i) => <ForkLeft key={i} height={H*2} />)}</div>
        <div className="flex w-[130px] flex-col">{["M76", "M78", "M79", "M80", "M86", "M88", "M85", "M87"].map(id => <MatchWrapper key={id} height={H}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}</div>
      </div>
    </div>
  );
}

function TopPerformers({ players }: { players: any[] }) {
  const scorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 10);
  const assisters = [...players].sort((a, b) => b.assists - a.assists).slice(0, 10);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-lg"><h3 className="p-6 text-xl font-black text-emerald-400 uppercase italic flex items-center gap-3"><Goal className="w-6 h-6" /> Golden Boot</h3>
        {scorers.map((p, i) => ( <div key={p.id} className="px-6 py-4 flex justify-between items-center border-t border-white/5 hover:bg-white/5"><div className="flex items-center gap-4"><span className="text-slate-600 font-black italic w-4">{i + 1}</span><div><p className="font-black text-white uppercase leading-none">{p.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{p.team}</p></div></div><span className="text-2xl font-black text-emerald-400 italic tabular-nums">{p.goals}</span></div> ))}
      </section>
      <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-lg"><h3 className="p-6 text-xl font-black text-amber-400 uppercase italic flex items-center gap-3"><Star className="w-6 h-6" /> Assist King</h3>
        {assisters.map((p, i) => ( <div key={p.id} className="px-6 py-4 flex justify-between items-center border-t border-white/5 hover:bg-white/5"><div className="flex items-center gap-4"><span className="text-slate-600 font-black italic w-4">{i + 1}</span><div><p className="font-black text-white uppercase leading-none">{p.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{p.team}</p></div></div><span className="text-2xl font-black text-amber-400 italic tabular-nums">{p.assists}</span></div> ))}
      </section>
    </div>
  );
}

function AdminPanel({ matches, syncFromAPI }: any) {
  const [scores, setScores] = useState<any>({});
  const [newPlayer, setNewPlayer] = useState({ name: "", team: "", goals: 0, assists: 0 });
  const [syncing, setSyncing] = useState(false);
  const addPlayer = async () => {
    if (!newPlayer.name || !newPlayer.team) return alert("Fill in name and team!");
    const { error } = await supabase.from("tournament_players").insert(newPlayer);
    if (error) alert(error.message); else { alert("Player updated!"); setNewPlayer({ name: "", team: "", goals: 0, assists: 0 }); }
  };
  const settleMatch = async (m: any) => {
    const s = scores[m.id]; if (!s || s.h === "" || s.a === "") return alert("Enter scores!");
    if (m.phase > 1 && s.h === s.a && !s.pw) return alert("Select a penalty winner!");
    try { await settleMatchCore(m, s); alert("Match Settled!"); } catch (e: any) { alert(e.message); }
  };
  const handleSync = async () => { setSyncing(true); try { await syncFromAPI(); } finally { setSyncing(false); } };
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div><h2 className="text-blue-400 font-black text-2xl uppercase italic flex items-center gap-3"><Globe className="w-6 h-6" /> API Sync</h2><p className="text-slate-400 text-sm">Automated scoring via API-Football.</p></div>
          <button onClick={handleSync} disabled={syncing} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-50">{syncing ? "Syncing..." : "Run Global Sync"}</button>
      </div>
      <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6">
        <h2 className="text-amber-400 font-black text-xl mb-6 uppercase italic flex items-center gap-2"><Shield className="w-5 h-5" /> Manual Settle</h2>
        <div className="space-y-4">
          {matches.filter((m: any) => !m.settled).map((m: any) => (
            <div key={m.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center group">
              <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 group-hover:text-white">{m.home_team} vs {m.away_team} ({m.sub_phase})</span>
              <div className="flex gap-2">
                <input type="number" placeholder="H" className="w-10 bg-white/5 rounded p-1 text-center" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], h: e.target.value}})} />
                <input type="number" placeholder="A" className="w-10 bg-white/5 rounded p-1 text-center" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], a: e.target.value}})} />
                {m.phase > 1 && ( <select className="w-16 bg-white/5 rounded p-1 text-[9px]" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], pw: e.target.value}})}><option value="">PW?</option><option value="home">Home</option><option value="away">Away</option></select> )}
                <button onClick={() => settleMatch(m)} className="bg-emerald-500 text-black px-4 py-1 rounded font-black uppercase text-[9px] italic">Settle</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-2xl p-6">
        <h2 className="text-emerald-400 font-black text-xl mb-6 uppercase italic flex items-center gap-2"><Users className="w-5 h-5" /> Update Player</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Name" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})} />
          <input type="text" placeholder="Team" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" onChange={(e) => setNewPlayer({...newPlayer, team: e.target.value})} />
        </div>
        <button onClick={addPlayer} className="w-full bg-emerald-500 text-black py-3 rounded-xl font-black uppercase text-xs tracking-widest">Update Database</button>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, label }: any) { return ( <button onClick={onClick} className={`flex-1 md:flex-none md:w-32 py-3 text-[11px] font-black uppercase tracking-widest rounded-lg transition ${active ? "bg-emerald-500 text-black shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>{label}</button> ); }
function WelcomePopup({ onClose }: { onClose: () => void }) { return ( <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl grid place-items-center p-6"><div className="bg-[#0f1117] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl"><Sparkles className="text-amber-400 w-12 h-12 mb-6 mx-auto animate-pulse" /><h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">Welcome Potato</h2><button onClick={onClose} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase mt-10 tracking-[0.2em] shadow-md">Let's Go</button></div></div> ); }
function MiniLeaderboard() {
  const [list, setList] = useState([]); useEffect(() => { supabase.from("profiles").select("*").order("total_points", { ascending: false }).limit(5).then(({ data }) => setList(data as any || [])); }, []);
  return ( <div className="space-y-3">{list.map((p: any, i) => ( <div key={p.id} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0"><div className="flex items-center gap-3"><span className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black ${i === 0 ? "bg-amber-400 text-black" : "text-slate-500 bg-white/5"}`}>{i + 1}</span><span className="text-[11px] font-bold text-white uppercase">{p.username}</span></div><span className="text-sm font-black text-emerald-400 tabular-nums">{p.total_points}</span></div> ))}</div> );
}

function MatchList({ matches, tab, setTab, userId }: any) {
  const now = new Date(); let lockTime: Date | null = null; let isPending = false; let matchesLocked = false; let filtered = [];
  if (tab === 6) { lockTime = null; matchesLocked = true; filtered = matches.filter((m: any) => m.settled).sort((a,b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime()); } 
  else {
    const groupEnd = matches.filter((m: any) => m?.sub_phase === 'group').slice(-1)[0];
    const r32First = matches.find((m: any) => m?.sub_phase === 'r32');
    if (tab === 1) { lockTime = TOURNAMENT_START; matchesLocked = now > TOURNAMENT_START; filtered = matches.filter((m: any) => m?.sub_phase === 'group' && !m.settled); }
    else if (tab === 2) { if (groupEnd && now < new Date(groupEnd.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = r32First ? new Date(r32First.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } filtered = matches.filter((m: any) => m?.sub_phase === 'r32' && !m.settled); }
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
      <div className="hidden lg:block sticky top-[100px]"><HowToPlaySidebar tab={tab} /></div>
      <div className="col-span-1 lg:col-span-4">
        <div className="sticky top-[100px] z-40 bg-[#07090d]/95 backdrop-blur-xl pt-2 pb-2 mb-6 -mx-4 px-4 md:mx-0 md:px-0"><div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide"><PhaseTab id={1} label="Group" active={tab === 1} onClick={setTab} /><PhaseTab id={2} label="R32" active={tab === 2} onClick={setTab} /><PhaseTab id={6} label="Results" active={tab === 6} onClick={setTab} /></div></div>
        <CountdownTimer targetDate={lockTime} label="Round Locks In" isPending={isPending} />
        <div className="grid gap-4">{filtered.map((m: any) => <MatchCard key={m.id} match={m} userId={userId} locked={matchesLocked} isPending={isPending} />)}</div>
      </div>
      <div className="hidden lg:block sticky top-[100px] bg-[#12151c] border border-white/5 rounded-2xl p-6 shadow-xl"><h3 className="text-amber-400 font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-xs"><Trophy className="w-4 h-4"/> Leaders</h3><MiniLeaderboard /></div>
    </div>
  );
}

function HowToPlaySidebar({ tab }: { tab: number }) { return ( <div className="bg-[#12151c] border border-white/5 rounded-2xl p-6 shadow-xl"><h3 className="text-emerald-400 font-black uppercase text-xs flex items-center gap-2 mb-4"><Info className="w-4 h-4"/> Play Rule</h3><p className="text-[11px] text-slate-400 italic">Predict outcome to score points. Group correct = 1pt.</p></div> ); }
function PhaseTab({ id, label, active, onClick }: any) { return ( <button onClick={() => onClick(id)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${active ? "bg-emerald-500 text-black" : "text-slate-500"}`}>{label}</button> ); }

function MatchCard({ match, userId, locked, isPending }: any) {
  const [pred, setPred] = useState({ h: "", a: "", pw: "" }); const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => { supabase.from("predictions").select("*").eq("user_id", userId).eq("match_id", match.id).single().then(({ data }) => { if (data) setPred({ h: data.pred_home.toString(), a: data.pred_away.toString(), pw: data.penalty_winner_pred || "" }); setInitialLoad(false); }); }, [match.id, userId]);
  useEffect(() => { if (initialLoad || locked || pred.h === "" || pred.a === "") return; const timer = setTimeout(async () => { await supabase.from("predictions").upsert({ user_id: userId, match_id: match.id, pred_home: parseInt(pred.h), pred_away: parseInt(pred.a), penalty_winner_pred: pred.pw }, { onConflict: 'user_id,match_id' }); }, 500); return () => clearTimeout(timer); }, [pred, initialLoad, locked, match.id, userId]);
  const isGroup = match.sub_phase === 'group'; const active1X2 = (pred.h !== "" && pred.a !== "") ? (parseInt(pred.h) > parseInt(pred.a) ? '1' : parseInt(pred.h) < parseInt(pred.a) ? '2' : 'X') : null;
  return (
    <div className={`bg-white/5 border rounded-2xl p-6 transition-all relative ${locked ? "opacity-60" : "hover:border-emerald-500/30"}`}>
      {match.settled && <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase shadow-sm z-10">FT: {match.home_score} - {match.away_score}</div>}
      <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3"><span className="text-[10px] text-slate-500 uppercase">{new Date(match.kickoff_time).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div><span className="text-emerald-400 text-[10px] font-black uppercase italic">{match.channel}</span></div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden"><img src={getFlag(match.home_team) || ""} className="w-10 h-6 object-cover shadow-md" alt="" /><span className="font-black text-xs uppercase truncate w-full text-center">{match.home_team}</span></div>
        <div className="flex items-center justify-center gap-2">{isGroup ? ( <div className="flex items-center justify-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 h-14"> {['1','X','2'].map(val => <button key={val} disabled={locked} onClick={() => setPred({...pred, h: val==='1'?'1':'0', a: val==='2'?'1':'0', pw: ''})} className={`w-8 h-full rounded-lg text-[10px] font-black ${active1X2 === val ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}>{val}</button> )} </div> ) : ( <input type="number" disabled={locked} value={pred.h} className="w-12 h-14 bg-black/40 text-center text-xl font-black text-white rounded-xl outline-none" placeholder="-" /> )}</div>
        <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden"><img src={getFlag(match.away_team) || ""} className="w-10 h-6 object-cover shadow-md" alt="" /><span className="font-black text-xs uppercase truncate w-full text-center">{match.away_team}</span></div>
      </div>
    </div>
  );
}

function BonusPage({ userId, isCompleted, onSaved }: { userId: string, isCompleted: boolean, onSaved: () => void }) {
  const isLocked = (new Date() > TOURNAMENT_START) || isCompleted;
  const [form, setForm] = useState({ scorer: "", assister: "", cards: "", mvp: "", goals: "" });
  useEffect(() => { supabase.from("bonus_predictions").select("*").eq("user_id", userId).single().then(({ data }) => { if (data) setForm({ scorer: data.top_scorer, assister: data.top_assister, cards: data.most_cards_team, mvp: data.mvp, goals: data.total_goals_guess?.toString() || "" }); }); }, [userId]);
  const save = async () => { if (isLocked) return; await supabase.from("bonus_predictions").upsert({ user_id: userId, top_scorer: form.scorer, top_assister: form.assister, most_cards_team: form.cards, mvp: form.mvp, total_goals_guess: parseInt(form.goals) }); onSaved(); };
  return ( <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-xl max-w-3xl mx-auto"><h2 className="text-emerald-400 font-black text-4xl uppercase mb-8">Bonus Predictions</h2><input type="text" value={form.scorer} onChange={(e) => setForm({...form, scorer: e.target.value})} className="w-full bg-black/40 p-4 rounded-2xl mb-4 text-white" placeholder="Top Scorer" /><button onClick={save} className="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black uppercase">Save Bonuses</button></div> );
}

function CountdownTimer({ targetDate, label, isPending }: any) { return ( <div className="bg-emerald-500/10 p-4 rounded-2xl text-center mb-6"><p className="text-[10px] text-emerald-400 uppercase tracking-widest">{label}</p><span className="text-white font-black italic">{isPending ? "Waiting..." : "Countdown Active"}</span></div> ); }
function Leaderboard() {
  const [list, setList] = useState([]); useEffect(() => { supabase.from("profiles").select("*").order("total_points", { ascending: false }).then(({ data }) => setList(data as any || [])); }, []);
  return ( <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden max-w-5xl mx-auto">{list.map((p: any, i) => ( <div key={p.id} className="p-6 flex justify-between border-b border-white/5"><span className="font-black uppercase">{i + 1}. {p.username}</span><span className="text-amber-400 font-black text-2xl italic">{p.total_points}</span></div> ))}</div> );
}

function RulesPage() { return ( <div className="bg-white/5 p-8 rounded-3xl max-w-5xl mx-auto text-center"><h3 className="text-emerald-400 font-black text-2xl mb-4 italic uppercase">League Rules</h3><p className="text-slate-400 italic">Predictions auto-save. Correct result = points. Group = 1pt.</p></div> ); }
function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login"); const [form, setForm] = useState({ e: "", p: "" }); const [err, setErr] = useState("");
  const handle = async (e: any) => { e.preventDefault(); const { error } = mode === 'signup' ? await supabase.auth.signUp({ email: form.e, password: form.p }) : await supabase.auth.signInWithPassword({ email: form.e, password: form.p }); if (error) setErr(error.message); };
  return ( <div className="min-h-screen grid place-items-center bg-[#07090d]"><div className="w-full max-w-sm text-center"><Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-6"/><h1 className="text-5xl font-black text-white italic uppercase mb-8 leading-none">Couch Potato</h1><form onSubmit={handle} className="space-y-4"><input type="email" placeholder="Email" className="w-full p-4 bg-white/5 text-white text-center rounded-xl" onChange={(e) => setForm({...form, e: e.target.value})} /><input type="password" placeholder="Pass" className="w-full p-4 bg-white/5 text-white text-center rounded-xl" onChange={(e) => setForm({...form, p: e.target.value})} /><button type="submit" className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase">{mode === 'login' ? 'Sign In' : 'Join'}</button></form><p className="text-rose-400 text-xs mt-4 uppercase">{err}</p></div></div> );
}

function UsernameSetup({ userId, onComplete }: any) {
  const [name, setName] = useState(""); const save = async () => { if (name.length < 3) return alert("Short!"); await supabase.from("profiles").upsert({ id: userId, username: name }); onComplete(); };
  return ( <div className="min-h-screen bg-[#07090d] grid place-items-center"><div className="text-center max-w-sm"><h2 className="text-2xl font-black text-white uppercase italic mb-8 underline">Pick Name</h2><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 bg-white/5 text-center text-white rounded-xl mb-4" /><button onClick={save} className="w-full bg-emerald-500 py-4 font-black uppercase rounded-xl">Play</button></div></div> );
}

// --- GLOBAL SETTLE LOGIC ---
async function settleMatchCore(m: any, s: { h: any; a: any; pw?: string | null }) {
  const actH = parseInt(s.h); const actA = parseInt(s.a);
  const { data: preds } = await supabase.from("predictions").select("*").eq("match_id", m.id);
  if (preds) {
    for (const p of preds) {
      let pts = 0;
      const isExact = p.pred_home === actH && p.pred_away === actA;
      let isOutcome = false;
      if (m.sub_phase === 'group') { isOutcome = Math.sign(p.pred_home - p.pred_away) === Math.sign(actH - actA); pts = isOutcome ? 1 : 0; }
      else if (m.sub_phase === 'r32') { const homeAdvances = actH > actA || (actH === actA && s.pw === 'home'); const userPickedHome = p.pred_home > p.pred_away; isOutcome = homeAdvances === userPickedHome; pts = isOutcome ? 2 : 0; }
      else {
        if (actH > actA) isOutcome = p.pred_home > p.pred_away; else if (actH < actA) isOutcome = p.pred_home < p.pred_away; else isOutcome = (p.pred_home === p.pred_away) && (p.penalty_winner_pred === s.pw);
        if (m.sub_phase === 'r16') pts = isExact ? 5 : (isOutcome ? 3 : 0);
        else if (['quarter', 'semi'].includes(m.sub_phase)) pts = isExact ? 6 : (isOutcome ? 4 : 0);
        else if (['bronze', 'final'].includes(m.sub_phase)) pts = isExact ? 7 : (isOutcome ? 5 : 0);
      }
      if (pts > 0) await supabase.rpc('increment_points', { user_id: p.user_id, amount: pts });
    }
  }
  await supabase.from("matches").update({ home_score: actH, away_score: actA, penalty_winner_actual: s.pw || null, settled: true }).eq("id", m.id);
}
