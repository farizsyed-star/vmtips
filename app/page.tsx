"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Shield, LogOut, Clock, Globe, AlertCircle, Lock, Users, Sparkles, Goal, Star, Target, CheckCircle, X, Info } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
const ADMIN_EMAIL = "fariz.syed@gmail.com";

// --- TOURNAMENT CONFIG ---
const DEADLINES: Record<string, Date> = {
  GROUP: new Date("2026-06-11T21:00:00+02:00"),
  BONUS: new Date("2026-06-11T21:00:00+02:00"),
  R32: new Date("2026-06-28T18:00:00+02:00"),
  R16: new Date("2026-07-04T18:00:00+02:00"),
  QF: new Date("2026-07-09T21:00:00+02:00"),
  SF: new Date("2026-07-14T21:00:00+02:00"),
  FINALS: new Date("2026-07-18T21:00:00+02:00"),
};

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
  "saudi arabia": "KSA", "iran": "IRN", "qatar": "QAT", "costa rica": "CRC", "panama": "PAN"
};

const FULL_COUNTRIES = [
  "Algeria", "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Cameroon", "Canada", "Chile", "Colombia", "Costa Rica", "Croatia", "Czech Republic", "Denmark", "Ecuador", "Egypt", "England", "France", "Germany", "Ghana", "Greece", "Hungary", "Iran", "Italy", "Ivory Coast", "Japan", "Mexico", "Morocco", "Netherlands", "Nigeria", "Norway", "Panama", "Paraguay", "Peru", "Poland", "Portugal", "Qatar", "Saudi Arabia", "Scotland", "Senegal", "Serbia", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Tunisia", "Turkey", "USA", "Ukraine", "Uruguay", "Venezuela", "Wales"
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
    "costa rica": "cr", "panama": "pa"
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
      setMatches(data || []);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    setUser(null);
    setProfile(null);
    setView("loading");
    await supabase.auth.signOut();
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
            <Trophy className="text-emerald-500 w-6 h-6" />
            <h1 className="font-black text-xl text-white uppercase italic tracking-tighter leading-none">
              World Cup '26<br/>
              <span className="text-emerald-400 text-[10px] tracking-widest block mt-0.5">Couch Potato Edition</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] text-slate-500 uppercase font-black leading-none tracking-widest">Points</p>
              <p className="text-amber-400 font-black text-xl leading-none">{profile?.total_points || 0}</p>
            </div>
            {user?.email === ADMIN_EMAIL && <Shield onClick={() => setView("admin")} className="cursor-pointer hover:text-amber-400 w-5 h-5" />}
            <LogOut onClick={handleLogout} className="cursor-pointer hover:text-white w-5 h-5 text-slate-500" />
          </div>
        </header>

        <nav className="max-w-[1400px] mx-auto px-4 pb-4 flex gap-1 overflow-x-auto scrollbar-hide">
          <NavBtn active={view === "matches"} onClick={() => bonusCompleted && setView("matches")} label="Matches" disabled={!bonusCompleted} />
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
        {view === "admin" && <AdminPanel matches={matches} />}
      </main>
    </div>
  );
}

