export interface CodeExample {
  title: string;
  code: string;
  note?: string;
}

export interface TestCase {
  name: string;
  args: unknown[];
  expected: unknown;
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
