import * as pdfjs from "../../node_modules/pdfjs-dist/build/pdf.mjs";

let configured = false;

function configure() {
  if (configured) return;
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "../../node_modules/pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).href;
  configured = true;
}

export async function extractPdfText(buffer) {
  configure();
  const data = buffer instanceof Uint8Array ? new Uint8Array(buffer) : new Uint8Array(buffer);
  let doc;
  try {
    doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
  } catch (error) {
    const message = String(error?.message || error || "");
    if (/password/i.test(message)) {
      throw new Error("This PDF is password protected. Export an unlocked copy or paste the text.");
    }
    throw new Error("Couldn't read that PDF. If it is a scan, paste the text instead.");
  }

  try {
    let output = "";
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      let line = "";
      for (const item of content.items) {
        if (!item || typeof item.str !== "string") continue;
        line += item.str;
        if (item.hasEOL) {
          output += `${line.trimEnd()}\n`;
          line = "";
        } else if (!line.endsWith(" ") && !item.str.startsWith(" ")) {
          line += " ";
        }
      }
      if (line.trim()) output += `${line.trimEnd()}\n`;
      output += "\n";
    }
    const text = output.replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 40) {
      throw new Error("That PDF has almost no selectable text. If it is a scan, paste the text instead.");
    }
    return text;
  } finally {
    await doc.destroy?.();
  }
}
