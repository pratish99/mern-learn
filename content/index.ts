import type { ModuleContent } from "@/lib/types";
import runtimeBasics from "./modules/01-runtime-basics";
import modulesCjsEsm from "./modules/02-modules-commonjs-esm";
import asyncProgramming from "./modules/03-async-programming";
import eventLoopMicrotasks from "./modules/04-event-loop-microtasks";
import eventEmitter from "./modules/05-event-emitter";
import streamsBuffers from "./modules/06-streams-buffers";
import fileSystem from "./modules/07-file-system";
import httpServer from "./modules/08-http-server";
import errorHandling from "./modules/09-error-handling";
import childProcessesWorkers from "./modules/10-child-processes-workers";
import npmPackageSemver from "./modules/11-npm-package-semver";
import processEnv from "./modules/12-process-env";
import debuggingPerformance from "./modules/13-debugging-performance";
import securityBasics from "./modules/14-security-basics";
import testingBasics from "./modules/15-testing-basics";

export const MODULES: ModuleContent[] = [
  runtimeBasics,
  modulesCjsEsm,
  asyncProgramming,
  eventLoopMicrotasks,
  eventEmitter,
  streamsBuffers,
  fileSystem,
  httpServer,
  errorHandling,
  childProcessesWorkers,
  npmPackageSemver,
  processEnv,
  debuggingPerformance,
  securityBasics,
  testingBasics,
].sort((a, b) => a.order - b.order);

export function getModuleById(id: string): ModuleContent | undefined {
  return MODULES.find((m) => m.id === id);
}