// --- DYNAMIC STICKY CONTENT ---
const getStickyContent = (tab: number) => {
  switch (tab) {
    case 1: return { 
      title: "Group Stage", 
      play: "Keep it simple for the group stages. Just predict the 90-minute outcome: Home Win (1), Draw (X), or Away Win (2). Look for the green checkmark to ensure your auto-save was successful.",
      tip: "Slow and steady. You get 1 point for every correct outcome."
    };
    case 2: return { 
      title: "Round of 32", 
      play: "The knockouts begin! Forget about the exact scoreline—just predict which team will advance to the next round, regardless of whether they win in regular time, extra time, or on penalties. Choose the Home team (1) or the Away team (2).",
      tip: "The stakes are higher now. You get 2 points for picking the correct advancing team."
    };
    case 3: return { 
      title: "Round of 16", 
      play: "Time to get specific. Enter your predicted exact scoreline. If you think the match will go to penalties, predict a draw score and then choose the advancing team.",
      tip: "You get 3 points for the correct outcome, but if you nail the exact scoreline, you get a massive 5 points!"
    };
    case 4: return { 
      title: "Quarter & Semi Finals", 
      play: "The pressure is on! Enter your predicted exact scoreline. If you think the match will go to penalties, predict a draw score and then choose the advancing team.",
      tip: "You get 4 points for the correct outcome. Predict the exact scoreline perfectly to score 6 points instead!"
    };
    case 5: return { 
      title: "Gold & Bronze Finals", 
      play: "Ultimate bragging rights are on the line. Enter your predicted exact scoreline. If you think the match will go to penalties, predict a draw score and then choose the advancing team.",
      tip: "You get 5 points for the correct outcome. Nail the exact scoreline for the maximum 7 points!"
    };
    case 6: return { 
      title: "Results", 
      play: "The dust has settled. This tab shows all the completed matches, their official final scores, and who won on penalties.",
      tip: "Matches automatically move here once they are settled. Check the Leaderboard tab to see how these results impacted your ranking!"
    };
    default: return null;
  }
};

