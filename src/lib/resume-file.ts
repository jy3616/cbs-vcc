/** Browser-only: pull plain text out of an uploaded PDF or Word (.docx) resume. */
export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = await file.arrayBuffer();
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      let line = "";
      const lines: string[] = [];
      for (const it of c.items) {
        if (!("str" in it)) continue;
        line += it.str;
        if (it.hasEOL) { lines.push(line); line = ""; } else line += " ";
      }
      if (line.trim()) lines.push(line);
      pages.push(lines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"));
    }
    return pages.join("\n\n").trim();
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return value.replace(/\n{3,}/g, "\n\n").trim();
  }
  if (name.endsWith(".doc")) throw new Error("Old .doc files can't be read. In Word, choose File → Save As → .docx (or PDF) and upload that.");
  throw new Error("Upload a PDF or Word (.docx) file.");
}
