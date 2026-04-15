"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Shield, LogOut, Clock, Globe, AlertCircle, Lock, Users, Sparkles, Goal, Star, Target } from "lucide-react";

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
  "saudi arabia": "KSA", "iran": "IRN", "qatar": "QAT"
};

const COUNTRIES = Object.values(TEAM_ABBREVIATIONS).filter((v, i, a) => a.indexOf(v) === i).sort();

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
    "japan": "jp", "south korea": "kr", "australia": "au", "saudi arabia": "sa", "iran": "ir", "qatar": "qa"
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        checkBonusStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    setProfile(data);
  };

  const checkBonusStatus = async (id: string) => {
    const { data } = await supabase.from("bonus_predictions").select("user_id").eq("user_id", id).single();
    if (data) {
      setBonusCompleted(true);
      setView("matches");
    } else {
      setView("bonus");
    }
  };

  // Auto-route matches tab based on current tournament date
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

        const allSettled = fetchedMatches.every(m => m.settled);

        if (allSettled) setTab(6); // If everything is done, default to Results
        else if (now > semiEnd) setTab(5);
        else if (now > r16End) setTab(4);
        else if (now > r32End) setTab(3);
        else if (now > groupEnd) setTab(2);
        else setTab(1);
      }
    });
  }, []);

  if (loading || view === "loading") return <div className="min-h-screen bg-[#07090d] grid place-items-center text-emerald-400 font-black uppercase italic tracking-widest animate-pulse">Loading World Cup...</div>;
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

      <main className="max-w-[1400px] mx-auto px-4 mt-8">
        {view === "matches" && <MatchList matches={matches} tab={tab} setTab={setTab} userId={user.id} />}
        {view === "bonus" && <BonusPage userId={user.id} isCompleted={bonusCompleted} onSaved={() => { setBonusCompleted(true); setView("matches"); }} />}
        {view === "stats" && <StatsPage matches={matches} />}
        {view === "leaderboard" && <Leaderboard />}
        {view === "rules" && <RulesPage />}
        {view === "admin" && <AdminPanel matches={matches} />}
      </main>
    </div>
  );
}

