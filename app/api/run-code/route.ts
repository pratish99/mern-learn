import { NextResponse } from "next/server";
import { getModuleById } from "@/content";
import { runChallenge } from "@/lib/sandbox";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { moduleId, code } = (body ?? {}) as { moduleId?: unknown; code?: unknown };

  if (typeof moduleId !== "string" || typeof code !== "string") {
    return NextResponse.json(
      { error: "Request must include moduleId and code as strings." },
      { status: 400 }
    );
  }

  const mod = getModuleById(moduleId);
  if (!mod) {
    return NextResponse.json({ error: `Unknown module "${moduleId}".` }, { status: 404 });
  }

  try {
    const result = await runChallenge(code, mod.challenge);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "The code runner hit an unexpected error. Please try again." },
      { status: 500 }
    );
  }
}
