import { ChangeEvent, PointerEvent, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Crosshair,
  Download,
  Eye,
  FileDown,
  Grid3X3,
  ImageDown,
  Leaf,
  Maximize2,
  Menu,
  Minus,
  Move,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import { designs, fonts } from "./catalog";
import {
  buildEngravingSvg,
  downloadPng,
  downloadTextFile,
  openPrintablePdf,
} from "./export";

type Align = "start" | "middle" | "end";

type TextState = {
  value: string;
  fontId: string;
  size: number;
  letterSpacing: number;
  lineHeight: number;
  x: number;
  y: number;
  rotation: number;
  align: Align;
};

type SectionId = "design" | "text" | "position" | "export";
type PreviewMode = "customer" | "cnc";
type MobileTab = "design" | "text" | "position";

const initialText: TextState = {
  value: "",
  fontId: "F1",
  size: 63,
  letterSpacing: 2,
  lineHeight: 1.2,
  x: 500,
  y: 510,
  rotation: 0,
  align: "middle",
};

const iconSize = 16;

export function App() {
  const [selectedDesignId, setSelectedDesignId] = useState("D1");
  const [text, setText] = useState<TextState>(initialText);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("customer");
  const [mobileTab, setMobileTab] = useState<MobileTab>("design");
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    design: true,
    text: true,
    position: true,
    export: true,
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedDesign = useMemo(
    () =>
      designs.find((design) => design.id === selectedDesignId) ?? designs[0],
    [selectedDesignId],
  );
  const selectedFont =
    fonts.find((font) => font.id === text.fontId) ?? fonts[0];
  const previewSvg = buildEngravingSvg(selectedDesign, selectedFont, text);

  function updateText<T extends keyof TextState>(key: T, value: TextState[T]) {
    setText((current) => ({ ...current, [key]: value }));
  }

  function toggleSection(section: SectionId) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function updateTextPosition(event: PointerEvent<HTMLDivElement>) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const x = ((event.clientX - bounds.left) / bounds.width) * 1000;
    const y = ((event.clientY - bounds.top) / bounds.height) * 1000;
    setText((current) => ({
      ...current,
      x: Math.round(Math.min(1000, Math.max(0, x))),
      y: Math.round(Math.min(1000, Math.max(0, y))),
    }));
  }

  function handleCanvasPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateTextPosition(event);
  }

  function handleCanvasPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return;
    updateTextPosition(event);
  }

  function handleProjectImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    file
      .text()
      .then((raw) => JSON.parse(raw) as { designId: string; text: TextState })
      .then((project) => {
        setSelectedDesignId(project.designId);
        setText({ ...initialText, ...project.text });
      })
      .catch(() => {
        window.alert("This project file could not be opened.");
      });
    event.target.value = "";
  }

  function exportProject() {
    downloadTextFile(
      "engraving-project.json",
      JSON.stringify({ designId: selectedDesignId, text }, null, 2),
      "application/json",
    );
  }

  function exportSvg() {
    downloadTextFile("engraving-artwork.svg", previewSvg, "image/svg+xml");
  }

  function resetAll() {
    setSelectedDesignId("D1");
    setText(initialText);
    setShowGrid(false);
    setZoom(100);
    setPreviewMode("customer");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-4 text-slate-950 max-md:h-dvh max-md:overflow-hidden max-md:px-3 max-md:py-3 md:px-6 lg:px-8">
      <style>
        {fonts
          .map(
            (font) => `@font-face{font-family:"${font.family}";src:url("${font.src}");font-display:swap;}`,
          )
          .join("\n")}
      </style>
      <header className="mx-auto mb-4 flex max-w-[1480px] items-center justify-between max-md:mb-3 max-md:h-10">
        <button
          className="hidden size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm max-md:grid"
          type="button"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2.5 text-[#176c55] max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2">
          <span className="grid size-8 place-items-center rounded-lg bg-[#176c55] text-white">
            <Leaf size={18} />
          </span>
          <span className="text-xl font-extrabold tracking-tight">Owleaf</span>
        </div>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#176c55]/40 hover:text-[#176c55]"
          type="button"
          onClick={resetAll}
        >
          <RefreshCcw size={iconSize} />
          Reset
        </button>
      </header>

      <div className="mx-auto grid max-w-[1480px] gap-5 max-md:flex max-md:h-[calc(100dvh-3.25rem)] max-md:flex-col max-md:gap-3 md:grid-cols-[420px_minmax(0,1fr)] xl:grid-cols-[530px_minmax(0,1fr)]">
        <aside className="self-start rounded-lg border border-slate-200 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,34,52,0.08)] max-md:order-2 max-md:min-h-0 max-md:w-full max-md:flex-1 max-md:overflow-y-auto max-md:p-3 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
          <div className="border-b border-slate-200 pb-5 max-md:hidden">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#176c55]">
              Owleaf Engraving Studio
            </p>
            <h1 className="max-w-[330px] text-[27px] font-extrabold leading-[1.06] tracking-tight text-slate-950">
              Preview and export straight-line engraving artwork.
            </h1>
          </div>

          <MobileTabs active={mobileTab} onChange={setMobileTab} />

          <section className={["border-b border-slate-200 py-5 max-md:py-3", mobileTab !== "design" ? "max-md:hidden" : ""].join(" ")}>
            <PanelTitle
              title="Design"
              value={selectedDesign.id}
              open={openSections.design}
              onToggle={() => toggleSection("design")}
            />
            {openSections.design ? (
            <div className="grid grid-cols-4 gap-3 max-md:flex max-md:overflow-x-auto max-md:pb-2" aria-label="Wreath designs">
              {designs.map((design) => {
                const isActive = design.id === selectedDesignId;

                return (
                  <button
                    className={[
                      "relative grid aspect-square place-items-center rounded-lg border bg-white p-2 transition max-md:size-24 max-md:flex-none",
                      isActive
                        ? "border-[#176c55] shadow-[0_0_0_2px_rgba(23,108,85,0.14)]"
                        : "border-slate-200 hover:border-[#176c55]/40",
                      design.missing ? "opacity-60" : "",
                    ].join(" ")}
                    key={design.id}
                    onClick={() => setSelectedDesignId(design.id)}
                    type="button"
                    title={design.name}
                  >
                    <img
                      className="h-[74%] w-[74%] object-contain"
                      src={design.src}
                      alt=""
                      aria-hidden="true"
                    />
                    {isActive ? (
                      <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#176c55] text-xs font-bold text-white">
                        ✓
                      </span>
                    ) : null}
                    <strong className="absolute bottom-1 text-xs font-extrabold text-slate-600">
                      {design.id}
                    </strong>
                  </button>
                );
              })}
            </div>
            ) : null}
          </section>

          <section className={["border-b border-slate-200 py-5 max-md:py-3", mobileTab !== "text" ? "max-md:hidden" : ""].join(" ")}>
            <PanelTitle
              title="Text"
              open={openSections.text}
              onToggle={() => toggleSection("text")}
            />
            {openSections.text ? (
            <>
            <label className="mb-4 grid gap-2" htmlFor="engraving-text">
              <span className="text-xs font-bold text-slate-600">
                Engraving text
              </span>
              <textarea
                className="min-h-28 resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm leading-5 outline-none transition focus:border-[#176c55] focus:ring-4 focus:ring-[#176c55]/10 max-md:min-h-24"
                id="engraving-text"
                value={text.value}
                onChange={(event) => updateText("value", event.target.value)}
                placeholder="Enter customer text"
                rows={4}
              />
            </label>

            <label className="mb-4 grid gap-2" htmlFor="font-style">
              <span className="text-xs font-bold text-slate-600">
                Font style
              </span>
              <select
                className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#176c55] focus:ring-4 focus:ring-[#176c55]/10"
                id="font-style"
                value={text.fontId}
                onChange={(event) => updateText("fontId", event.target.value)}
              >
                {fonts.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.id} - {font.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mb-4 grid grid-cols-2 gap-2 max-md:hidden">
              {fonts.map((font) => (
                <button
                  className={[
                    "flex h-12 items-center justify-between rounded-lg border px-3 text-left transition",
                    text.fontId === font.id
                      ? "border-[#176c55] bg-[#e7f3ef] text-[#0e4f3f]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#176c55]/40",
                  ].join(" ")}
                  key={font.id}
                  type="button"
                  onClick={() => updateText("fontId", font.id)}
                >
                  <span className="text-xs font-extrabold">{font.id}</span>
                  <span className="truncate text-lg" style={{ fontFamily: font.family }}>
                    Sample
                  </span>
                </button>
              ))}
            </div>

            <div
              className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1"
              aria-label="Text alignment"
            >
              {[
                ["start", "Left"],
                ["middle", "Center"],
                ["end", "Right"],
              ].map(([value, label]) => (
                <button
                  className={[
                    "h-9 rounded-md text-sm font-semibold transition",
                    text.align === value
                      ? "bg-[#176c55] text-white"
                      : "text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                  key={value}
                  onClick={() => updateText("align", value as Align)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            </>
            ) : null}
          </section>

          <section className={["border-b border-slate-200 py-5 max-md:py-3", mobileTab !== "position" ? "max-md:hidden" : ""].join(" ")}>
            <PanelTitle
              title="Position"
              open={openSections.position}
              onToggle={() => toggleSection("position")}
            />
            {openSections.position ? (
            <div className="grid gap-3">
              <Range
                label="Size"
                min={16}
                max={120}
                value={text.size}
                onChange={(value) => updateText("size", value)}
              />
              <Range
                label="Letter spacing"
                min={-4}
                max={16}
                value={text.letterSpacing}
                onChange={(value) => updateText("letterSpacing", value)}
              />
              <Range
                label="Line spacing"
                min={0.7}
                max={2}
                step={0.1}
                value={text.lineHeight}
                onChange={(value) => updateText("lineHeight", value)}
              />
              <Range
                label="X position"
                min={120}
                max={880}
                value={text.x}
                onChange={(value) => updateText("x", value)}
                className="max-md:hidden"
              />
              <Range
                label="Y position"
                min={160}
                max={850}
                value={text.y}
                onChange={(value) => updateText("y", value)}
                className="max-md:hidden"
              />
              <Range
                label="Rotation"
                min={-30}
                max={30}
                value={text.rotation}
                onChange={(value) => updateText("rotation", value)}
              />
              <div className="mt-2 grid grid-cols-3 gap-2 max-md:hidden">
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:border-[#176c55]/40 hover:text-[#176c55]"
                  type="button"
                  onClick={() => setText((current) => ({ ...current, x: 500 }))}
                >
                  <Crosshair size={14} />
                  Center X
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:border-[#176c55]/40 hover:text-[#176c55]"
                  type="button"
                  onClick={() => setText((current) => ({ ...current, y: 500 }))}
                >
                  <Crosshair size={14} />
                  Center Y
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:border-[#176c55]/40 hover:text-[#176c55]"
                  type="button"
                  onClick={() => setText((current) => ({ ...current, rotation: 0 }))}
                >
                  <RefreshCcw size={14} />
                  Rotate
                </button>
              </div>
            </div>
            ) : null}
          </section>

          <section className="pt-5 max-md:pt-3">
            <PanelTitle
              title="Export"
              open={openSections.export}
              onToggle={() => toggleSection("export")}
            />
            {openSections.export ? (
            <>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <ExportButton
                icon={<FileDown size={iconSize} />}
                label="SVG"
                onClick={exportSvg}
              />
              <ExportButton
                icon={<ImageDown size={iconSize} />}
                label="PNG"
                onClick={() => void downloadPng(previewSvg)}
              />
              <ExportButton
                icon={<FileDown size={iconSize} />}
                label="PDF"
                onClick={() => openPrintablePdf(previewSvg)}
              />
              <ExportButton
                icon={<Save size={iconSize} />}
                label="Save JSON"
                onClick={exportProject}
              />
            </div>
            <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#0e4f3f] bg-gradient-to-b from-[#1b765e] to-[#0e5b48] px-4 text-sm font-bold text-white shadow-sm transition hover:from-[#176c55] hover:to-[#0d4e3f]">
              <Upload size={iconSize} />
              Open JSON
              <input
                className="hidden"
                accept="application/json"
                type="file"
                onChange={handleProjectImport}
              />
            </label>
            </>
            ) : null}
          </section>
        </aside>

        <section className="grid min-w-0 gap-5 max-md:order-1 max-md:shrink-0 max-md:gap-0">
          {/* <div className="flex min-h-8 items-center rounded-lg border border-slate-200 bg-white/95 px-6 shadow-[0_18px_60px_rgba(15,34,52,0.08)]">
            <div className="grid gap-1">
              <strong className="text-lg font-extrabold leading-none text-slate-950">
                {selectedDesign.name}
              </strong>
              <span className="text-sm font-medium text-slate-500">
                {selectedFont.name}
              </span>
            </div>
          </div> */}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-[0_18px_60px_rgba(15,34,52,0.08)]">
            <div className="hidden items-center justify-between border-b border-slate-200 px-6 py-5 md:flex">
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-white p-1">
                  {[
                    ["customer", "Customer"],
                    ["cnc", "CNC"],
                  ].map(([value, label]) => (
                    <button
                      className={[
                        "h-8 rounded-md px-3 text-xs font-extrabold transition",
                        previewMode === value ? "bg-[#176c55] text-white" : "text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                      key={value}
                      type="button"
                      onClick={() => setPreviewMode(value as PreviewMode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  className={[
                    "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition",
                    !showGrid
                      ? "bg-[#176c55] text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:text-[#176c55]",
                  ].join(" ")}
                  type="button"
                  onClick={() => setShowGrid(false)}
                >
                  <Eye size={iconSize} />
                  Preview
                </button>
                <button
                  className={[
                    "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition",
                    showGrid
                      ? "bg-[#176c55] text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:text-[#176c55]",
                  ].join(" ")}
                  type="button"
                  onClick={() => setShowGrid(true)}
                >
                  <Grid3X3 size={iconSize} />
                  Grid
                </button>
              </div>
              <div className="flex items-center gap-3">
                <IconButton
                  label="Zoom out"
                  onClick={() => setZoom((value) => Math.max(60, value - 10))}
                >
                  <Minus size={iconSize} />
                </IconButton>
                <span className="min-w-12 text-center text-sm font-semibold text-slate-700">
                  {zoom}%
                </span>
                <IconButton
                  label="Zoom in"
                  onClick={() => setZoom((value) => Math.min(140, value + 10))}
                >
                  <Plus size={iconSize} />
                </IconButton>
                <IconButton
                  label="Download PNG"
                  onClick={() => void downloadPng(previewSvg)}
                >
                  <Download size={iconSize} />
                </IconButton>
              </div>
            </div>

            {/* <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:hidden">
              <div className="grid gap-1">
                <strong className="text-lg font-extrabold leading-none text-slate-950">{selectedDesign.name}</strong>
                <span className="text-sm font-medium text-slate-500">Font: {selectedFont.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700"
                  type="button"
                  aria-label="Toggle grid"
                  onClick={() => setShowGrid((value) => !value)}
                >
                  <Grid3X3 size={18} />
                </button>
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-md">
                  <RefreshCcw size={15} />
                  {zoom}%
                </span>
              </div>
            </div> */}

            <div
              className={[
                previewMode === "cnc" ? "bg-slate-100" : showGrid ? "canvas-bg-grid" : "canvas-bg",
                "mobile-canvas-stage grid min-h-[820px] place-items-center overflow-auto px-10 py-28 max-md:min-h-0 max-md:overflow-hidden max-md:px-2 max-md:py-2",
              ].join(" ")}
            >
              <div
                ref={canvasRef}
                className={[
                  "mobile-artboard relative aspect-square min-w-[360px] max-w-[820px] cursor-crosshair border border-slate-200 shadow-[0_16px_32px_rgba(25,32,40,0.18)] max-md:min-w-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full",
                  previewMode === "cnc" ? "bg-transparent shadow-none" : "bg-white",
                ].join(" ")}
                style={{ width: `${zoom}%` }}
                dangerouslySetInnerHTML={{ __html: previewSvg }}
                aria-label="Engraving artwork preview"
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
              />
            </div>

            <footer className="grid gap-5 p-6 max-md:hidden">
              <div className="grid rounded-lg border border-slate-200 md:grid-cols-3">
                <InfoItem
                  icon={<OwleafMini />}
                  label="Design"
                  value={selectedDesign.name}
                />
                <InfoItem
                  icon={<Type size={25} />}
                  label="Font"
                  value={`${selectedFont.id} - ${selectedFont.name}`}
                />
                <InfoItem
                  icon={<Maximize2 size={22} />}
                  label="Dimensions"
                  value="1000 x 1000 px"
                />
              </div>
              <div className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 px-4 text-sm font-medium text-[#2e6657]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e7f3ef] text-[#176c55]">
                  <Sparkles size={16} />
                </span>
                Tip: You can adjust the size, spacing, position and rotation to
                get the perfect engraving result.
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function PanelTitle({
  title,
  value,
  open,
  onToggle,
}: {
  title: string;
  value?: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      className="mb-3 flex w-full items-center justify-between text-left"
      type="button"
      onClick={onToggle}
    >
      <span className="flex items-center gap-2">
        <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
        {value ? <span className="text-sm font-extrabold text-[#176c55]">{value}</span> : null}
      </span>
      {typeof open === "boolean" ? (
        <ChevronDown
          className={["text-slate-400 transition", open ? "rotate-180" : ""].join(" ")}
          size={16}
        />
      ) : null}
    </button>
  );
}

function MobileTabs({
  active,
  onChange,
}: {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}) {
  const tabs: Array<{ id: MobileTab; label: string; icon: React.ReactNode }> = [
    { id: "design", label: "Design", icon: <Grid3X3 size={16} /> },
    { id: "text", label: "Text", icon: <Type size={17} /> },
    { id: "position", label: "Position", icon: <Move size={16} /> },
  ];

  return (
    <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 md:hidden">
      {tabs.map((tab) => (
        <button
          className={[
            "inline-flex h-8 items-center justify-center gap-2 rounded-lg text-xs font-extrabold transition",
            active === tab.id ? "bg-[#176c55] text-white" : "text-slate-700 hover:bg-slate-50",
          ].join(" ")}
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ExportButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 transition hover:border-[#176c55]/40 hover:text-[#176c55]"
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#176c55]/40 hover:text-[#176c55]"
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 border-slate-200 p-5 md:border-l md:first:border-l-0">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-slate-200 text-[#176c55]">
        {icon}
      </span>
      <div className="grid min-w-0 gap-1">
        <strong className="text-sm font-extrabold text-[#176c55]">
          {label}
        </strong>
        <span className="truncate text-sm font-medium text-slate-800">
          {value}
        </span>
      </div>
    </div>
  );
}

type RangeProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  className?: string;
  onChange: (value: number) => void;
};

function Range({ label, min, max, step = 1, value, className = "", onChange }: RangeProps) {
  return (
    <label className={["grid grid-cols-[112px_1fr_40px] items-center gap-3 max-md:grid-cols-[120px_1fr_42px]", className].join(" ")}>
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input
        className="engraving-range w-full"
        min={min}
        max={max}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output className="text-right text-xs font-semibold text-slate-500">
        {value}
      </output>
    </label>
  );
}

function OwleafMark() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M12 13 7 7v17c0 10 7 18 17 18s17-8 17-18V7l-5 6c-3-3-7-5-12-5s-9 2-12 5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="18" cy="22" r="4" fill="currentColor" />
      <circle cx="30" cy="22" r="4" fill="currentColor" />
      <path
        d="m21 31 3 3 3-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function OwleafMini() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M12 13 7 7v17c0 10 7 18 17 18s17-8 17-18V7l-5 6c-3-3-7-5-12-5s-9 2-12 5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="18" cy="22" r="4" fill="currentColor" />
      <circle cx="30" cy="22" r="4" fill="currentColor" />
    </svg>
  );
}
