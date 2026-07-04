export interface CodeExample {
  title: string;
  code: string;
  note?: string;
}

export interface TestCase {
  name: string;
  args: unknown[];
  /** Expected return value (or resolved value, for async functions). */
  expected?: unknown;
  /** If set, the call/promise is expected to throw/reject with a message containing this substring. */
  expectedError?: string;
}

export interface Challenge {
  functionName: string;
  prompt: string;
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
}

export interface ModuleContent {
  id: string;
  title: string;
  category: string;
  order: number;
  explanation: string;
  codeExamples: CodeExample[];
  challenge: Challenge;
}
