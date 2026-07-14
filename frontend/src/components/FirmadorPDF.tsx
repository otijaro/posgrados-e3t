"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authH() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface Props {
  pdfBase64: string;
  onFirmado: (pdfB64: string) => void;
  onCerrar: () => void;
  soloVer?: boolean;
}

type FaseFirma = "ajustar" | "ubicar";

export default function FirmadorPDF({ pdfBase64, onFirmado, onCerrar }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const firmaPreview = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc]             = useState<any>(null);
  const [pagina, setPagina]             = useState(1);
  const [totalPag, setTotalPag]         = useState(1);
  const [escala, setEscala]             = useState(1.4);
  const [pdfImageData, setPdfImageData] = useState<ImageData | null>(null);

  const [firmaB64, setFirmaB64]         = useState<string | null>(null);
  const [firmaImg, setFirmaImg]         = useState<HTMLImageElement | null>(null);
  const [firmaW, setFirmaW]             = useState(0);
  const [firmaH, setFirmaH]             = useState(0);
  const [escalaFirma, setEscalaFirma]   = useState(1.0);
  const [firmaPerfilUrl, setFirmaPerfilUrl] = useState<string | null>(null);

  const [fase, setFase]             = useState<FaseFirma>("ajustar");
  const [preview, setPreview]       = useState({ x: 0, y: 0, visible: false });
  const [procesando, setProcesando] = useState(false);

  // ── Cargar librerías ──────────────────────────────────────────────────────

  useEffect(() => {
    const s1 = document.createElement("script");
    s1.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js";
    s1.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";
    };
    document.head.appendChild(s1);
    const s2 = document.createElement("script");
    s2.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    document.head.appendChild(s2);

    fetch(`${API_URL}/api/firmas/mi-firma`, { headers: authH() })
      .then(r => r.json())
      .then(d => { if (d.firma_url) setFirmaPerfilUrl(`${API_URL}${d.firma_url}`); })
      .catch(() => {});
  }, []);

  // ── Cargar PDF ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!pdfBase64) return;
    const cargar = async () => {
      await waitFor(() => !!(window as any).pdfjsLib);
      const bytes = b64ToArr(pdfBase64);
      const doc   = await (window as any).pdfjsLib.getDocument({ data: bytes }).promise;
      setPdfDoc(doc);
      setTotalPag(doc.numPages);
      setPagina(1);
    };
    cargar();
  }, [pdfBase64]);

  useEffect(() => { if (pdfDoc) renderPagina(); }, [pdfDoc, pagina, escala]);

  async function renderPagina() {
    if (!pdfDoc || !canvasRef.current) return;
    const page   = await pdfDoc.getPage(pagina);
    const vp     = page.getViewport({ scale: escala });
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d")!;
    canvas.width  = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    setPdfImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }

  // ── Preview firma en canvas ───────────────────────────────────────────────

  useEffect(() => {
    if (!canvasRef.current || !pdfImageData) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.putImageData(pdfImageData, 0, 0);
    if (fase === "ubicar" && preview.visible && firmaImg) {
      const w = firmaW * escalaFirma;
      const h = firmaH * escalaFirma;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(firmaImg, preview.x - w/2, preview.y - h/2, w, h);
      ctx.globalAlpha = 1;
    }
  }, [preview, firmaImg, escalaFirma, pdfImageData, fase]);

  // ── Preview firma en panel ────────────────────────────────────────────────

  useEffect(() => {
    if (!firmaPreview.current || !firmaImg) return;
    const cvs   = firmaPreview.current;
    const ratio = Math.min(260 / firmaW, 100 / firmaH);
    cvs.width   = firmaW * ratio * escalaFirma;
    cvs.height  = firmaH * ratio * escalaFirma;
    const ctx   = cvs.getContext("2d")!;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.drawImage(firmaImg, 0, 0, cvs.width, cvs.height);
  }, [firmaImg, escalaFirma, firmaW, firmaH]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function b64ToArr(b64: string): Uint8Array {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  function arrToB64(bytes: Uint8Array): string {
    // Convertir en chunks para evitar "Maximum call stack size exceeded"
    let bin = "";
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }

  async function waitFor(fn: () => boolean) {
    return new Promise<void>(res => {
      const i = setInterval(() => { if (fn()) { clearInterval(i); res(); } }, 100);
    });
  }

  // ── Procesar imagen de firma ──────────────────────────────────────────────

  function procesarFirma(dataUrl: string) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const tmp = document.createElement("canvas");
      tmp.width  = img.width;
      tmp.height = img.height;
      const ctx  = tmp.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, tmp.width, tmp.height);
      for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i] > 220 && data.data[i+1] > 220 && data.data[i+2] > 220)
          data.data[i+3] = 0;
      }
      ctx.putImageData(data, 0, 0);
      const clean = tmp.toDataURL("image/png");
      setFirmaB64(clean.split(",")[1]);
      setFirmaW(img.width);
      setFirmaH(img.height);
      setEscalaFirma(1.0);
      const imgEl = new Image();
      imgEl.src = clean;
      imgEl.onload = () => { setFirmaImg(imgEl); setFase("ajustar"); };
    };
  }

  function cargarFirmaArchivo(file: File) {
    const reader = new FileReader();
    reader.onload = e => procesarFirma(e.target!.result as string);
    reader.readAsDataURL(file);
  }

  function cargarFirmaPerfil(url: string) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const tmp = document.createElement("canvas");
      tmp.width = img.width; tmp.height = img.height;
      tmp.getContext("2d")!.drawImage(img, 0, 0);
      procesarFirma(tmp.toDataURL("image/png"));
    };
  }

  async function guardarFirmaEnPerfil(file: File) {
    const form = new FormData();
    form.append("firma", file);
    fetch(`${API_URL}/api/firmas/mi-firma`, { method: "POST", headers: authH(), body: form })
      .then(r => r.json())
      .then(d => setFirmaPerfilUrl(`${API_URL}${d.url}?t=${Date.now()}`))
      .catch(() => {});
  }

  // ── Firmar el PDF ─────────────────────────────────────────────────────────

  async function firmar(x: number, y: number) {
    if (!firmaB64 || !canvasRef.current) return;
    setProcesando(true);
    try {
      await waitFor(() => !!(window as any).PDFLib);
      const { PDFDocument } = (window as any).PDFLib;
      const pdfBytes   = b64ToArr(pdfBase64);
      const doc        = await PDFDocument.load(pdfBytes);
      const firmaBytes = b64ToArr(firmaB64);
      const firmaEmbed = await doc.embedPng(firmaBytes);
      const canvas     = canvasRef.current;
      const page       = doc.getPages()[pagina - 1];
      const { width, height } = page.getSize();
      const pdfX = (x / canvas.width)  * width;
      const pdfY = height - (y / canvas.height) * height;
      const w    = firmaW * escalaFirma * (width  / canvas.width);
      const h    = firmaH * escalaFirma * (height / canvas.height);
      page.drawImage(firmaEmbed, { x: pdfX - w/2, y: pdfY - h/2, width: w, height: h });
      const saved = await doc.save();
      // ← Fix: usar chunks en vez de spread para no desbordar la pila
      onFirmado(arrToB64(new Uint8Array(saved)));
    } catch (e) {
      alert("Error al firmar: " + e);
    } finally {
      setProcesando(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">

      {/* Barra superior */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <h2 className="font-bold text-gray-800 text-sm">
          {fase === "ajustar" ? "🔧 Ajustar tamaño de la firma" : "📍 Ubicar firma en el documento"}
        </h2>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-1 text-xs ml-2">
          {[{ key: "ajustar", label: "1. Ajustar" }, { key: "ubicar", label: "2. Firmar" }].map((paso, i) => (
            <span key={paso.key} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">›</span>}
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                fase === paso.key ? "bg-green-700 text-white" :
                (fase === "ubicar" && paso.key === "ajustar") ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-400"
              }`}>{paso.label}</span>
            </span>
          ))}
        </div>

        {/* Páginas */}
        <div className="flex items-center gap-2 text-xs text-gray-600 ml-auto">
          <button onClick={() => setPagina(p => Math.max(1, p-1))} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">◀</button>
          <span>Pág. {pagina} / {totalPag}</span>
          <button onClick={() => setPagina(p => Math.min(totalPag, p+1))} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">▶</button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <button onClick={() => setEscala(e => Math.max(0.5, e-0.2))} className="px-2 py-1 bg-gray-100 rounded">−</button>
          <span>{Math.round(escala*100)}%</span>
          <button onClick={() => setEscala(e => Math.min(4, e+0.2))} className="px-2 py-1 bg-gray-100 rounded">+</button>
        </div>

        <button onClick={onCerrar} className="text-gray-400 hover:text-red-600 text-xl font-bold ml-1">✕</button>
      </div>

      {/* ── FASE 1: AJUSTAR ── */}
      {fase === "ajustar" && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-800">
              📎 {firmaImg ? "Cambiar firma" : "Subir imagen de firma"}
              <input type="file" accept=".png,.jpg,.jpeg" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { cargarFirmaArchivo(f); guardarFirmaEnPerfil(f); } }} />
            </label>
            {firmaPerfilUrl && (
              <button onClick={() => cargarFirmaPerfil(firmaPerfilUrl)}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1">
                👤 Usar guardada
                <img src={firmaPerfilUrl} className="h-5 ml-1 border rounded bg-white" alt="firma" />
              </button>
            )}
          </div>

          {firmaImg && (
            <>
              <div className="flex items-center gap-3 border-l pl-4">
                <span className="text-xs text-gray-500 font-medium">Tamaño:</span>
                <button onClick={() => setEscalaFirma(e => Math.max(0.1, +(e-0.1).toFixed(1)))}
                  className="w-7 h-7 bg-gray-100 rounded-full font-bold hover:bg-gray-200 flex items-center justify-center">−</button>
                <input type="range" min={0.1} max={3} step={0.05} value={escalaFirma}
                  onChange={e => setEscalaFirma(parseFloat(e.target.value))} className="w-28" />
                <button onClick={() => setEscalaFirma(e => Math.min(3, +(e+0.1).toFixed(1)))}
                  className="w-7 h-7 bg-gray-100 rounded-full font-bold hover:bg-gray-200 flex items-center justify-center">+</button>
                <span className="text-xs font-mono text-gray-600 w-10">{Math.round(escalaFirma*100)}%</span>
              </div>
              <div className="flex items-center gap-3 border-l pl-4">
                <span className="text-xs text-gray-500 font-medium">Vista previa:</span>
                <div className="border border-gray-200 rounded bg-gray-50 p-1 min-w-[80px] min-h-[40px] flex items-center justify-center">
                  <canvas ref={firmaPreview} className="max-w-[260px] max-h-[100px]" />
                </div>
              </div>
              <button onClick={() => setFase("ubicar")}
                className="ml-auto bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800">
                Listo, ubicar firma →
              </button>
            </>
          )}
          {!firmaImg && <span className="text-xs text-gray-400 italic">Sube una imagen para ajustar su tamaño</span>}
        </div>
      )}

      {/* ── FASE 2: UBICAR ── */}
      {fase === "ubicar" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center flex items-center justify-center gap-4">
          <span>🖱️ Mueve el mouse para ver la firma · <strong>Haz clic</strong> para colocarla</span>
          <button onClick={() => setFase("ajustar")} className="text-amber-700 underline hover:text-amber-900">
            ← Volver a ajustar
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-gray-700 relative">
        <canvas
          ref={canvasRef}
          className={`shadow-2xl ${fase === "ubicar" && firmaImg ? "cursor-crosshair" : "cursor-default"}`}
          style={{ maxWidth: "100%" }}
          onMouseMove={e => {
            if (fase !== "ubicar" || !firmaImg) return;
            const r = canvasRef.current!.getBoundingClientRect();
            setPreview({ x: (e.clientX-r.left)*canvasRef.current!.width/r.width, y: (e.clientY-r.top)*canvasRef.current!.height/r.height, visible: true });
          }}
          onMouseLeave={() => setPreview(p => ({ ...p, visible: false }))}
          onClick={e => {
            if (fase !== "ubicar" || !firmaImg) return;
            const r = canvasRef.current!.getBoundingClientRect();
            firmar((e.clientX-r.left)*canvasRef.current!.width/r.width, (e.clientY-r.top)*canvasRef.current!.height/r.height);
          }}
          onWheel={e => { e.preventDefault(); setEscala(s => Math.min(4, Math.max(0.5, s+(e.deltaY<0?0.2:-0.2)))); }}
        />
        {procesando && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Procesando firma...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