// --- MATCH LIST & CARDS ---
function MatchList({ matches, tab, setTab, userId }: any) {
  const now = new Date();
  
  // Calculate lockout based on Hard Deadlines
  let lockTime = DEADLINES.GROUP;
  if (tab === 2) lockTime = DEADLINES.R32;
  else if (tab === 3) lockTime = DEADLINES.R16;
  else if (tab === 4) lockTime = DEADLINES.QF;
  else if (tab === 5) lockTime = DEADLINES.FINALS;

  const matchesLocked = now > lockTime;

  let filtered = [];
  if (tab === 1) filtered = matches.filter((m: any) => m.sub_phase === 'group' && !m.settled);
  else if (tab === 2) filtered = matches.filter((m: any) => m.sub_phase === 'r32' && !m.settled);
  else if (tab === 3) filtered = matches.filter((m: any) => m.sub_phase === 'r16' && !m.settled);
  else if (tab === 4) filtered = matches.filter((m: any) => (m.sub_phase === 'quarter' || m.sub_phase === 'semi') && !m.settled);
  else if (tab === 5) filtered = matches.filter((m: any) => (m.sub_phase === 'bronze' || m.sub_phase === 'final') && !m.settled);
  else filtered = matches.filter((m: any) => m.settled).sort((a,b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime());

  const sticky = getStickyContent(tab);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* LEFT STICKY */}
      <div className="hidden lg:block sticky top-[100px] space-y-4">
        <div className="bg-[#12151c] border border-white/5 rounded-2xl p-6 shadow-xl">
          <h3 className="text-emerald-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-xs">
            <Info className="w-4 h-4"/> {sticky?.title}
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{sticky?.play}</p>
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3"/> Scoring Tip
            </p>
            <p className="text-[10px] text-slate-300 leading-relaxed">{sticky?.tip}</p>
          </div>
        </div>
      </div>

      {/* CENTER CONTENT */}
      <div className="col-span-1 lg:col-span-2">
        <div className="sticky top-[100px] z-40 bg-[#07090d]/95 backdrop-blur-xl pt-2 pb-2 border-b border-white/5 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4, 5, 6].map((id) => (
              <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${tab === id ? "border-b-2 border-emerald-400 text-white" : "text-slate-600"}`}>
                {id === 6 ? "Results" : id === 4 ? "QF & Semi" : id === 5 ? "Finals" : id === 1 ? "Group Stage" : id === 2 ? "Round of 32" : "Round of 16"}
              </button>
            ))}
          </div>
        </div>
        {tab !== 6 && <CountdownTimer targetDate={lockTime} label="Round Locks In" />}
        <div className="grid gap-4">
          {filtered.map((m: any) => <MatchCard key={m.id} match={m} userId={userId} locked={matchesLocked} tab={tab} />)}
        </div>
      </div>

      {/* RIGHT STICKY */}
      <div className="hidden lg:block sticky top-[100px] bg-[#12151c] border border-white/5 rounded-2xl p-6 shadow-xl">
        <h3 className="text-amber-400 font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-xs">
          <Trophy className="w-4 h-4"/> Top 5 Leaders
        </h3>
        <MiniLeaderboard />
      </div>
    </div>
  );
}

function MatchCard({ match, userId, locked, tab }: any) {
  const [pred, setPred] = useState({ h: "", a: "", pw: "" });
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    supabase.from("predictions").select("*").eq("user_id", userId).eq("match_id", match.id).single().then(({ data }) => {
      if (data) setPred({ h: data.pred_home.toString(), a: data.pred_away.toString(), pw: data.penalty_winner_pred || "" });
      setInitialLoad(false);
    });
  }, [match.id, userId]);

  useEffect(() => {
    if (initialLoad || locked || pred.h === "" || pred.a === "") return;
    const timer = setTimeout(async () => {
      await supabase.from("predictions").upsert({ 
        user_id: userId, match_id: match.id, pred_home: parseInt(pred.h), pred_away: parseInt(pred.a), penalty_winner_pred: pred.pw 
      }, { onConflict: 'user_id,match_id' });
    }, 500); 
    return () => clearTimeout(timer);
  }, [pred, initialLoad, locked]);

  const isGroup = tab === 1;
  const isR32 = tab === 2;
  const isDraw = pred.h !== "" && pred.a !== "" && pred.h === pred.a;
  const showPens = !isGroup && !isR32 && isDraw;
  const active1X2 = (pred.h !== "" && pred.a !== "") 
    ? (parseInt(pred.h) > parseInt(pred.a) ? '1' : parseInt(pred.h) < parseInt(pred.a) ? '2' : 'X') 
    : null;

  return (
    <div className={`bg-white/5 border rounded-2xl p-6 relative transition-all ${locked ? "border-white/5 opacity-60" : "border-white/10"}`}>
      {match.settled && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-widest">
          FT: {match.home_score} - {match.away_score}
        </div>
      )}
      <div className="flex justify-between items-center mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <span>{new Date(match.kickoff_time).toLocaleDateString('sv-SE', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        <span className="text-emerald-400">{match.channel}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center gap-2">
          <img src={getFlag(match.home_team) || ""} className="w-10 h-6 object-cover rounded shadow-md" alt="" />
          <span className="font-black text-[11px] uppercase truncate w-full text-center">{match.home_team}</span>
        </div>

        <div className="flex items-center gap-2">
          {isGroup || isR32 ? (
            <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 h-12 items-center">
              <button disabled={locked} onClick={() => setPred({h: "1", a: "0", pw: ""})} className={`w-10 h-full rounded-lg text-xs font-black ${active1X2 === '1' ? "bg-emerald-500 text-black" : "text-slate-500"}`}>1</button>
              {isGroup && <button disabled={locked} onClick={() => setPred({h: "0", a: "0", pw: ""})} className={`w-10 h-full rounded-lg text-xs font-black ${active1X2 === 'X' ? "bg-emerald-500 text-black" : "text-slate-500"}`}>X</button>}
              <button disabled={locked} onClick={() => setPred({h: "0", a: "1", pw: ""})} className={`w-10 h-full rounded-lg text-xs font-black ${active1X2 === '2' ? "bg-emerald-500 text-black" : "text-slate-500"}`}>2</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input type="number" disabled={locked} value={pred.h} onChange={(e) => setPred({...pred, h: e.target.value})} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white outline-none focus:border-emerald-400" />
              <input type="number" disabled={locked} value={pred.a} onChange={(e) => setPred({...pred, a: e.target.value})} className="w-12 h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white outline-none focus:border-emerald-400" />
            </div>
          )}
          <div className="w-6 flex justify-center">{!locked && pred.h !== "" && pred.a !== "" && <CheckCircle className="w-5 h-5 text-emerald-400" />}</div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2">
          <img src={getFlag(match.away_team) || ""} className="w-10 h-6 object-cover rounded shadow-md" alt="" />
          <span className="font-black text-[11px] uppercase truncate w-full text-center">{match.away_team}</span>
        </div>
      </div>

      {showPens && !locked && (
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 italic">Advance via Penalties?</p>
          <div className="flex gap-2">
            <button onClick={() => setPred({...pred, pw: 'home'})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${pred.pw === 'home' ? "bg-emerald-500 text-black" : "bg-white/5 text-slate-500"}`}>{match.home_team}</button>
            <button onClick={() => setPred({...pred, pw: 'away'})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${pred.pw === 'away' ? "bg-emerald-500 text-black" : "bg-white/5 text-slate-500"}`}>{match.away_team}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- RULES PAGE ---
function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* SECTION 1 */}
      <section>
        <h2 className="text-emerald-400 font-black text-2xl uppercase italic tracking-tighter mb-6 flex items-center gap-3">
          <Clock className="w-6 h-6" /> Lock It In
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl h-fit"><Sparkles className="text-emerald-400 w-5 h-5" /></div>
            <div>
              <p className="font-black text-white uppercase text-sm mb-1 tracking-tight">No "Submit" Button, Just Vibes</p>
              <p className="text-slate-400 text-sm leading-relaxed">We use auto-save! Once you stop typing or click a button, your prediction is logged securely. Just look for the glorious green checkmark (✅) to confirm.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-rose-500/10 p-3 rounded-xl h-fit"><AlertCircle className="text-rose-400 w-5 h-5" /></div>
            <div>
              <p className="font-black text-white uppercase text-sm mb-1 tracking-tight">Snooze You Lose</p>
              <p className="text-slate-400 text-sm leading-relaxed">Forget to enter a prediction before the timer hits zero? Congratulations, you get a big fat 0 points for that match. No excuses, no VAR reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 */}
      <section>
        <h2 className="text-amber-400 font-black text-2xl uppercase italic tracking-tighter mb-6 flex items-center gap-3">
          <Trophy className="w-6 h-6" /> The Scoring Ladder
        </h2>
        <div className="grid gap-4">
          <ScoreRow label="Group Stage" desc="Pick the 90-minute outcome (1X2)" pts="Correct Outcome = 1 pt" />
          <ScoreRow label="Round of 32" desc="No draws allowed here! Just pick who advances." pts="Correct Advancing Team = 2 pts" />
          <ScoreRow label="Round of 16" desc="Predict exact scoreline (120 mins). Correct outcome = 3pts." pts="Perfect Score = 5 pts" />
          <ScoreRow label="QF & Semi Finals" desc="Higher stakes! Predict exact score (120 mins). Correct outcome = 4pts." pts="Perfect Score = 6 pts" />
          <ScoreRow label="Gold & Bronze Finals" desc="The big one! Predict exact score (120 mins). Correct outcome = 5pts." pts="Perfect Score = 7 pts" />
        </div>
        <p className="mt-6 text-xs text-slate-500 italic px-4 leading-relaxed">
          * Outcome means correctly picking the correct winner of the match, or a draw in the group stages. Perfect Score means correctly guessing the final scoreline. Perfect Score points supersede Outcome points.
        </p>
      </section>

      {/* SECTION 3 */}
      <section>
        <h2 className="text-emerald-400 font-black text-2xl uppercase italic tracking-tighter mb-6 flex items-center gap-3">
          <Clock className="w-6 h-6" /> Tournament Deadlines
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <tbody>
              <DeadlineRow label="Bonus & Group Stage" date="June 11, 2026, at 21:00" />
              <DeadlineRow label="Round of 32" date="June 28, 2026, at 18:00" />
              <DeadlineRow label="Round of 16" date="July 4, 2026, at 18:00" />
              <DeadlineRow label="Quarter-Finals" date="July 9, 2026, at 21:00" />
              <DeadlineRow label="Semi-Finals" date="July 14, 2026, at 21:00" />
              <DeadlineRow label="The Finals" date="July 18, 2026, at 21:00" />
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4 */}
      <section>
        <h2 className="text-amber-400 font-black text-2xl uppercase italic tracking-tighter mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6" /> Bonus Predictions
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <BonusCard icon="🥾" label="Golden Boot" pts="5 pts" />
          <BonusCard icon="🎯" label="Assist King" pts="5 pts" />
          <BonusCard icon="🟨" label="Card Magnets" pts="5 pts" />
          <BonusCard icon="⭐" label="Tournament MVP" pts="5 pts" />
          <div className="md:col-span-2 bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
             <div className="flex justify-between items-center">
                <div>
                  <p className="font-black text-white uppercase text-lg italic">⚽ Goal Rush</p>
                  <p className="text-slate-400 text-sm">Total tournament goals (excluding shootouts)</p>
                </div>
                <div className="text-right">
                   <p className="font-black text-emerald-400 uppercase text-xs">Closest: 5 pts</p>
                   <p className="font-black text-white uppercase text-xs">Exact: 10 pts</p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ScoreRow({ label, desc, pts }: any) {
  return (
    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex justify-between items-center hover:bg-white/[0.07] transition-colors">
      <div>
        <p className="font-black text-white uppercase tracking-tight">{label}</p>
        <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest">{desc}</p>
      </div>
      <p className="text-emerald-400 font-black italic uppercase text-xs text-right whitespace-nowrap ml-4">{pts}</p>
    </div>
  );
}

function DeadlineRow({ label, date }: any) {
  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
      <td className="p-6 font-black text-slate-300 uppercase text-xs tracking-widest">{label}</td>
      <td className="p-6 text-right font-black text-white italic text-xs uppercase">{date}</td>
    </tr>
  );
}

function BonusCard({ icon, label, pts }: any) {
  return (
    <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-white/5">
      <div className="flex items-center gap-4">
        <span className="text-2xl">{icon}</span>
        <p className="font-black text-white uppercase text-xs tracking-widest">{label}</p>
      </div>
      <p className="font-black text-amber-400 italic text-xs">{pts}</p>
    </div>
  );
}

// --- ADMIN PANEL ---
function AdminPanel({ matches }: any) {
  const [scores, setScores] = useState<any>({});
  
  const settleMatch = async (m: any) => {
    const s = scores[m.id];
    if (!s || s.h === "" || s.a === "") return alert("Enter scores!");
    if (m.phase > 1 && s.h === s.a && !s.pw && m.sub_phase !== 'r32') return alert("Select penalty winner!");

    const { data: preds } = await supabase.from("predictions").select("*").eq("match_id", m.id);
    if (!preds) return;

    for (const p of preds) {
      let pts = 0;
      const actH = parseInt(s.h);
      const actA = parseInt(s.a);
      const isExact = p.pred_home === actH && p.pred_away === actA;
      
      let isOutcome = false;
      if (m.sub_phase === 'group' || m.sub_phase === 'r32') {
        isOutcome = Math.sign(p.pred_home - p.pred_away) === Math.sign(actH - actA);
      } else {
        if (actH > actA) isOutcome = p.pred_home > p.pred_away;
        else if (actH < actA) isOutcome = p.pred_home < p.pred_away;
        else isOutcome = (p.pred_home === p.pred_away) && (p.penalty_winner_pred === s.pw);
      }

      // Updated Points Logic
      if (m.sub_phase === 'group') pts = isOutcome ? 1 : 0;
      else if (m.sub_phase === 'r32') pts = isOutcome ? 2 : 0;
      else if (m.sub_phase === 'r16') pts = isExact ? 5 : (isOutcome ? 3 : 0);
      else if (m.sub_phase === 'quarter' || m.sub_phase === 'semi') pts = isExact ? 6 : (isOutcome ? 4 : 0);
      else if (m.sub_phase === 'bronze' || m.sub_phase === 'final') pts = isExact ? 7 : (isOutcome ? 5 : 0);

      if (pts > 0) await supabase.rpc('increment_points', { user_id: p.user_id, amount: pts });
    }
    await supabase.from("matches").update({ home_score: s.h, away_score: s.a, penalty_winner_actual: s.pw, settled: true }).eq("id", m.id);
    alert(`Match Settled!`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-amber-400 font-black text-xl uppercase italic"><Shield className="inline w-5 h-5 mr-2" /> Admin</h2>
      {matches.filter((m: any) => !m.settled).map((m: any) => (
        <div key={m.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
          <span className="text-xs font-black uppercase text-slate-500">{m.home_team} vs {m.away_team} ({m.sub_phase})</span>
          <div className="flex gap-2">
            <input type="number" placeholder="H" className="w-10 bg-black rounded p-1 text-center" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], h: e.target.value}})} />
            <input type="number" placeholder="A" className="w-10 bg-black rounded p-1 text-center" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], a: e.target.value}})} />
            {m.phase > 1 && m.sub_phase !== 'r32' && (
              <select className="bg-black text-[10px]" onChange={(e) => setScores({...scores, [m.id]: {...scores[m.id], pw: e.target.value}})}>
                <option value="">PW?</option>
                <option value="home">H</option>
                <option value="away">A</option>
              </select>
            )}
            <button onClick={() => settleMatch(m)} className="bg-emerald-500 text-black px-4 py-1 rounded text-[10px] font-black uppercase">Settle</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- BONUS PAGE ---
function BonusPage({ userId, isCompleted, onSaved }: any) {
  const isLocked = new Date() > DEADLINES.BONUS || isCompleted;
  const [form, setForm] = useState({ scorer: "", assister: "", cards: "", mvp: "", goals: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("bonus_predictions").select("*").eq("user_id", userId).single().then(({ data }) => {
      if (data) setForm({ scorer: data.top_scorer, assister: data.top_assister, cards: data.most_cards_team, mvp: data.mvp, goals: data.total_goals_guess?.toString() || "" });
      setLoading(false);
    });
  }, [userId]);

  const save = async () => {
    if (isLocked || !form.goals) return;
    await supabase.from("bonus_predictions").upsert({ user_id: userId, top_scorer: form.scorer, top_assister: form.assister, most_cards_team: form.cards, mvp: form.mvp, total_goals_guess: parseInt(form.goals) });
    onSaved();
  };

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
        <h2 className="text-emerald-400 font-black text-3xl uppercase italic tracking-tighter">Bonus Predictions</h2>
        <BonusInput label="🥾 Golden Boot" pts="5 pts" val={form.scorer} onChange={(v) => setForm({...form, scorer: v})} disabled={isLocked} />
        <BonusInput label="🎯 Assist King" pts="5 pts" val={form.assister} onChange={(v) => setForm({...form, assister: v})} disabled={isLocked} />
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">🟨 Card Magnets (Most Cards Team)</label>
          <select disabled={isLocked} value={form.cards} onChange={(e) => setForm({...form, cards: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none">
            <option value="">Select Country</option>
            {FULL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <BonusInput label="⭐ Tournament MVP" pts="5 pts" val={form.mvp} onChange={(v) => setForm({...form, mvp: v})} disabled={isLocked} />
        <BonusInput label="⚽ Goal Rush (Total Tournament Goals)" pts="Closest: 5pts | Exact: 10pts" val={form.goals} onChange={(v) => setForm({...form, goals: v})} disabled={isLocked} type="number" />
        {!isLocked && <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">Unlock Matches & Save Bonuses</button>}
      </div>
    </div>
  );
}

function BonusInput({ label, pts, val, onChange, disabled, type="text" }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</label>
        <span className="text-[9px] font-black text-emerald-400 uppercase">{pts}</span>
      </div>
      <input type={type} value={val} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-emerald-400 disabled:opacity-50" />
    </div>
  );
}

// --- UTILS (Countdown, Leaderboard, Nav, Auth) ---
function CountdownTimer({ targetDate, label }: any) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const distance = targetDate.getTime() - new Date().getTime();
      if (distance < 0) setTime("LOCKED");
      else {
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        setTime(`${d}d ${h}h ${m}m`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center mb-6">
      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">{label}</p>
      <span className="text-xl font-black text-white italic">{time}</span>
    </div>
  );
}

function MiniLeaderboard() {
  const [list, setList] = useState([]);
  useEffect(() => { supabase.from("profiles").select("*").order("total_points", { ascending: false }).limit(5).then(({ data }) => setList(data as any || [])); }, []);
  return (
    <div className="space-y-4">
      {list.map((p: any, i) => (
        <div key={p.id} className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black ${i === 0 ? "bg-amber-400 text-black" : "bg-white/5 text-slate-500"}`}>{i+1}</span>
            <span className="text-[11px] font-bold text-white uppercase">{p.username}</span>
          </div>
          <span className="text-sm font-black text-emerald-400">{p.total_points}</span>
        </div>
      ))}
    </div>
  );
}

