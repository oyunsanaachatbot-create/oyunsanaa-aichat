import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 0, label: "Огт үгүй" },
  { value: 1, label: "Ховор" },
  { value: 2, label: "Заримдаа" },
  { value: 3, label: "Ихэнхдээ" },
  { value: 4, label: "Бараг үргэлж" },
];

export const communicationStyle: TestDefinition = {
  title: "Харилцах хэв маяг тест",
  questions: [
    { id: "q1", text: "Маргаанд би түрүүлж тайлбарлаж, өөрийгөө хамгаалдаг.", options: OPTIONS },
    { id: "q2", text: "Би нөгөө хүнийг таслалгүй сонсож чаддаг.", options: OPTIONS },
    { id: "q3", text: "Би дуугаа өндөрсгөхөөс өмнө түр завсарлаж чаддаг.", options: OPTIONS },
    { id: "q4", text: "Би буруутгах биш мэдрэмжээрээ ярьдаг.", options: OPTIONS },
  ],
};
