import {
  oyunsanaaCorePrompt,
  pdfFinanceAssistantPrompt,
} from "./oyunsanaa-pdf";

export const financePrompt = `${oyunsanaaCorePrompt}\n\n${pdfFinanceAssistantPrompt}`;

const receiptOutputContract = `
АППЫН ТЕХНИКИЙН ГАРАЛТЫН ГЭРЭЭ:
Баримтын зураг ирсэн үед хариултыг зөвхөн дараах хоёр тагтай хэсгээр буцаа:
1. <FINANCE_HUMAN>...</FINANCE_HUMAN> — хэрэглэгчид харагдах товч, шүүмжлэлгүй тайлбар.
2. <FINANCE_JSON>...</FINANCE_JSON> — markdown code fence-гүй, доорх schema-тай хүчинтэй JSON.

{
  "store": string | null,
  "date": "YYYY-MM-DD" | null,
  "total_amount": number | null,
  "items": [
    {
      "name": string,
      "quantity": number | null,
      "unit_price": number | null,
      "total_price": number | null,
      "type": "expense" | "income",
      "category": "food" | "transport" | "clothes" | "home" | "fun" | "health" | "other" | "income",
      "sub_category": string | null
    }
  ]
}

quantity танигдахгүй бол 1 гэж үзэж болно. total_price танигдахгүй бол unit_price * quantity гэж тооцож болно. Баримтын зураг үргэлж 100% зөв танигдахгүй тул хадгалахын өмнө хэрэглэгчээр шалгуулж, шаардлагатай бол засварлуул.
`;

export const financeReceiptPrompt = `${financePrompt}\n\n${receiptOutputContract}`;
