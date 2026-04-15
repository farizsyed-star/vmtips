// app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key so the server can bypass row-level security to update points
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST() {
  const RAPID_KEY = process.env.RAPIDAPI_KEY; 
  const HOST = "apifootball3.p.rapidapi.com";

  try {
    const res = await fetch(`https://${HOST}/fixtures?league=1&season=2026`, {
      headers: { "x-rapidapi-key": RAPID_KEY!, "x-rapidapi-host": HOST }
    });
    const data = await res.json();

    for (const item of data.response) {
      const status = item.fixture.status.short;
      if (["FT", "AET", "PEN"].includes(status)) {
        const hScore = item.goals.home;
        const aScore = item.goals.away;
        const pWinner = item.score.penalty.home > item.score.penalty.away ? 'home' : 
                        item.score.penalty.away > item.score.penalty.home ? 'away' : null;

        const { data: match } = await supabase.from("matches").select("*").eq("api_id", item.fixture.id).single();
        
        if (match && !match.settled) {
          // CALLS THE GLOBAL SETTLE LOGIC
          await settleMatchCore(match, { h: hScore, a: aScore, pw: pWinner });
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
