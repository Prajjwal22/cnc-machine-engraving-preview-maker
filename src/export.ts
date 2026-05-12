import type { Design, FontChoice } from "./catalog";

type TextExport = {
  value: string;
  size: number;
  letterSpacing: number;
  lineHeight: number;
  x: number;
  y: number;
  rotation: number;
  align: "start" | "middle" | "end";
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildEngravingSvg(design: Design, font: FontChoice, text: TextExport) {
  const lines = text.value.split(/\r?\n/);
  const safeLines = (lines.length ? lines : [""]).map(
    (line, index) =>
      `<tspan x="${text.x}" ${index === 0 ? "" : `dy="${text.lineHeight}em"`}>${escapeXml(line) || " "}</tspan>`,
  );
  const wreathLayer = design.none
    ? ""
    : `
      <image
        id="${design.id}-wreath"
        href="${escapeXml(design.src)}"
        x="0"
        y="0"
        width="1000"
        height="1000"
        preserveAspectRatio="xMidYMid meet"
      />`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img">
      <style>
        @font-face {
          font-family: "${escapeXml(font.family)}";
          src: url("${escapeXml(font.src)}");
        }
      </style>
      ${wreathLayer}
      <text
        x="${text.x}"
        y="${text.y}"
        text-anchor="${text.align}"
        transform="rotate(${text.rotation} ${text.x} ${text.y})"
        font-family="${escapeXml(font.family)}"
        font-size="${text.size}"
        font-weight="${font.weight ?? 400}"
        font-style="${font.style ?? "normal"}"
        letter-spacing="${text.letterSpacing}"
        fill="#111827"
      >${safeLines.join("")}</text>
    </svg>
  `.trim();
}

export function downloadTextFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not create PNG from the current artwork."));
    image.src = src;
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not prepare artwork assets for PNG export."));
    reader.readAsDataURL(blob);
  });
}

async function assetToDataUrl(src: string) {
  if (src.startsWith("data:")) {
    return src;
  }

  const response = await fetch(new URL(src, window.location.href));
  if (!response.ok) {
    throw new Error("Could not load artwork assets for PNG export.");
  }

  return blobToDataUrl(await response.blob());
}

async function inlineExternalAssets(svg: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(svg, "image/svg+xml");
  const images = Array.from(document.querySelectorAll("image"));

  await Promise.all(
    images.map(async (image) => {
      const href = image.getAttribute("href") ?? image.getAttribute("xlink:href");
      if (!href) return;

      image.setAttribute("href", await assetToDataUrl(href));
      image.removeAttribute("xlink:href");
    }),
  );

  let serialized = new XMLSerializer().serializeToString(document.documentElement);
  const fontUrlPattern = /src:\s*url\(["']?([^"')]+)["']?\)/g;
  const fontUrls = Array.from(serialized.matchAll(fontUrlPattern), (match) => match[1]);
  const uniqueFontUrls = [...new Set(fontUrls)];

  for (const fontUrl of uniqueFontUrls) {
    const dataUrl = await assetToDataUrl(fontUrl);
    serialized = serialized.split(fontUrl).join(dataUrl);
  }

  return serialized;
}

export async function downloadPng(svg: string) {
  let svgUrl: string | undefined;

  try {
    const inlinedSvg = await inlineExternalAssets(svg);
    const svgBlob = new Blob([inlinedSvg], { type: "image/svg+xml;charset=utf-8" });
    svgUrl = URL.createObjectURL(svgBlob);
    const image = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    const size = 2400;
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("PNG export is not available in this browser.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);

    canvas.toBlob((blob) => {
      if (!blob) {
        window.alert("PNG export failed. Please try again.");
        return;
      }

      const pngUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = pngUrl;
      anchor.download = "engraving-preview.png";
      anchor.click();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "PNG export failed.");
  } finally {
    if (svgUrl) {
      URL.revokeObjectURL(svgUrl);
    }
  }
}

export function   openPrintablePdf(svg: string) {
  const printable = window.open("", "_blank", "popup,width=1100,height=900");
  if (!printable) {
    window.alert("Please allow popups to create the printable PDF preview.");
    return;
  }

  printable.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Engraving PDF</title>
        <style>
          @page { size: 210mm 210mm; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: white;
          }
          svg {
            width: 194mm;
            height: 194mm;
            display: block;
          }
          @media print {
            body { min-height: auto; }
          }
        </style>
      </head>
      <body>${svg}<script>window.onload = () => window.print();</script></body>
    </html>
  `);
  printable.document.close();
}