// --- STATS PAGE & MATHEMATICAL BRACKET ---
function StatsPage({ matches }: { matches: any[] }) {
  const [subTab, setSubTab] = useState(1);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("tournament_players").select("*").order("goals", { ascending: false }).then(({ data }) => setPlayers(data || []));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide max-w-5xl mx-auto">
        <button onClick={() => setSubTab(1)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition whitespace-nowrap ${subTab === 1 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Standings Group Stage</button>
        <button onClick={() => setSubTab(2)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition whitespace-nowrap ${subTab === 2 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Knockout Bracket</button>
        <button onClick={() => setSubTab(3)} className={`flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition whitespace-nowrap ${subTab === 3 ? "bg-emerald-500 text-black" : "text-slate-500"}`}>Top Scorers & Assists</button>
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
      const h = table[m.home_team];
      const a = table[m.away_team];
      if (!h || !a) return;
      h.p++; a.p++;
      h.gf += m.home_score || 0; h.ga += m.away_score || 0;
      a.gf += m.away_score || 0; a.ga += m.home_score || 0;
      if (m.home_score > m.away_score) { h.w++; h.pts += 3; a.l++; }
      else if (m.home_score < m.away_score) { a.w++; a.pts += 3; h.l++; }
      else { h.d++; a.d++; h.pts += 1; a.pts += 1; }
      h.gd = h.gf - h.ga; a.gd = a.gf - a.ga;
    });

    return Object.values(table).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {groups.map(g => {
        const teams = calculateGroup(g);
        if (teams.length === 0) return null;
        return (
          <div key={g} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] md:text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-white/5">
                    <th className="px-4 py-4 font-bold tracking-widest uppercase w-full">{g}</th>
                    <th className="px-3 py-4 text-center font-semibold">P</th>
                    <th className="px-3 py-4 text-center font-semibold">W</th>
                    <th className="px-3 py-4 text-center font-semibold">D</th>
                    <th className="px-3 py-4 text-center font-semibold">L</th>
                    <th className="px-3 py-4 text-center font-semibold">GF</th>
                    <th className="px-3 py-4 text-center font-semibold">GA</th>
                    <th className="px-3 py-4 text-center font-semibold">GD</th>
                    <th className="px-4 py-4 text-center font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t: any, i) => (
                    <tr key={t.name} className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${i < 2 ? "bg-emerald-500/5" : ""}`}>
                      <td className="px-4 py-3 flex items-center gap-3">
                        <span className="font-bold text-slate-500 w-3">{i + 1}</span>
                        <img src={getFlag(t.name) || ""} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" alt="" />
                        <span className="font-bold text-white tracking-tight">{t.name}</span>
                      </td>
                      <td className="text-center text-slate-300">{t.p}</td>
                      <td className="text-center text-slate-300">{t.w}</td>
                      <td className="text-center text-slate-300">{t.d}</td>
                      <td className="text-center text-slate-300">{t.l}</td>
                      <td className="text-center text-slate-300">{t.gf}</td>
                      <td className="text-center text-slate-300">{t.ga}</td>
                      <td className="text-center text-slate-300">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                      <td className="text-center px-4 font-black text-white">{t.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const BracketMatch = ({ match }: { match?: any }) => {
  const kickoffDate = match?.kickoff_time ? new Date(match.kickoff_time) : null;
  const timeStr = kickoffDate ? kickoffDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : "--:--";
  const dateStr = kickoffDate ? kickoffDate.toLocaleDateString('en-GB', { month: 'short', day: '2-digit' }) : "TBD";

  const hWin = match?.settled && (match.home_score > match.away_score || match.penalty_winner_actual === 'home');
  const aWin = match?.settled && (match.away_score > match.home_score || match.penalty_winner_actual === 'away');

  if (!match) return (
    <div className="relative flex justify-center items-center w-28 h-[46px] bg-[#1a1d24]/30 border border-white/5 rounded-md">
      <span className="text-[9px] font-black text-slate-700 italic uppercase tracking-widest">Match TBD</span>
    </div>
  );

  return (
    <div className={`relative flex flex-col justify-between w-28 h-[46px] bg-[#1a1d24] border ${match.settled ? 'border-white/10 opacity-100' : 'border-white/5 opacity-80'} rounded-md hover:border-emerald-500/50 transition-colors z-10`}>
      <div className="absolute bottom-full left-0 w-full flex justify-between px-0.5 mb-0.5">
        <span className="text-[7px] font-bold text-slate-500 tracking-widest uppercase">{dateStr}</span>
        <span className="text-[7px] font-black text-emerald-400/80 tracking-widest uppercase">{timeStr}</span>
      </div>
      
      <div className="w-full flex justify-between items-center px-1.5 py-0.5 border-b border-white/5 h-1/2">
         <div className="flex items-center gap-1.5">
           {getFlag(match.home_team) ? <img src={getFlag(match.home_team)!} className="w-3 h-2 object-cover rounded-[1px] shadow-sm" alt="" /> : <div className="w-3 h-2 bg-white/5 rounded-[1px]" />}
           <span className={`text-[9px] font-bold uppercase tracking-tight ${hWin ? "text-emerald-400" : "text-white"}`}>{getTeamLabel(match.home_team)}</span>
         </div>
         <span className={`text-[10px] font-black tabular-nums ${hWin ? "text-emerald-400" : "text-slate-300"}`}>{match.settled ? match.home_score : "-"}</span>
      </div>
      
      <div className="w-full flex justify-between items-center px-1.5 py-0.5 h-1/2">
         <div className="flex items-center gap-1.5">
           {getFlag(match.away_team) ? <img src={getFlag(match.away_team)!} className="w-3 h-2 object-cover rounded-[1px] shadow-sm" alt="" /> : <div className="w-3 h-2 bg-white/5 rounded-[1px]" />}
           <span className={`text-[9px] font-bold uppercase tracking-tight ${aWin ? "text-emerald-400" : "text-white"}`}>{getTeamLabel(match.away_team)}</span>
         </div>
         <span className={`text-[10px] font-black tabular-nums ${aWin ? "text-emerald-400" : "text-slate-300"}`}>{match.settled ? match.away_score : "-"}</span>
      </div>
    </div>
  );
};

const MatchWrapper = ({ children, height }: { children: React.ReactNode, height: number }) => (
  <div style={{ height: `${height}px` }} className="flex flex-col justify-center items-center w-full relative z-10">
    {children}
  </div>
);

const ForkRight = ({ height }: { height: number }) => (
  <div style={{ height: `${height}px` }} className="flex flex-col justify-center items-end w-6 relative">
     <div className="w-1/2 h-1/2 border-white/10 border-t-[1.5px] border-b-[1.5px] border-r-[1.5px] rounded-r-md relative">
        <div className="absolute top-1/2 left-full w-3 h-[1.5px] bg-white/10 -mt-[0.75px]" />
     </div>
  </div>
);

const ForkLeft = ({ height }: { height: number }) => (
  <div style={{ height: `${height}px` }} className="flex flex-col justify-center items-start w-6 relative">
     <div className="w-1/2 h-1/2 border-white/10 border-t-[1.5px] border-b-[1.5px] border-l-[1.5px] rounded-l-md relative">
        <div className="absolute top-1/2 right-full w-3 h-[1.5px] bg-white/10 -mt-[0.75px]" />
     </div>
  </div>
);

const SingleLine = ({ height }: { height: number }) => (
  <div style={{ height: `${height}px` }} className="flex flex-col justify-center items-center w-4 relative">
     <div className="w-full h-[1.5px] bg-white/10" />
  </div>
);

function KnockoutBracket({ matches }: { matches: any[] }) {
  const r32 = (matches || []).filter(m => m.sub_phase === 'r32').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const r16 = (matches || []).filter(m => m.sub_phase === 'r16').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const qf = (matches || []).filter(m => m.sub_phase === 'quarter').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const sf = (matches || []).filter(m => m.sub_phase === 'semi').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const bronze = (matches || []).find(m => m.sub_phase === 'bronze');
  const final = (matches || []).find(m => m.sub_phase === 'final');

  const matchMap: Record<string, any> = {
    "M73": r32[0], "M74": r32[1], "M75": r32[2], "M76": r32[3],
    "M77": r32[4], "M78": r32[5], "M79": r32[6], "M80": r32[7],
    "M81": r32[8], "M82": r32[9], "M83": r32[10], "M84": r32[11],
    "M85": r32[12], "M86": r32[13], "M87": r32[14], "M88": r32[15],
    "M89": r16[0], "M90": r16[1], "M91": r16[2], "M92": r16[3],
    "M93": r16[4], "M94": r16[5], "M95": r16[6], "M96": r16[7],
    "M97": qf[0], "M98": qf[1], "M99": qf[2], "M100": qf[3],
    "M101": sf[0], "M102": sf[1],
    "M103": bronze, "M104": final
  };

  const H = 64; 

  return (
    <div className="bg-[#0b0d14] border border-white/5 rounded-3xl p-8 overflow-x-auto shadow-2xl scrollbar-hide">
      <div className="flex min-w-[1200px] mb-4 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center justify-between">
         <div className="w-[130px]">Round of 32</div>
         <div className="w-[130px]">Round of 16</div>
         <div className="w-[130px]">Quarter-Final</div>
         <div className="w-[130px]">Semi-Final</div>
         <div className="w-[160px] text-emerald-400/50">The Final</div>
         <div className="w-[130px]">Semi-Final</div>
         <div className="w-[130px]">Quarter-Final</div>
         <div className="w-[130px]">Round of 16</div>
         <div className="w-[130px]">Round of 32</div>
      </div>
      
      <div className="flex min-w-[1200px] justify-between items-center text-center">
        
        {/* LEFT PATH */}
        <div className="flex w-[130px] flex-col">
          {["M74", "M77", "M73", "M75", "M83", "M84", "M81", "M82"].map(id => <MatchWrapper key={id} height={H}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}
        </div>
        <div className="flex flex-col">{Array(4).fill(0).map((_,i) => <ForkRight key={i} height={H*2} />)}</div>
        <div className="flex w-[130px] flex-col">
          {["M89", "M90", "M93", "M94"].map(id => <MatchWrapper key={id} height={H*2}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}
        </div>
        <div className="flex flex-col">{Array(2).fill(0).map((_,i) => <ForkRight key={i} height={H*4} />)}</div>
        <div className="flex w-[130px] flex-col">
          {["M97", "M98"].map(id => <MatchWrapper key={id} height={H*4}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}
        </div>
        <div className="flex flex-col"><ForkRight height={H*8} /></div>
        <div className="flex w-[130px] flex-col">
          {["M101"].map(id => <MatchWrapper key={id} height={H*8}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}
        </div>
        <SingleLine height={H*8} />

        {/* CENTER PATH */}
        <div className="flex flex-col justify-center items-center w-[160px] relative z-10" style={{ height: `${H*8}px` }}>
           <div className="absolute top-[12%] flex flex-col items-center">
              <Trophy className="w-10 h-10 text-emerald-500 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
           </div>
           <BracketMatch match={matchMap["M104"]} />
           <div className="absolute bottom-[12%] flex flex-col items-center w-full">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2 border-b border-white/5 pb-1">3rd Place Match</span>
              <BracketMatch match={matchMap["M103"]} />
           </div>
        </div>

        {/* RIGHT PATH */}
        <SingleLine height={H*8} />
        <div className="flex w-[130px] flex-col">
          {["M102"].map(id => <MatchWrapper key={id} height={H*8}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}
        </div>
        <div className="flex flex-col"><ForkLeft height={H*8} /></div>
        <div className="flex w-[130px] flex-col">
          {["M99", "M100"].map(id => <MatchWrapper key={id} height={H*4}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}
        </div>
        <div className="flex flex-col">{Array(2).fill(0).map((_,i) => <ForkLeft key={i} height={H*4} />)}</div>
        <div className="flex w-[130px] flex-col">
          {["M91", "M92", "M95", "M96"].map(id => <MatchWrapper key={id} height={H*2}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}
        </div>
        <div className="flex flex-col">{Array(4).fill(0).map((_,i) => <ForkLeft key={i} height={H*2} />)}</div>
        <div className="flex w-[130px] flex-col">
          {["M76", "M78", "M79", "M80", "M86", "M88", "M85", "M87"].map(id => <MatchWrapper key={id} height={H}><BracketMatch match={matchMap[id]} /></MatchWrapper>)}
        </div>

      </div>
    </div>
  );
}

function TopPerformers({ players }: { players: any[] }) {
  const scorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 10);
  const assisters = [...players].sort((a, b) => b.assists - a.assists).slice(0, 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-lg">
        <h3 className="p-6 text-xl font-black text-emerald-400 uppercase italic flex items-center gap-3">
          <Goal className="w-6 h-6" /> Golden Boot
        </h3>
        {scorers.length === 0 && <p className="text-center p-8 text-xs font-bold text-slate-500 uppercase tracking-widest">No stats yet.</p>}
        {scorers.map((p, i) => (
          <div key={p.id} className="px-6 py-4 flex justify-between items-center border-t border-white/5 last:border-0 hover:bg-white/5">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-black italic w-4">{i + 1}</span>
              <div>
                <p className="font-black text-white uppercase leading-none tracking-tight">{p.name}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{p.team}</p>
              </div>
            </div>
            <span className="text-2xl font-black text-emerald-400 italic tabular-nums">{p.goals}</span>
          </div>
        ))}
      </section>

      <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-lg">
        <h3 className="p-6 text-xl font-black text-amber-400 uppercase italic flex items-center gap-3">
          <Star className="w-6 h-6" /> Assist Kings
        </h3>
        {assisters.length === 0 && <p className="text-center p-8 text-xs font-bold text-slate-500 uppercase tracking-widest">No stats yet.</p>}
        {assisters.map((p, i) => (
          <div key={p.id} className="px-6 py-4 flex justify-between items-center border-t border-white/5 last:border-0 hover:bg-white/5">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-black italic w-4">{i + 1}</span>
              <div>
                <p className="font-black text-white uppercase leading-none tracking-tight">{p.name}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{p.team}</p>
              </div>
            </div>
            <span className="text-2xl font-black text-amber-400 italic tabular-nums">{p.assists}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

// --- REMAINING UTILS (Admin, Welcome, Leaderboard, etc.) ---
function AdminPanel({ matches }: any) {
  const [scores, setScores] = useState<any>({});
  const [newPlayer, setNewPlayer] = useState({ name: "", team: "", goals: 0, assists: 0 });

  const addPlayer = async () => {
    if (!newPlayer.name || !newPlayer.team) return alert("Fill in name and team!");
    const { error } = await supabase.from("tournament_players").insert(newPlayer);
    if(error) alert(error.message);
    else { alert("Player added/updated!"); setNewPlayer({ name: "", team: "", goals: 0, assists: 0 }); }
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6">
        <h2 className="text-amber-400 font-black text-xl mb-6 uppercase italic underline flex items-center gap-2 tracking-tight leading-none"><Shield className="w-5 h-5" /> Admin: Match Scores</h2>
        <div className="space-y-4">
          {matches.filter((m: any) => !m.settled).map((m: any) => (
            <div key={m.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center group">
              <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 group-hover:text-white">{m.home_team} vs {m.away_team} ({m.sub_phase})</span>
              <div className="flex gap-2">
                <input type="number" placeholder="H" className="w-10 bg-white/5 rounded p-1 text-center text-white" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], h: e.target.value}})} />
                <input type="number" placeholder="A" className="w-10 bg-white/5 rounded p-1 text-center text-white" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], a: e.target.value}})} />
                {m.phase > 1 && (
                  <select className="w-16 bg-white/5 rounded p-1 text-[9px] text-white" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], pw: e.target.value}})}>
                    <option value="">PW?</option>
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                  </select>
                )}
                <button onClick={() => settleMatch(m)} className="bg-emerald-500 text-black px-4 py-1 rounded font-black uppercase text-[9px] italic shadow-md">Settle</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-2xl p-6">
        <h2 className="text-emerald-400 font-black text-xl mb-6 uppercase italic underline flex items-center gap-2 tracking-tight leading-none"><Users className="w-5 h-5" /> Admin: Player Stats</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Player Name" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})} />
          <input type="text" placeholder="Team" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" onChange={(e) => setNewPlayer({...newPlayer, team: e.target.value})} />
          <input type="number" placeholder="Goals" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" onChange={(e) => setNewPlayer({...newPlayer, goals: parseInt(e.target.value) || 0})} />
          <input type="number" placeholder="Assists" className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" onChange={(e) => setNewPlayer({...newPlayer, assists: parseInt(e.target.value) || 0})} />
        </div>
        <button onClick={addPlayer} className="w-full bg-emerald-500 text-black py-3 rounded-xl font-black uppercase text-xs tracking-widest">Update Player Database</button>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`flex-1 min-w-[90px] py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition ${active ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-slate-300"}`}>
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
        <button onClick={onClose} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase mt-10 tracking-[0.2em] text-xs hover:scale-[1.02] transition-all shadow-md">Let's Get Started</button>
      </div>
    </div>
  );
}

// --- MATCH LIST & RESULTS LOGIC ---
function MatchList({ matches, tab, setTab, userId }: any) {
  const now = new Date();
  
  let lockTime: Date | null = null;
  let isPending = false;
  let matchesLocked = false;
  let filtered = [];

  if (tab === 6) { // Results Tab
    lockTime = null; 
    matchesLocked = true; 
    filtered = matches.filter((m: any) => m.settled).sort((a,b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime()); 
  } else {
    const groupEnd = matches.filter((m: any) => m?.sub_phase === 'group').slice(-1)[0];
    const r32End = matches.filter((m: any) => m?.sub_phase === 'r32').slice(-1)[0];
    const r16End = matches.filter((m: any) => m?.sub_phase === 'r16').slice(-1)[0];
    const sfEnd = matches.filter((m: any) => m?.sub_phase === 'semi').slice(-1)[0];

    const firstR32 = matches.find((m: any) => m?.sub_phase === 'r32');
    const firstR16 = matches.find((m: any) => m?.sub_phase === 'r16');
    const firstQF = matches.find((m: any) => m?.sub_phase === 'quarter');
    const firstFinal = matches.find((m: any) => m?.sub_phase === 'bronze' || m?.sub_phase === 'final');

    if (tab === 1) { 
      lockTime = TOURNAMENT_START; matchesLocked = now > TOURNAMENT_START; 
      filtered = matches.filter((m: any) => m?.sub_phase === 'group' && !m.settled); 
    } 
    else if (tab === 2) { 
      if (groupEnd && now < new Date(groupEnd.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = firstR32 ? new Date(firstR32.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } 
      filtered = matches.filter((m: any) => m?.sub_phase === 'r32' && !m.settled); 
    } 
    else if (tab === 3) { 
      if (r32End && now < new Date(r32End.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = firstR16 ? new Date(firstR16.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } 
      filtered = matches.filter((m: any) => m?.sub_phase === 'r16' && !m.settled); 
    } 
    else if (tab === 4) { 
      if (r16End && now < new Date(r16End.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = firstQF ? new Date(firstQF.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } 
      filtered = matches.filter((m: any) => (m?.sub_phase === 'quarter' || m?.sub_phase === 'semi') && !m.settled); 
    } 
    else if (tab === 5) { 
      if (sfEnd && now < new Date(sfEnd.kickoff_time)) { isPending = true; matchesLocked = true; } else { lockTime = firstFinal ? new Date(firstFinal.kickoff_time) : null; matchesLocked = lockTime ? now > lockTime : true; } 
      filtered = matches.filter((m: any) => (m?.sub_phase === 'bronze' || m?.sub_phase === 'final') && !m.settled); 
    }
  }

  const roundLabels = ["", "Group Stage", "Round of 32", "Round of 16", "Quarter & Semi Finals", "Gold & Bronze Finals", "Results"];

  return (
    <div className="max-w-5xl mx-auto">
      {tab !== 6 && <CountdownTimer targetDate={lockTime} label={`Locking ${roundLabels[tab]} in`} isPending={isPending} />}
      
      <div className="flex gap-4 mb-8 border-b border-white/5 overflow-x-auto pb-2 scrollbar-hide">
        <PhaseTab id={1} label="Group Stage" active={tab === 1} onClick={setTab} />
        <PhaseTab id={2} label="Round of 32" active={tab === 2} onClick={setTab} />
        <PhaseTab id={3} label="Round of 16" active={tab === 3} onClick={setTab} />
        <PhaseTab id={4} label="Quarter & Semi Finals" active={tab === 4} onClick={setTab} />
        <PhaseTab id={5} label="Gold & Bronze Finals" active={tab === 5} onClick={setTab} />
        <PhaseTab id={6} label="Results" active={tab === 6} onClick={setTab} />
      </div>
      
      <div className="grid gap-4">
        {filtered.map((m: any) => <MatchCard key={m.id} match={m} userId={userId} locked={matchesLocked} isPending={isPending} />)}
        {filtered.length === 0 && (
          <div className="py-20 text-center text-slate-700 font-black uppercase text-[10px] tracking-widest italic">
             {tab === 6 ? "No matches have finished yet." : !isPending ? "No matches remaining in this round." : "Waiting for previous round..."}
          </div>
        )}
      </div>
    </div>
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
    <div className={`bg-white/5 border rounded-2xl p-6 transition-all relative ${locked ? "border-white/5 opacity-60 grayscale-[0.5]" : "border-white/10 hover:border-emerald-500/30"}`}>
      {/* Actual Score Badge when settled */}
      {match.settled && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-widest shadow-sm">
          FT: {match.home_score} - {match.away_score}
          {match.penalty_winner_actual ? ` (${match.penalty_winner_actual === 'home' ? getTeamLabel(match.home_team) : getTeamLabel(match.away_team)} pens)` : ''}
        </div>
      )}

      <div className="flex justify-between items-center mb-4 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 leading-none">{locked && !match.settled && <Clock className="w-3 h-3 text-rose-500" />}{new Date(match.kickoff_time).toLocaleString('sv-SE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="bg-white/5 text-slate-400 text-[8px] font-black px-2 py-0.5 rounded uppercase italic">{match.group_name || match.sub_phase}</span>
          {isPending && <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 italic"><Lock className="w-2 h-2" /> View Only</span>}
        </div>
        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest leading-none shadow-emerald-500/10 mr-12">{match.channel}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
          {getFlag(match.home_team) ? <img src={getFlag(match.home_team)!} className="w-10 h-6 object-cover rounded shadow-md" alt="" /> : <Users className="w-10 h-6 text-slate-700" />}
          <span className={`font-black text-xs uppercase text-center truncate w-full tracking-tight ${!getFlag(match.home_team) ? "text-slate-500 italic text-[10px]" : ""}`}>{match.home_team}</span>
        </div>
        <div className="flex gap-2">
          <input type="number" min="0" disabled={locked} value={pred.h} onBlur={save} onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
            onChange={(e) => setPred({...pred, h: e.target.value.replace(/[^0-9]/g, "")})} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:border-emerald-400 outline-none shadow-inner disabled:text-slate-500" placeholder="-" />
          <input type="number" min="0" disabled={locked} value={pred.a} onBlur={save} onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
            onChange={(e) => setPred({...pred, a: e.target.value.replace(/[^0-9]/g, "")})} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:border-emerald-400 outline-none shadow-inner disabled:text-slate-500" placeholder="-" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
          {getFlag(match.away_team) ? <img src={getFlag(match.away_team)!} className="w-10 h-6 object-cover rounded shadow-md" alt="" /> : <Users className="w-10 h-6 text-slate-700" />}
          <span className={`font-black text-xs uppercase text-center truncate w-full tracking-tight ${!getFlag(match.away_team) ? "text-slate-500 italic text-[10px]" : ""}`}>{match.away_team}</span>
        </div>
      </div>
      {pred.h !== "" && pred.h === pred.a && match.phase > 1 && !locked && (
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 italic">Penalty Winner (+1pt)</p>
          <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
            <button onClick={() => {setPred({...pred, pw: 'home'}); save();}} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${pred.pw === 'home' ? "bg-emerald-500 text-black shadow-lg" : "text-slate-500"}`}>{match.home_team}</button>
            <button onClick={() => {setPred({...pred, pw: 'away'}); save();}} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${pred.pw === 'away' ? "bg-emerald-500 text-black shadow-lg" : "text-slate-500"}`}>{match.away_team}</button>
          </div>
        </div>
      )}
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <CountdownTimer targetDate={TOURNAMENT_START} label="Bonus Predictions Lock In" />
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12">
        <div className="flex justify-between items-start mb-2 border-b border-white/5 pb-4">
          <h2 className="text-emerald-400 font-black text-4xl uppercase italic tracking-tighter shadow-emerald-500/10">Bonus Predictions</h2>
          {isPermanentlyLocked && <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 animate-pulse shadow-md"><Lock className="w-3 h-3"/> Locked</span>}
        </div>
        <p className="text-slate-400 text-sm font-bold my-10 uppercase tracking-widest italic leading-relaxed">Put your football brain to the test and predict the following:</p>
        <div className="space-y-10">
          <BonusField label="Golden Boot: Who will score the most goals in the tournament?" points="5 points" value={form.scorer} onChange={(v) => setForm({...form, scorer: v})} disabled={isPermanentlyLocked} />
          <BonusField label="Assist King: Who will provide the most assists?" points="5 points" value={form.assister} onChange={(v) => setForm({...form, assister: v})} disabled={isPermanentlyLocked} />
          <div>
            <div className="flex justify-between items-center mb-3 ml-1"><p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Card Magnets: Which team will collect the most cards?</p><span className="text-[10px] font-black text-emerald-400">5 points</span></div>
            <select disabled={isPermanentlyLocked} value={form.cards} onChange={(e) => setForm({...form, cards: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-emerald-400 outline-none font-bold disabled:opacity-50">
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <BonusField label="Tournament MVP: Who will be crowned player of the tournament?" points="5 points" value={form.mvp} onChange={(v) => setForm({...form, mvp: v})} disabled={isPermanentlyLocked} />
          <div>
            <div className="flex justify-between items-end mb-3 ml-1">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight pr-4">Goal Rush: How many goals will be scored in total during the tournament? (including extra time, excluding penalty shootouts)</p>
              <div className="text-right text-[10px] font-black text-emerald-400 leading-tight whitespace-nowrap">Closest guess: 5 pts <br/> Exactly right: 10 pts</div>
            </div>
            <input type="number" value={form.goals} disabled={isPermanentlyLocked} onChange={(e) => setForm({...form, goals: e.target.value.replace(/[^0-9]/g, "")})} onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-emerald-400 outline-none font-bold italic disabled:opacity-50 shadow-inner" />
          </div>
          {!isPermanentlyLocked && <button onClick={save} className="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black uppercase mt-6 tracking-[0.2em] shadow-lg italic">Save & Unlock Matches</button>}
        </div>
      </div>
    </div>
  );
}

function BonusField({ label, points, value, onChange, disabled, type="text" }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3 ml-1">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <span className="text-[10px] font-black text-emerald-400 whitespace-nowrap pl-4">{points}</span>
      </div>
      <input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-emerald-400 outline-none font-bold italic disabled:opacity-50 shadow-inner" />
    </div>
  );
}

function CountdownTimer({ targetDate, label, isPending }: any) {
  const [timeLeft, setTimeLeft] = useState<any>(null);
  useEffect(() => {
    if (!targetDate || isPending || isNaN(targetDate.getTime())) {
      if(!isPending && targetDate) setTimeLeft("LOCKED");
      return;
    }
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
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center mb-6 shadow-md shadow-emerald-500/5">
      <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-[0.2em] shadow-emerald-500/10">{label}</p>
      {isPending ? (
        <span className="text-slate-500 font-black uppercase text-xs flex items-center gap-2 tracking-[0.2em]"><Lock className="w-3 h-3" /> Waiting...</span>
      ) : timeLeft === "LOCKED" ? (
        <span className="text-rose-500 font-black uppercase text-sm tracking-widest animate-pulse flex items-center gap-2"><Lock className="w-4 h-4"/> Locked</span>
      ) : timeLeft ? (
        <div className="flex gap-4 text-white font-black italic shadow-emerald-500/10">
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
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden max-w-5xl mx-auto shadow-xl">
      <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap pl-6"><span>Player / Rank</span><span>Total Points</span></div>
      {list.map((p: any, i) => (
        <div key={p.id} className={`p-6 flex justify-between items-center transition-colors hover:bg-white/5 ${i < 3 ? "bg-emerald-500/5" : ""}`}>
          <div className="flex items-center gap-4">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shadow-md ${i === 0 ? "bg-amber-400 text-black shadow-amber-400/20" : i === 1 ? "bg-slate-400 text-black shadow-slate-400/20" : i === 2 ? "bg-orange-800 text-black shadow-orange-800/20" : "bg-white/10"}`}>{i + 1}</span>
            <span className="font-black uppercase text-lg tracking-tight whitespace-nowrap">{p.username}</span>
          </div>
          <span className="text-amber-400 font-black text-2xl italic tabular-nums leading-none tracking-tight">{p.total_points}</span>
        </div>
      ))}
    </div>
  );
}

function RulesPage() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-10 max-w-5xl mx-auto shadow-xl">
      <h3 className="text-emerald-400 font-black uppercase italic text-xl underline tracking-widest shadow-emerald-500/10 leading-none">Scoring Engine</h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Group Stage</span> 1pt (Winner Outcome) / 2pt (Score)</li>
        <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">R32, R16 & QF</span> 2pt (Winner Outcome) / 3pt (Score)</li>
        <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Semi Finals</span> 3pt (Winner Outcome) / 4pt (Score)</li>
        <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Bronze Match</span> 4pt (Winner Outcome) / 5pt (Score)</li>
        <li className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="text-white block mb-1">Gold Final</span> 5pt (Winner Outcome) / 6pt (Score)</li>
      </ul>
      <p className="text-xs font-bold text-slate-500 italic mt-6">*Outcome means correctly picking the correct winner of the match, or a draw in the group stages. Perfect Score means correctly guessing the final scoreline. Perfect Score points supersede Outcome points.</p>
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
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic leading-none shadow-emerald-500/10">World Cup <span className="text-emerald-400">2026</span></h1>
        <form onSubmit={handle} className="mt-8 space-y-3">
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none focus:border-emerald-400 font-bold focus:bg-emerald-500/5 shadow-inner" onChange={(e) => setForm({...form, e: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none focus:border-emerald-400 font-bold focus:bg-emerald-500/5 shadow-inner" onChange={(e) => setForm({...form, p: e.target.value})} />
          <button type="submit" className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-md hover:scale-[1.02] transition-transform italic text-xs">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        {err && <p className="text-rose-400 text-[10px] font-bold mt-4 uppercase animate-pulse">{err}</p>}
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-6 text-[10px] font-black uppercase text-slate-500 underline decoration-emerald-500/10 hover:text-white transition-colors italic tracking-widest">{mode === 'login' ? 'Need an account? Sign Up' : 'Already have one? Sign In'}</button>
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
        <h2 className="text-2xl font-black text-white mb-6 uppercase italic tracking-widest underline decoration-emerald-500/10 shadow-emerald-500/10 leading-none">Choose Player Name</h2>
        <input type="text" placeholder="e.g. Zlatan" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center focus:border-emerald-400 focus:bg-emerald-500/5 outline-none font-bold italic shadow-inner" />
        <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase mt-6 shadow-lg tracking-[0.2em] italic hover:scale-[1.02] transition-transform text-xs">Start Tournament</button>
      </div>
    </div>
  );
}
