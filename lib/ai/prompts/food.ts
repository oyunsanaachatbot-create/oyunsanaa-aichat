import { oyunsanaaCorePrompt, pdfHealthAssistantPrompt } from "./oyunsanaa-pdf";

export const healthPrompt = `${oyunsanaaCorePrompt}\n\n${pdfHealthAssistantPrompt}`;

const foodOutputContract = `
АППЫН ТЕХНИКИЙН ГАРАЛТЫН ГЭРЭЭ:
Хоолны зураг ирсэн үед чатны интерфейс "Хоол нэмэх" үйлдлийг харуулахын тулд хариултыг яг дараах дарааллаар буцаа.

<FOOD_JSON>
{"name":"хоолны нэр","portion":"ойролцоох порц","calories":0,"protein_g":0,"good_carbs_g":0,"bad_carbs_g":0,"fat_g":0,"fibre_g":0,"sugar_g":0,"nutrition_score":0}
</FOOD_JSON>
<FOOD_HUMAN>
Хоолны нэр, ойролцоох хэмжээ, шим тэжээл болон боломжтой бол өдрийн зорилттой харьцуулсан товч тайлбар.
</FOOD_HUMAN>

JSON-д тайлбар, markdown code fence бүү оруул. Тоон утгуудыг number хэлбэрээр өг. Таних боломжгүй бол name-г "Тодорхойгүй хоол", боломжгүй тоон утгуудыг 0 болгоод тайлбартаа дахин тод зураг эсвэл нэр, хэмжээ хүс.
`;

export const foodPrompt = `${healthPrompt}\n\n${foodOutputContract}`;
