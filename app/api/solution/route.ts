import { NextResponse } from "next/server";
import { getModuleById } from "@/content";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { moduleId } = (body ?? {}) as { moduleId?: unknown };

  if (typeof moduleId !== "string") {
    return NextResponse.json(
      { error: "Request must include moduleId as a string." },
      { status: 400 }
    );
  }

  const mod = getModuleById(moduleId);
  if (!mod) {
    return NextResponse.json({ error: `Unknown module "${moduleId}".` }, { status: 404 });
  }

  return NextResponse.json({ solutionCode: mod.challenge.solutionCode });
}
