import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ user: null });

  try {
    await connectDB();
    const user = await User.findById(userId).select("email");
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: user._id.toString(), email: user.email } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
