import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const ticketingUrl = process.env.TICKETING_URL;
  const apiKey = process.env.TICKETING_API_KEY;

  if (!ticketingUrl || !apiKey) {
    return NextResponse.json({ error: "Ticketing app not configured (TICKETING_URL / TICKETING_API_KEY missing)" }, { status: 500 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await fetch(`${ticketingUrl}/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
