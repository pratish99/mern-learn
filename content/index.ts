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
import jsScopeHoisting from "./modules/js-01-scope-hoisting";
import jsTypesCoercion from "./modules/js-02-types-coercion";
import jsEqualityImmutability from "./modules/js-03-equality-immutability";
import jsFunctions from "./modules/js-04-functions";
import jsClosures from "./modules/js-05-closures";
import jsThisBinding from "./modules/js-06-this-binding";
import jsObjectDescriptors from "./modules/js-07-object-descriptors";
import jsPrototypes from "./modules/js-08-prototypes";
import jsClasses from "./modules/js-09-classes";
import jsDestructuringSpread from "./modules/js-10-destructuring-spread";
import jsArrayIteration from "./modules/js-11-array-iteration";
import jsIteratorsGenerators from "./modules/js-12-iterators-generators";
import jsSymbols from "./modules/js-13-symbols";
import jsRegexBasics from "./modules/js-14-regex-basics";
import jsProxyReflect from "./modules/js-15-proxy-reflect";
import expressAppBasics from "./modules/express-01-app-basics";
import expressRoutingParams from "./modules/express-02-routing-params";
import expressRequestResponse from "./modules/express-03-request-response";
import expressMiddlewareBasics from "./modules/express-04-middleware-basics";
import expressRouterModule from "./modules/express-05-router-module";
import expressErrorHandling from "./modules/express-06-error-handling";
import expressStaticBodyParsing from "./modules/express-07-static-body-parsing";
import expressRestApiDesign from "./modules/express-08-rest-api-design";
import expressValidation from "./modules/express-09-validation";
import expressSessionsAuth from "./modules/express-10-sessions-auth";
import expressSecurityBasics from "./modules/express-11-security-basics";
import expressTesting from "./modules/express-12-testing";

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
  jsScopeHoisting,
  jsTypesCoercion,
  jsEqualityImmutability,
  jsFunctions,
  jsClosures,
  jsThisBinding,
  jsObjectDescriptors,
  jsPrototypes,
  jsClasses,
  jsDestructuringSpread,
  jsArrayIteration,
  jsIteratorsGenerators,
  jsSymbols,
  jsRegexBasics,
  jsProxyReflect,
  expressAppBasics,
  expressRoutingParams,
  expressRequestResponse,
  expressMiddlewareBasics,
  expressRouterModule,
  expressErrorHandling,
  expressStaticBodyParsing,
  expressRestApiDesign,
  expressValidation,
  expressSessionsAuth,
  expressSecurityBasics,
  expressTesting,
];

export function getModuleById(id: string): ModuleContent | undefined {
  return MODULES.find((m) => m.id === id);
}
