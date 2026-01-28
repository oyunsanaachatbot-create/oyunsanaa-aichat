export type TestOptionValue = 0 | 1 | 2 | 3 | 4;

export type TestQuestion = {
  id: string;
  text: string;
  options: { label: string; value: TestOptionValue }[];
};

export type TestResultBand = {
  minPct: number; // 0..100
  title: string;
  summary: string;
  tips: string[];
};

export type TestDefinition = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  questions: TestQuestion[];
  bands: TestResultBand[];
};
