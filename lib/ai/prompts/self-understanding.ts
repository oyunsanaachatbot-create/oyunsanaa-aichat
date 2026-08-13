import {
  oyunsanaaCorePrompt,
  pdfUserUnderstandingPrompt,
} from "./oyunsanaa-pdf";

export const selfUnderstandingPrompt = `${oyunsanaaCorePrompt}\n\n${pdfUserUnderstandingPrompt}`;
