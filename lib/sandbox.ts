import vm from "node:vm";
import { EventEmitter } from "node:events";
import { Readable, Writable, Duplex, Transform } from "node:stream";
import type { Challenge, TestCase } from "@/lib/types";
import { deepEqual } from "@/lib/deep-equal";

const EXECUTION_TIMEOUT_MS = 2000;

export interface TestCaseResult {
  name: string;
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  error?: string;
}

export interface RunResult {
  ok: boolean;
  compileError?: string;
  results: TestCaseResult[];
}

function describeError(err: unknown): string {
  // Errors thrown from inside the vm context are instances of that
  // context's own Error constructor, so `instanceof Error` (host realm)
  // is unreliable here — duck-type on `.message` instead.
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err);

  if (message.includes("Script execution timed out")) {
    return "Execution timed out — check for an infinite loop.";
  }
  return message;
}

function withWallClockTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Execution timed out — check for an infinite loop or unresolved promise."));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function createSandbox() {
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const trackedSetTimeout = ((fn: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn(...args);
    }, ms);
    timers.add(id);
    return id;
  }) as typeof setTimeout;

  const trackedClearTimeout = (id: Parameters<typeof clearTimeout>[0]) => {
    timers.delete(id as ReturnType<typeof setTimeout>);
    clearTimeout(id);
  };

  const sandbox = {
    console: {
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
    },
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

  return {
    context,
    cleanup: () => {
      for (const id of timers) clearTimeout(id);
      timers.clear();
    },
  };
}

async function runTestCase(
  context: vm.Context,
  functionName: string,
  testCase: TestCase
): Promise<TestCaseResult> {
  (context as Record<string, unknown>).__args__ = testCase.args();

  let rawResult: unknown;
  try {
    const invocation = new vm.Script(`__result__ = ${functionName}(...__args__)`, {
      filename: "invocation.js",
    });
    invocation.runInContext(context, { timeout: EXECUTION_TIMEOUT_MS });
    rawResult = (context as Record<string, unknown>).__result__;
  } catch (err) {
    const message = describeError(err);
    if (testCase.expectedError) {
      return { name: testCase.name, passed: message.includes(testCase.expectedError), error: message };
    }
    return { name: testCase.name, passed: false, error: message };
  }

  let resolved: unknown;
  try {
    if (rawResult instanceof Promise || (rawResult && typeof (rawResult as Promise<unknown>).then === "function")) {
      resolved = await withWallClockTimeout(rawResult as Promise<unknown>, EXECUTION_TIMEOUT_MS);
    } else {
      resolved = rawResult;
    }
  } catch (err) {
    if (testCase.expectedError) {
      const message = describeError(err);
      const passed = message.includes(testCase.expectedError);
      return { name: testCase.name, passed, error: message };
    }
    return { name: testCase.name, passed: false, error: describeError(err) };
  }

  if (testCase.expectedError) {
    return {
      name: testCase.name,
      passed: false,
      actual: resolved,
      error: `Expected an error containing "${testCase.expectedError}" but the call succeeded.`,
    };
  }

  const passed = deepEqual(resolved, testCase.expected);
  return { name: testCase.name, passed, actual: resolved, expected: testCase.expected };
}

export async function runChallenge(code: string, challenge: Challenge): Promise<RunResult> {
  if (code.length > 20_000) {
    return { ok: false, compileError: "Code is too long.", results: [] };
  }

  const { context, cleanup } = createSandbox();

  try {
    const definition = new vm.Script(code, { filename: "submission.js" });
    definition.runInContext(context, { timeout: EXECUTION_TIMEOUT_MS });
  } catch (err) {
    return { ok: false, compileError: describeError(err), results: [] };
  }

  const fn = (context as Record<string, unknown>)[challenge.functionName];
  if (typeof fn !== "function") {
    return {
      ok: false,
      compileError: `Expected a function named "${challenge.functionName}" to be defined.`,
      results: [],
    };
  }

  const results: TestCaseResult[] = [];
  try {
    for (const testCase of challenge.testCases) {
      results.push(await runTestCase(context, challenge.functionName, testCase));
    }
  } finally {
    cleanup();
  }

  return { ok: results.every((r) => r.passed), results };
}
