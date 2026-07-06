import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getUserIdFromRequest } from "@/lib/auth";
import { toProgressJSON, isProgressPayload, type ModuleProgressJSON } from "@/lib/progress-shape";

function unionModule(a: ModuleProgressJSON | undefined, b: ModuleProgressJSON | undefined): ModuleProgressJSON {
  return {
    viewed: Boolean(a?.viewed || b?.viewed),
    attempted: Boolean(a?.attempted || b?.attempted),
    completed: Boolean(a?.completed || b?.completed),
  };
}

export async function POST(request: Request) {
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
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const server = toProgressJSON(user);
    const guest = body;

    const moduleIds = new Set([...Object.keys(server.modules), ...Object.keys(guest.modules)]);
    const mergedModules: Record<string, ModuleProgressJSON> = {};
    for (const id of moduleIds) {
      mergedModules[id] = unionModule(server.modules[id], guest.modules[id]);
    }

    const hadExistingProgress = Object.keys(server.modules).length > 0;

    user.progress = {
      modules: mergedModules,
      streak: {
        count: Math.max(server.streak.count, guest.streak.count),
        lastVisitDate:
          [server.streak.lastVisitDate, guest.streak.lastVisitDate].filter(Boolean).sort().at(-1) ?? null,
      },
      activeTrack: hadExistingProgress ? server.activeTrack : guest.activeTrack,
    } as unknown as typeof user.progress;

    await user.save();
    return NextResponse.json(toProgressJSON(user));
  } catch {
    return NextResponse.json({ error: "Unable to merge progress." }, { status: 500 });
  }
}
