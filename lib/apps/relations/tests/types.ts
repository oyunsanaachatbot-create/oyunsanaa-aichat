export type TestOptionValue = 0 | 1 | 2 | 3 | 4;

export type TestChoice = {
  label: string;
  value: TestOptionValue;
};

export type TestQuestion = {
  id: string;
  text: string;
  options: TestChoice[];
};

export type TestBand = {
  minPct: number; // 0..1
  title: string;
  summary: string;
  tips: string[];
};

export type TestDefinition = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  questions: TestQuestion[];
  bands: TestBand[];
};
