function pdfEscape(text: string): string {
  if (!/^[\x20-\x7E]*$/.test(text)) {
    throw new Error("PDF metni yalnızca yazdırılabilir ASCII karakter içerebilir.");
  }

  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildDemoPdf(lines: readonly string[]): Buffer {
  const commands = ["BT", "/F1 16 Tf", "50 800 Td"];
  lines.forEach((line, index) => {
    if (index > 0) {
      commands.push("0 -22 Td");
    }
    commands.push(`(${pdfEscape(line)}) Tj`);
  });
  commands.push("ET");
  const stream = `${commands.join("\n")}\n`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "ascii")];
  const offsets: number[] = [];
  let position = chunks[0].length;

  objects.forEach((object, index) => {
    offsets.push(position);
    const piece = Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`, "ascii");
    chunks.push(piece);
    position += piece.length;
  });

  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (const offset of offsets) {
    xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "ascii"));

  return Buffer.concat(chunks);
}

export function demoPdfLines(token: string): string[] {
  return [
    "KURGU TEST RAPORU",
    "",
    "Bu belge yalnizca yerel gelistirme icindir.",
    "Gercek kisi veya hasta bilgisi icermez.",
    "Bir kurumun raporu ya da dogrulama sonucu degildir.",
    "",
    "Belge: Ornek laboratuvar ozeti",
    "Durum: Uydurma test verisi",
    "Ornek olcum: 12.4",
    "Yorum: Bu sayi anlam tasimaz.",
    "",
    `Belge kodu: ${token}`,
  ];
}
