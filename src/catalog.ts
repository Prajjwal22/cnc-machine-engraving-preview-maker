export type Design = {
  id: string;
  name: string;
  src: string;
  categoryId: DesignCategoryId;
  label: string;
  missing?: boolean;
  none?: boolean;
};

export type DesignCategoryId = "round" | "heart";

export type DesignCategory = {
  id: DesignCategoryId;
  name: string;
  designs: Design[];
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

const heartWreathFiles = import.meta.glob("./assets/heart-wreaths/*.{png,svg,jpg,jpeg}", {
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

const heartWreathEntries = Object.entries(heartWreathFiles)
  .map(([path, src]) => ({ number: fileNumber(path, "d"), src }))
  .filter((entry) => Number.isFinite(entry.number))
  .sort((a, b) => a.number - b.number);

const fontEntries = Object.entries(fontFiles)
  .map(([path, src]) => ({ number: fileNumber(path, "f"), src }))
  .filter((entry) => Number.isFinite(entry.number))
  .sort((a, b) => a.number - b.number);

const noWreathDesign: Design = {
  id: "NONE",
  name: "No Wreath",
  categoryId: "round",
  label: "None",
  none: true,
  src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
      <rect width="1000" height="1000" fill="none"/>
      <rect x="250" y="250" width="500" height="500" rx="40" fill="none" stroke="#cbd5e1" stroke-width="18" stroke-dasharray="42 28"/>
      <text x="500" y="525" text-anchor="middle" font-family="Arial" font-size="82" font-weight="700" fill="#64748b">NONE</text>
    </svg>
  `.trim())}`,
};

const wreathDesigns: Design[] = Array.from({ length: 19 }, (_, index) => {
  const number = index + 1;
  const id = `D${number}`;
  const src = wreathByNumber.get(number);

  return {
    id,
    name: `Round Wreath ${id}`,
    categoryId: "round" as const,
    label: id,
    src: src ?? placeholderDesign(id),
    missing: !src,
  };
}).filter((design) => design.id !== "D10");

const heartWreathDesigns: Design[] = heartWreathEntries.map(({ number, src }) => {
  const label = `D${number}`;

  return {
    id: `H${number}`,
    name: `Heart Wreath ${label}`,
    categoryId: "heart",
    label,
    src,
  };
});

export const designCategories: DesignCategory[] = [
  {
    id: "round",
    name: "Round Wreath",
    designs: [...wreathDesigns, noWreathDesign],
  },
  {
    id: "heart",
    name: "Heart Wreath",
    designs: heartWreathDesigns,
  },
];

export const designs: Design[] = designCategories.flatMap((category) => category.designs);

export const fonts: FontChoice[] = fontEntries.map(({ number, src }) => ({
  id: `F${number}`,
  name: `Font Style F${number}`,
  family: `EngravingFont${number}`,
  src,
}));
