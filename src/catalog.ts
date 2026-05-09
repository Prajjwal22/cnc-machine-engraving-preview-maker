export type Design = {
  id: string;
  name: string;
  src: string;
  missing?: boolean;
};

export type FontChoice = {
  id: string;
  name: string;
  family: string;
  src: string;
  weight?: number;
  style?: "normal" | "italic";
};

const wreathFiles = import.meta.glob("./assets/wreaths/*.{png,svg,jpg,jpeg}", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const fontFiles = import.meta.glob("./assets/fonts/*.{otf,OTF,ttf,TTF}", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

function fileNumber(path: string, prefix: string) {
  return Number(path.toLowerCase().match(new RegExp(`${prefix}(\\d+)\\.`))?.[1]);
}

function placeholderDesign(id: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
      <rect width="1000" height="1000" fill="none"/>
      <circle cx="500" cy="500" r="330" fill="none" stroke="#c7ced9" stroke-width="18" stroke-dasharray="38 28"/>
      <text x="500" y="520" text-anchor="middle" font-family="Arial" font-size="64" fill="#667085">${id} missing</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const wreathByNumber = new Map(
  Object.entries(wreathFiles).map(([path, src]) => [fileNumber(path, "d"), src]),
);

const fontEntries = Object.entries(fontFiles)
  .map(([path, src]) => ({ number: fileNumber(path, "f"), src }))
  .filter((entry) => Number.isFinite(entry.number))
  .sort((a, b) => a.number - b.number);

export const designs: Design[] = Array.from({ length: 19 }, (_, index) => {
  const number = index + 1;
  const id = `D${number}`;
  const src = wreathByNumber.get(number);

  return {
    id,
    name: `Wreath Design ${id}`,
    src: src ?? placeholderDesign(id),
    missing: !src,
  };
}).filter((design) => design.id !== "D10");

export const fonts: FontChoice[] = fontEntries.map(({ number, src }) => ({
  id: `F${number}`,
  name: `Font Style F${number}`,
  family: `EngravingFont${number}`,
  src,
}));
