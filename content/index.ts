import type { ModuleContent } from "@/lib/types";
import runtimeBasics from "./modules/01-runtime-basics";
import modulesCjsEsm from "./modules/02-modules-commonjs-esm";
import asyncProgramming from "./modules/03-async-programming";

export const MODULES: ModuleContent[] = [
  runtimeBasics,
  modulesCjsEsm,
  asyncProgramming,
].sort((a, b) => a.order - b.order);

export function getModuleById(id: string): ModuleContent | undefined {
  return MODULES.find((m) => m.id === id);
}
