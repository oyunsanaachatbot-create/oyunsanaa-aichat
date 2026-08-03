export const USER_MEMORY_CONTEXT_MAX_CHARS = 1800;

// Mongolian Cyrillic can use more tokens than English. 1.5 characters/token is
// intentionally conservative for a predictable upper-bound estimate.
export const USER_MEMORY_ESTIMATED_MAX_INPUT_TOKENS = Math.ceil(
  USER_MEMORY_CONTEXT_MAX_CHARS / 1.5
);

const HEADER =
  "\n[ХЭРЭГЛЭГЧИЙН ХАДГАЛСАН МЭДЭЭЛЭЛ — ЗӨВХӨН ЭНЭ АСУУЛТАД ХАМААРАХ ХЭСЭГ]\n";
const INSTRUCTIONS = `

Заавар:
- Энэ мэдээлэл зөвхөн нэвтэрсэн хэрэглэгчийн өөрийн өгөгдөл.
- Асуултад хамаарах хэмжээнд ашигла; хэрэггүй эмзэг дэлгэрэнгүйг бүү давт.
- Байхгүй мэдээллийг зохиож болохгүй. Эмнэлгийн онош, санхүүгийн баталгаа мэтээр бүү тайлбарла.
`;

export function boundUserMemoryContext(blocks: string[]): string {
  if (blocks.length === 0) return "";
  const contentBudget = Math.max(
    0,
    USER_MEMORY_CONTEXT_MAX_CHARS - HEADER.length - INSTRUCTIONS.length
  );
  const joined = blocks.join("\n\n");
  const content =
    joined.length > contentBudget
      ? `${joined.slice(0, Math.max(0, contentBudget - 1))}…`
      : joined;
  return `${HEADER}${content}${INSTRUCTIONS}`;
}
