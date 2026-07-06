import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getUserIdFromRequest } from "@/lib/auth";
import { toProgressJSON, isProgressPayload } from "@/lib/progress-shape";

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    return NextResponse.json(toProgressJSON(user));
  } catch {
    return NextResponse.json({ error: "Unable to load progress." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isProgressPayload(body)) {
    return NextResponse.json({ error: "Request must include modules, streak, and activeTrack." }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { progress: { modules: body.modules, streak: body.streak, activeTrack: body.activeTrack } },
      { returnDocument: "after" }
    );
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    return NextResponse.json(toProgressJSON(user));
  } catch {
    return NextResponse.json({ error: "Unable to save progress." }, { status: 500 });
  }
}
