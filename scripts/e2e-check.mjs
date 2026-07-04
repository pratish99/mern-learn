import { readdirSync } from "node:fs";
import path from "node:path";

const dir = path.resolve("content/modules");
const files = readdirSync(dir).filter((f) => f.endsWith(".ts")).sort();

let anyFailed = false;
for (const file of files) {
  const mod = (await import(path.join(dir, file))).default;
  const res = await fetch("http://localhost:3000/api/run-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleId: mod.id, code: mod.challenge.solutionCode }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    anyFailed = true;
    console.log(`FAIL ${mod.id}`, JSON.stringify(data));
  } else {
    console.log(`OK   ${mod.id} (${data.results.length} tests via real API)`);
  }
}
if (anyFailed) process.exitCode = 1;
