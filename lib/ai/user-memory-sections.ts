export type MemorySection =
  | "programs"
  | "tests"
  | "notes"
  | "health"
  | "finance"
  | "services";

const SECTION_PATTERNS: Record<MemorySection, RegExp> = {
  programs: /хөтөлбөр|сургалт|program|training/iu,
  tests: /тест|тэст|сорил|test|result|дүгнэлт/iu,
  notes: /тэмдэглэл|бичвэр|дэвтэр|note|journal/iu,
  health: /эрүүл\s*мэнд|хоол|нойр|алхам|жин|health|sleep|meal/iu,
  finance:
    /санхүү|орлого|зарлага|мөнгө|(?:^|[^\p{L}])өр(?:$|[^\p{L}])|хадгаламж|finance|income|expense/iu,
  services:
    /үйлчилгээ|худалдан|захиалга|уулзалт|сэтгэл\s*зүйч|service|appointment/iu,
};

export function requestedMemorySections(text: string): MemorySection[] {
  return (Object.keys(SECTION_PATTERNS) as MemorySection[]).filter((section) =>
    SECTION_PATTERNS[section].test(text)
  );
}
