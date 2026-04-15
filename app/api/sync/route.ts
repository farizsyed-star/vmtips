// app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the SERVICE_ROLE_KEY here so the server has "God Mode" permissions 
// to update scores and points without being blocked by security rules.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST() {
  const RAPID_KEY = process.env.RAPIDAPI_KEY; // Pulled safely from Vercel Environment Variables
  const LEAGUE_ID = 1; // World Cup
  const SEASON = 2026;

  if (!RAPID_KEY) {
    return NextResponse.json({ error: "Missing RAPIDAPI_KEY in Vercel settings" }, { status: 500 });
  }

  try {
    // 1. Fetch latest results from API-Football
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`, {
      headers: { "x-rapidapi-key": RAPID_KEY, "x-rapidapi-host": "v3.football.api-sports.io" }
    });
    const data = await res.json();

    let settledCount = 0;

    // 2. Loop through every match the API sends back
    for (const fixture of data.response || []) {
      const status = fixture.fixture?.status?.short;
      
      // We only care about Finished matches
      if (status === "FT" || status === "AET" || status === "PEN") {
        const hScore = fixture.goals.home;
        const aScore = fixture.goals.away;
        const penHome = fixture.score?.penalty?.home;
        const penAway = fixture.score?.penalty?.away;
        const pWinner = penHome > penAway ? 'home' : penAway > penHome ? 'away' : null;

        // Find the match in your Supabase database using the api_id
        const { data: match } = await supabase.from("matches").select("*").eq("api_id", fixture.fixture.id).single();

        if (match && !match.settled) {
          // Calculate and award points for every user who predicted this match
          await calculatePointsForMatch(match, { h: hScore, a: aScore, pw: pWinner });
          settledCount++;
        }
      }
    }

    return NextResponse.json({ success: true, settledCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Internal server-side logic to calculate points
async function calculatePointsForMatch(m: any, s: { h: any; a: any; pw?: string | null }) {
  const actH = parseInt(s.h);
  const actA = parseInt(s.a);

  const { data: preds } = await supabase.from("predictions").select("*").eq("match_id", m.id);
  
  if (preds) {
    for (const p of preds) {
      let pts = 0;
      const isExact = p.pred_home === actH && p.pred_away === actA;
      let isOutcome = false;

      if (m.sub_phase === 'group') {
        isOutcome = Math.sign(p.pred_home - p.pred_away) === Math.sign(actH - actA);
        pts = isOutcome ? 1 : 0;
      } else if (m.sub_phase === 'r32') {
        const homeAdvances = actH > actA || (actH === actA && s.pw === 'home');
        const userPickedHome = p.pred_home > p.pred_away;
        isOutcome = homeAdvances === userPickedHome;
        pts = isOutcome ? 2 : 0;
      } else {
        if (actH > actA) isOutcome = p.pred_home > p.pred_away;
        else if (actH < actA) isOutcome = p.pred_home < p.pred_away;
        else isOutcome = (p.pred_home === p.pred_away) && (p.penalty_winner_pred === s.pw);

        if (m.sub_phase === 'r16') pts = isExact ? 5 : (isOutcome ? 3 : 0);
        else if (m.sub_phase === 'quarter' || m.sub_phase === 'semi') pts = isExact ? 6 : (isOutcome ? 4 : 0);
        else if (m.sub_phase === 'bronze' || m.sub_phase === 'final') pts = isExact ? 7 : (isOutcome ? 5 : 0);
      }

      if (pts > 0) await supabase.rpc('increment_points', { user_id: p.user_id, amount: pts });
    }
  }

  // Mark match as officially settled
  await supabase.from("matches").update({
    home_score: actH, away_score: actA, penalty_winner_actual: s.pw || null, settled: true
  }).eq("id", m.id);
}
