import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyPassword, signSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Request must include email and password as strings." },
      { status: 400 }
    );
  }

  const invalidCredentials = () =>
    NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  try {
    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return invalidCredentials();

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return invalidCredentials();

    const token = await signSessionToken(user._id.toString());
    const response = NextResponse.json({ user: { id: user._id.toString(), email: user.email } });
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to log in. Please try again." }, { status: 500 });
  }
}