function StatsPage({ matches }: { matches: any[] }) {
  return (
    <div className="max-w-5xl mx-auto py-10 text-center">
      <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
      <h2 className="text-2xl font-black text-white uppercase italic">Live Stats & Bracket</h2>
      <p className="text-slate-500 text-sm mt-2">Bracket updates automatically as matches are settled.</p>
      {/* Visual bracket implementation here or reuse code from previous turn if needed */}
    </div>
  );
}

function Leaderboard() {
  const [list, setList] = useState([]);
  useEffect(() => { supabase.from("profiles").select("*").order("total_points", { ascending: false }).then(({ data }) => setList(data as any || [])); }, []);
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden max-w-2xl mx-auto shadow-xl">
       <div className="p-4 bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Standings</div>
       {list.map((p: any, i) => (
         <div key={p.id} className="p-6 flex justify-between items-center border-t border-white/5 hover:bg-white/5">
           <div className="flex items-center gap-4">
             <span className="font-black text-slate-600 italic text-xl w-8">{i+1}</span>
             <span className="font-black text-white text-lg uppercase">{p.username}</span>
           </div>
           <span className="text-amber-400 font-black text-2xl italic">{p.total_points}</span>
         </div>
       ))}
    </div>
  );
}

function NavBtn({ active, onClick, label, disabled }: any) {
  return (
    <button disabled={disabled} onClick={onClick} className={`flex-1 min-w-[100px] py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${disabled ? "opacity-30 cursor-not-allowed" : active ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-slate-300"}`}>{label}</button>
  );
}

function WelcomePopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl grid place-items-center p-6">
      <div className="bg-[#0f1117] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full relative shadow-2xl text-center">
        <Sparkles className="text-amber-400 w-12 h-12 mb-6 mx-auto animate-pulse" />
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">Couch Potato Edition</h2>
        <div className="space-y-4 text-slate-400 text-xs leading-relaxed mt-6 text-left">
          <p>Welcome to World Cup '26! Here is your quick round guide:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Group Stage:</strong> Predict Win/Draw/Loss outcomes.</li>
            <li><strong className="text-white">Knockouts (R32):</strong> Pick who advances. Draws are not allowed here!</li>
            <li><strong className="text-white">Final Stages (R16+):</strong> Predict exact scorelines.</li>
          </ul>
          <p className="italic">Full details on scoring and deadlines can be found in the **Rules** tab.</p>
        </div>
        <button onClick={onClose} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase mt-10 tracking-[0.2em] shadow-md">Game On</button>
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
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic leading-none">World Cup '26<br/><span className="text-emerald-400 text-2xl tracking-widest block mt-2">Couch Potato Edition</span></h1>
        <form onSubmit={handle} className="mt-8 space-y-3">
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none focus:border-emerald-400 font-bold" onChange={(e) => setForm({...form, e: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none focus:border-emerald-400 font-bold" onChange={(e) => setForm({...form, p: e.target.value})} />
          <button type="submit" className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-md">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        {err && <p className="text-rose-400 text-[10px] font-bold mt-4 uppercase">{err}</p>}
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-6 text-[10px] font-black uppercase text-slate-500 underline">{mode === 'login' ? 'Need an account? Sign Up' : 'Already have one? Sign In'}</button>
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
        <h2 className="text-2xl font-black text-white mb-6 uppercase italic tracking-widest leading-none">Choose Player Name</h2>
        <input type="text" placeholder="e.g. Zlatan" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center outline-none" />
        <button onClick={save} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase mt-6 shadow-lg tracking-[0.2em] italic">Start Tournament</button>
      </div>
    </div>
  );
}
