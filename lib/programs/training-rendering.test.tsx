import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionContent } from "../../components/mind/programs/program-runner";
import { programDefinitionSchema } from "./definition";

function renderLesson(media: Record<string, unknown>) {
  const definition = programDefinitionSchema.parse({
    schemaVersion: 1,
    contentType: "TRAINING",
    title: "Audio training",
    summary: "A recorded lesson",
    sections: [
      {
        id: "lesson",
        type: "CONTENT",
        title: "Listen",
        body: "Lesson transcript",
        ...media,
      },
    ],
  });
  return renderToStaticMarkup(
    createElement(SectionContent, {
      definition,
      sectionIndex: 0,
      responses: {},
      setResponse: () => {
        throw new Error("Static rendering must not submit responses");
      },
      slug: "testing-audio",
      excludeExternalKey: "program:test",
    })
  );
}

test("audio-only lessons render a visible native player with the saved source", () => {
  const html = renderLesson({
    audioUrl: "https://oyunsanaa.com/api/training-media/recording",
    audioDurationSeconds: 15,
  });
  assert.ok(html.includes("<audio"));
  assert.ok(html.includes('controls=""'));
  assert.ok(
    html.includes('src="https://oyunsanaa.com/api/training-media/recording"')
  );
  assert.ok(html.includes("Хоолой тоглуулах"));
  assert.ok(html.includes("Lesson transcript"));
  assert.ok(!html.includes('class="sr-only"'));
});

test("image-only lessons show the first picture with manual navigation", () => {
  const html = renderLesson({
    materials: [1, 2].map((id) => ({
      id: `picture-${id}`,
      type: "IMAGE",
      imageUrl: `https://oyunsanaa.com/${id}.png`,
      script: `Picture ${id}`,
    })),
  });
  assert.ok(html.includes('src="https://oyunsanaa.com/1.png"'));
  assert.ok(html.includes("Дараах зураг"));
  assert.ok(!html.includes("<audio"));
});

test("text-only lessons stay readable without a disabled media player", () => {
  const html = renderLesson({});
  assert.ok(html.includes("Lesson transcript"));
  assert.ok(!html.includes("<audio"));
  assert.ok(!html.includes("Хоолой тоглуулах"));
});
