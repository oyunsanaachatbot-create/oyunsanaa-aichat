// app/mind/ebooks/templatesConfig.js

export const TEMPLATES = {
  plain: {
    id: "plain",
    name: "Энгийн текст",
    bg: "linear-gradient(180deg,#fdfbf7,#f4ebdf)",
    textColor: "#3b332d",
    layout: "plain", // энгийн текст
  },

  imageTop: {
    id: "imageTop",
    name: "Дээр зурагтай",
    bg: "linear-gradient(180deg,#fdfbff,#f1e5f2)",
    textColor: "#3a332c",
    layout: "imageTop", // дээр зураг, доор текст
  },

  imageSide: {
    id: "imageSide",
    name: "Хажуу зурагтай",
    bg: "linear-gradient(90deg,#faf7f1,#e7dbc6)",
    textColor: "#3a332c",
    layout: "imageSide", // зүүн тал зураг, баруун тал текст
  },

  twoImages: {
    id: "twoImages",
    name: "2 зурагтай",
    bg: "linear-gradient(180deg,#fdfbf7,#f0e0d2)",
    textColor: "#3a332c",
    layout: "twoImages", // 2 зураг + доор текст
  },
};

// Хэрвээ templateId буруу байвал plain-г буцаана
export function getTemplate(templateId) {
  return TEMPLATES[templateId] || TEMPLATES.plain;
}
