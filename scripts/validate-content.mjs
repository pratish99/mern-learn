// One-off dev script: verifies each module's solutionCode actually passes
// its own testCases through a sandbox equivalent to lib/sandbox.ts.
// Run with: node --experimental-strip-types --no-warnings scripts/validate-content.mjs
import vm from "node:vm";
import { EventEmitter } from "node:events";
import { Readable, Writable, Duplex, Transform } from "node:stream";
import { readdirSync } from "node:fs";
import path from "node:path";

const TIMEOUT_MS = 2000;

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return false;
  const aArr = Array.isArray(a);
  const bArr = Array.isArray(b);
  if (aArr !== bArr) return false;
  if (aArr) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}

function createSandbox() {
  const timers = new Set();
  const trackedSetTimeout = (fn, ms, ...args) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn(...args);
    }, ms);
    timers.add(id);
    return id;
  };
  const trackedClearTimeout = (id) => {
    timers.delete(id);
    clearTimeout(id);
  };
  const sandbox = {
    console,
    setTimeout: trackedSetTimeout,
    clearTimeout: trackedClearTimeout,
    setInterval: trackedSetTimeout,
    clearInterval: trackedClearTimeout,
    queueMicrotask,
    Promise,
    JSON,
    Math,
    Object,
    Array,
    Error,
    TypeError,
    RangeError,
    Map,
    Set,
    Symbol,
    RegExp,
    Proxy,
    Reflect,
    Buffer,
    EventEmitter,
    Readable,
    Writable,
    Duplex,
    Transform,
  };
  const context = vm.createContext(sandbox);
  return { context, cleanup: () => { for (const id of timers) clearTimeout(id); } };
}

function describeError(err) {
  const message = err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
  return message;
}

async function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function runTestCase(context, functionName, testCase) {
  context.__args__ = testCase.args();
  let rawResult;
  try {
    const invocation = new vm.Script(`__result__ = ${functionName}(...__args__)`);
    invocation.runInContext(context, { timeout: TIMEOUT_MS });
    rawResult = context.__result__;
  } catch (err) {
    const message = describeError(err);
    if (testCase.expectedError) {
      return { name: testCase.name, passed: message.includes(testCase.expectedError), error: message };
    }
    return { name: testCase.name, passed: false, error: message };
  }

  let resolved;
  try {
    if (rawResult && typeof rawResult.then === "function") {
      resolved = await withTimeout(rawResult, TIMEOUT_MS);
    } else {
      resolved = rawResult;
    }
  } catch (err) {
    const message = describeError(err);
    if (testCase.expectedError) {
      return { name: testCase.name, passed: message.includes(testCase.expectedError), error: message };
    }
    return { name: testCase.name, passed: false, error: message };
  }

  if (testCase.expectedError) {
    return { name: testCase.name, passed: false, error: `expected error "${testCase.expectedError}" but call succeeded with ${JSON.stringify(resolved)}` };
  }
  const passed = deepEqual(resolved, testCase.expected);
  return { name: testCase.name, passed, actual: resolved, expected: testCase.expected };
}

async function validateModule(filePath) {
  const mod = (await import(filePath)).default;
  const { context, cleanup } = createSandbox();
  const results = [];
  try {
    const definition = new vm.Script(mod.challenge.solutionCode);
    definition.runInContext(context, { timeout: TIMEOUT_MS });
    for (const tc of mod.challenge.testCases) {
      results.push(await runTestCase(context, mod.challenge.functionName, tc));
    }
  } catch (err) {
    results.push({ name: "<compile>", passed: false, error: describeError(err) });
  } finally {
    cleanup();
  }
  return { id: mod.id, results };
}

const dir = path.resolve("content/modules");
const files = readdirSync(dir).filter((f) => f.endsWith(".ts")).sort();

let anyFailed = false;
for (const file of files) {
  const { id, results } = await validateModule(path.join(dir, file));
  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    anyFailed = true;
    console.log(`FAIL ${id} (${file})`);
    for (const f of failed) {
      console.log(`  - ${f.name}: ${f.error ?? `expected ${JSON.stringify(f.expected)} got ${JSON.stringify(f.actual)}`}`);
    }
  } else {
    console.log(`OK   ${id} (${results.length} tests)`);
  }
}

if (anyFailed) {
  process.exitCode = 1;
}
