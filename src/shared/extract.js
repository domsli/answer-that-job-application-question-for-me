import { extractDocx } from "./docx.js";

const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "text"]);

export async function extractDocument(file) {
  const name = String(file?.name || "Untitled");
  const extension = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (file.size > 8 * 1024 * 1024) throw new Error("That file is over 8 MB.");

  if (TEXT_EXTENSIONS.has(extension) || file.type.startsWith("text/")) {
    const text = (await file.text()).replace(/\u0000/g, "").trim();
    if (!text) throw new Error("That file is empty.");
    return text;
  }

  if (extension === "docx") {
    const buffer = await file.arrayBuffer();
    return extractDocx(buffer, inflateRaw);
  }

  if (extension === "pdf") {
    try {
      const { extractPdfText } = await import("./pdf.js");
      return extractPdfText(await file.arrayBuffer());
    } catch (error) {
      if (error instanceof Error && /pdfjs|failed to fetch|module/i.test(error.message)) {
        throw new Error("PDF reading needs the local library. Run npm install in the extension folder, then reload the extension. Or paste the text.");
      }
      throw error;
    }
  }

  if (extension === "doc") {
    throw new Error("Save the Word file as DOCX or PDF, then upload that.");
  }

  throw new Error("Use a PDF, DOCX, TXT, or Markdown file.");
}

export async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== "function") {
    throw new Error("This browser cannot unzip DOCX files. Paste the text instead.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
