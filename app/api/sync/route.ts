// app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const RAPID_KEY = process.env.RAPIDAPI_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase Keys in Vercel" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if this is a MANUAL settle from the Admin Panel
    const body = await req.json().catch(() => null);
    
    if (body && body.action === 'manual_settle') {
      const { match, score } = body;
      await calculatePointsForMatch(supabase, match, score);
      return NextResponse.json({ success: true, message: "Manual match settled perfectly." });
    }

    if (body && body.action === 'manual_unsettle') {
      const { match } = body;
      await reversePointsForMatch(supabase, match);
      return NextResponse.json({ success: true, message: "Match unsettled." });
    }

    // If no body, it's the GLOBAL API SYNC
    if (!RAPID_KEY) return NextResponse.json({ error: "Missing RapidAPI Key" }, { status: 500 });

    const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=1&season=2026`, {
      headers: { "x-rapidapi-key": RAPID_KEY, "x-rapidapi-host": "v3.football.api-sports.io" }
    });
    const data = await res.json();

    let settledCount = 0;
    for (const fixture of data.response || []) {
      const status = fixture.fixture?.status?.short;
      if (status === "FT" || status === "AET" || status === "PEN") {
        const hScore = fixture.goals.home;
        const aScore = fixture.goals.away;
        const penHome = fixture.score?.penalty?.home;
        const penAway = fixture.score?.penalty?.away;
        const pWinner = penHome > penAway ? 'home' : penAway > penHome ? 'away' : null;

        const { data: match } = await supabase.from("matches").select("*").eq("api_id", fixture.fixture.id).single();
        if (match && !match.settled) {
          await calculatePointsForMatch(supabase, match, { h: hScore, a: aScore, pw: pWinner });
          settledCount++;
        }
      }
    }
    return NextResponse.json({ success: true, settledCount });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- SECURE SERVER MATH (Awards Points) ---
async function calculatePointsForMatch(supabase: any, m: any, s: { h: any; a: any; pw?: string | null }) {
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
        else if (['quarter', 'semi'].includes(m.sub_phase)) pts = isExact ? 6 : (isOutcome ? 4 : 0);
        else if (['bronze', 'final'].includes(m.sub_phase)) pts = isExact ? 7 : (isOutcome ? 5 : 0);
      }
      if (pts > 0) await supabase.rpc('increment_points', { user_id: p.user_id, amount: pts });
    }
  }
  await supabase.from("matches").update({ home_score: actH, away_score: actA, penalty_winner_actual: s.pw || null, settled: true }).eq("id", m.id);
}

// --- SECURE SERVER MATH (Reverses Points) ---
async function reversePointsForMatch(supabase: any, m: any) {
  const actH = m.home_score;
  const actA = m.away_score;
  const pw = m.penalty_winner_actual;

  if (actH !== null && actA !== null) {
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
          const homeAdvances = actH > actA || (actH === actA && pw === 'home'); 
          const userPickedHome = p.pred_home > p.pred_away; 
          isOutcome = homeAdvances === userPickedHome; 
          pts = isOutcome ? 2 : 0; 
        } else {
          if (actH > actA) isOutcome = p.pred_home > p.pred_away; 
          else if (actH < actA) isOutcome = p.pred_home < p.pred_away; 
          else isOutcome = (p.pred_home === p.pred_away) && (p.penalty_winner_pred === pw);
          
          if (m.sub_phase === 'r16') pts = isExact ? 5 : (isOutcome ? 3 : 0);
          else if (['quarter', 'semi'].includes(m.sub_phase)) pts = isExact ? 6 : (isOutcome ? 4 : 0);
          else if (['bronze', 'final'].includes(m.sub_phase)) pts = isExact ? 7 : (isOutcome ? 5 : 0);
        }
        if (pts > 0) await supabase.rpc('increment_points', { user_id: p.user_id, amount: -pts });
      }
    }
  }
  await supabase.from("matches").update({ home_score: null, away_score: null, penalty_winner_actual: null, settled: false }).eq("id", m.id);
}
