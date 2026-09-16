"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authH(): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface Props {
  pdfBase64: string;
  onFirmado: (pdfB64: string) => void;
  onCerrar: () => void;
  soloVer?: boolean;
  /** Rol de quien está firmando — se usa para buscar automáticamente el lugar
   *  del documento donde le corresponde firmar, y hacer scroll/foco ahí. */
  rolFirmante?: "estudiante" | "director" | "coordinador";
}

// Palabras clave a buscar en el texto del PDF según el rol, para ubicar
// automáticamente el lugar de la firma correspondiente.
const PALABRAS_CLAVE_FIRMA: Record<string, string[]> = {
  estudiante:  ["firma del estudiante", "firma estudiante"],
  director:    ["firma del director", "firma director"],
  coordinador: ["firma del coordinador", "firma coordinador", "firma coordinador de posgrados"],
};

// ─── Popup de dibujo a mano alzada ──────────────────────────────

function PopupDibujarFirma({ onListo, onCerrar }: { onListo: (dataUrl: string) => void; onCerrar: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
  }, []);

  function coordenadas(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasRef.current!.width / r.width),
      y: (e.clientY - r.top) * (canvasRef.current!.height / r.height),
    };
  }

  function iniciar(e: React.PointerEvent<HTMLCanvasElement>) {
    dibujando.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = coordenadas(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = coordenadas(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setTieneTrazo(true);
  }

  function terminar() { dibujando.current = false; }

  function limpiar() {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    setTieneTrazo(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-5 max-w-lg w-full space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">✏️ Dibuja tu firma</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-red-600 text-xl font-bold">✕</button>
        </div>
        <p className="text-xs text-gray-500">Usa el mouse (o el dedo en pantalla táctil) para dibujar tu firma abajo.</p>
        <canvas
          ref={canvasRef}
          width={500} height={220}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg touch-none cursor-crosshair bg-white"
          style={{ maxHeight: "260px" }}
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerLeave={terminar}
        />
        <div className="flex items-center justify-between gap-3">
          <button onClick={limpiar} className="text-sm text-gray-500 hover:text-red-600 font-medium">
            🗑️ Limpiar
          </button>
          <button
            onClick={() => tieneTrazo && onListo(canvasRef.current!.toDataURL("image/png"))}
            disabled={!tieneTrazo}
            className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✓ Usar esta firma
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────

export default function FirmadorPDF({ pdfBase64, onFirmado, onCerrar, rolFirmante }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const scrollRef      = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const yaHizoScrollFirma = useRef(false);

  const [pdfDoc, setPdfDoc]             = useState<any>(null);
  const [pagina, setPagina]             = useState(1);
  const [totalPag, setTotalPag]         = useState(1);
  const [escala, setEscala]             = useState(1.4);

  const [firmaB64, setFirmaB64]             = useState<string | null>(null); // PNG limpio (sin fondo), listo para incrustar en el PDF
  const [firmaDataUrl, setFirmaDataUrl]     = useState<string | null>(null); // para mostrar en pantalla
  const [firmaPerfilUrl, setFirmaPerfilUrl] = useState<string | null>(null);

  const [mostrarDibujo, setMostrarDibujo] = useState(false);

  // Recuadro de firma superpuesto — coordenadas en px CSS relativas al contenedor
  const [caja, setCaja] = useState({ x: 40, y: 40, w: 160, h: 70 });
  const arrastre = useRef<{ modo: "mover" | "redimensionar"; inicioX: number; inicioY: number; caja0: typeof caja } | null>(null);

  const [procesando, setProcesando] = useState(false);
  const [firmado, setFirmado]       = useState(false);
  const [posicionFirma, setPosicionFirma] = useState<{ pagina: number; yRelativo: number } | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);

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

  useEffect(() => {
    if (!pdfBase64) return;
    const cargar = async () => {
      await waitFor(() => !!(window as any).pdfjsLib);
      const bytes = b64ToArr(pdfBase64);
      const doc   = await (window as any).pdfjsLib.getDocument({ data: bytes }).promise;
      setPdfDoc(doc);
      setTotalPag(doc.numPages);

      // Buscar automáticamente la página/posición donde este rol debe firmar,
      // en vez de arrancar siempre en la página 1.
      if (rolFirmante && PALABRAS_CLAVE_FIRMA[rolFirmante]) {
        setBuscandoUbicacion(true);
        const encontrado = await buscarPosicionFirma(doc, rolFirmante);
        setBuscandoUbicacion(false);
        if (encontrado) {
          setPosicionFirma(encontrado);
          setPagina(encontrado.pagina);
          return;
        }
      }
      setPagina(1);
    };
    cargar();
  }, [pdfBase64, rolFirmante]);

  async function buscarPosicionFirma(doc: any, rol: string): Promise<{ pagina: number; yRelativo: number } | null> {
    const terminos = PALABRAS_CLAVE_FIRMA[rol] || [];
    if (!terminos.length) return null;
    try {
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const textContent = await page.getTextContent();
        const vp = page.getViewport({ scale: 1 });
        for (const item of textContent.items as any[]) {
          const texto = (item.str || "").toLowerCase();
          if (terminos.some(t => texto.includes(t))) {
            const yPdf = item.transform[5]; // origen abajo-izquierda
            const yDesdeArriba = vp.height - yPdf;
            return { pagina: p, yRelativo: yDesdeArriba / vp.height };
          }
        }
      }
    } catch (e) {
      console.error("No se pudo buscar la posición de firma:", e);
    }
    return null;
  }

  useEffect(() => { if (pdfDoc) renderPagina(); }, [pdfDoc, pagina, escala]);

  async function renderPagina() {
    if (!pdfDoc || !canvasRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch (_) {}
      renderTaskRef.current = null;
    }
    try {
      const page   = await pdfDoc.getPage(pagina);
      const vp     = page.getViewport({ scale: escala });
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext("2d")!;
      canvas.width  = vp.width;
      canvas.height = vp.height;
      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;

      // Si ya sabemos dónde debe firmar este rol, y estamos en esa página,
      // hacemos scroll ahí automáticamente (solo la primera vez).
      if (posicionFirma && posicionFirma.pagina === pagina && !yaHizoScrollFirma.current && scrollRef.current) {
        yaHizoScrollFirma.current = true;
        const yPx = canvas.height * posicionFirma.yRelativo;
        const contenedorAltura = scrollRef.current.clientHeight;
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: Math.max(0, yPx - contenedorAltura / 3), behavior: "smooth" });
        }, 100);
        // También sugerimos la caja de firma cerca de esa posición, para que
        // el estudiante/director no tenga que arrastrarla desde la esquina.
        setCaja(c => ({ ...c, y: Math.max(0, yPx - c.h / 2) }));
      }
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") console.error("Error renderizando PDF:", e);
    }
  }

  function b64ToArr(b64: string): Uint8Array {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  function arrToB64(bytes: Uint8Array): string {
    let bin = "";
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK)
      bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    return btoa(bin);
  }

  async function waitFor(fn: () => boolean) {
    return new Promise<void>(res => {
      const i = setInterval(() => { if (fn()) { clearInterval(i); res(); } }, 100);
    });
  }

  // Quita el fondo blanco de la imagen de firma y la deja lista para incrustar
  function procesarFirma(dataUrl: string) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const tmp = document.createElement("canvas");
      tmp.width = img.width; tmp.height = img.height;
      const ctx = tmp.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, tmp.width, tmp.height);
      for (let i = 0; i < data.data.length; i += 4)
        if (data.data[i] > 220 && data.data[i+1] > 220 && data.data[i+2] > 220)
          data.data[i+3] = 0;
      ctx.putImageData(data, 0, 0);
      const clean = tmp.toDataURL("image/png");
      setFirmaB64(clean.split(",")[1]);
      setFirmaDataUrl(clean);

      // Recuadro inicial: tamaño proporcional a la firma, centrado
      const cvs = canvasRef.current;
      const anchoDisponible = cvs ? cvs.getBoundingClientRect().width : 400;
      const w = Math.min(200, anchoDisponible * 0.35);
      const h = w * (img.height / img.width);
      setCaja({ x: 40, y: 40, w, h });
      setFirmado(false);
      setMostrarDibujo(false);
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
    img.src = url + "?t=" + Date.now();
    img.onload = () => {
      const tmp = document.createElement("canvas");
      tmp.width = img.width; tmp.height = img.height;
      tmp.getContext("2d")!.drawImage(img, 0, 0);
      procesarFirma(tmp.toDataURL("image/png"));
    };
    img.onerror = () => {
      fetch(url)
        .then(r => r.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = e => procesarFirma(e.target!.result as string);
          reader.readAsDataURL(blob);
        })
        .catch(() => alert("No se pudo cargar la firma guardada"));
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

  // ── Arrastrar / redimensionar el recuadro ──────────────────────

  const handlePointerDownMover = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    arrastre.current = { modo: "mover", inicioX: e.clientX, inicioY: e.clientY, caja0: caja };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [caja]);

  const handlePointerDownRedimensionar = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    arrastre.current = { modo: "redimensionar", inicioX: e.clientX, inicioY: e.clientY, caja0: caja };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [caja]);

  const handlePointerMoveGlobal = useCallback((e: React.PointerEvent) => {
    if (!arrastre.current) return;
    const dx = e.clientX - arrastre.current.inicioX;
    const dy = e.clientY - arrastre.current.inicioY;
    const c0 = arrastre.current.caja0;

    if (arrastre.current.modo === "mover") {
      setCaja({ ...c0, x: c0.x + dx, y: c0.y + dy });
    } else {
      setCaja({ ...c0, w: Math.max(30, c0.w + dx), h: Math.max(20, c0.h + dy) });
    }
  }, []);

  const handlePointerUpGlobal = useCallback(() => { arrastre.current = null; }, []);

  function reiniciarFirma() {
    setFirmado(false);
    setFirmaB64(null);
    setFirmaDataUrl(null);
  }

  async function confirmarFirma() {
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
      const rectCanvas = canvas.getBoundingClientRect();
      const page       = doc.getPages()[pagina - 1];
      const { width, height } = page.getSize();

      // Convertir coordenadas del recuadro (CSS, relativas al canvas mostrado)
      // a coordenadas reales del PDF.
      const ratioX = width  / rectCanvas.width;
      const ratioY = height / rectCanvas.height;
      const pdfX = caja.x * ratioX;
      const pdfW = caja.w * ratioX;
      const pdfH = caja.h * ratioY;
      const pdfY = height - (caja.y * ratioY) - pdfH;

      page.drawImage(firmaEmbed, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });
      const saved = await doc.save();
      setFirmado(true);
      onFirmado(arrToB64(new Uint8Array(saved)));
    } catch (e) {
      alert("Error al firmar: " + e);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">

      {mostrarDibujo && (
        <PopupDibujarFirma
          onListo={(dataUrl) => procesarFirma(dataUrl)}
          onCerrar={() => setMostrarDibujo(false)}
        />
      )}

      {/* Barra superior */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <h2 className="font-bold text-gray-800 text-sm">
          {firmado ? "✅ Firma colocada" : firmaDataUrl ? "📍 Ubica y ajusta tu firma sobre el documento" : "✍️ Elige cómo firmar"}
        </h2>

        <div className="flex items-center gap-2 text-xs text-gray-600 ml-auto">
          <button onClick={() => setPagina(p => Math.max(1, p-1))} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">◀</button>
          <span>Pág. {pagina} / {totalPag}</span>
          <button onClick={() => setPagina(p => Math.min(totalPag, p+1))} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">▶</button>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <button onClick={() => setEscala(e => Math.max(0.5, e-0.2))} className="px-2 py-1 bg-gray-100 rounded">−</button>
          <span>{Math.round(escala*100)}%</span>
          <button onClick={() => setEscala(e => Math.min(4, e+0.2))} className="px-2 py-1 bg-gray-100 rounded">+</button>
        </div>
        <button onClick={onCerrar} className="text-gray-400 hover:text-red-600 text-xl font-bold ml-1">✕</button>
      </div>

      {/* Banner firma colocada */}
      {firmado && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-xs text-green-700 flex items-center justify-center gap-4">
          <span>✅ Firma colocada correctamente</span>
          <button onClick={reiniciarFirma}
            className="bg-amber-500 text-white px-3 py-1 rounded-lg font-semibold hover:bg-amber-600">
            🔄 Volver a firmar
          </button>
          <button onClick={onCerrar}
            className="bg-green-700 text-white px-3 py-1 rounded-lg font-semibold hover:bg-green-800">
            ✓ Aceptar firma
          </button>
        </div>
      )}

      {/* Selector inicial: subir o dibujar */}
      {!firmado && !firmaDataUrl && (
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 flex-wrap justify-center">
          <label className="cursor-pointer flex items-center gap-2 bg-green-700 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-green-800">
            📁 Subir imagen de firma
            <input type="file" accept=".png,.jpg,.jpeg" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { cargarFirmaArchivo(f); guardarFirmaEnPerfil(f); } }} />
          </label>
          <button onClick={() => setMostrarDibujo(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700">
            ✏️ Dibujar mi firma
          </button>
          {firmaPerfilUrl && (
            <button onClick={() => cargarFirmaPerfil(firmaPerfilUrl)}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-3 rounded-xl text-sm hover:bg-gray-50">
              👤 Usar mi firma guardada
              <img src={firmaPerfilUrl} className="h-6 border rounded bg-white" alt="firma guardada" />
            </button>
          )}
        </div>
      )}

      {/* Instrucciones cuando ya hay firma para ubicar */}
      {!firmado && firmaDataUrl && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center flex items-center justify-center gap-4">
          <span>🖱️ Arrastra el recuadro para moverlo · arrastra la esquina ↘️ para cambiar el tamaño</span>
          <button onClick={reiniciarFirma} className="text-amber-700 underline hover:text-amber-900">
            ← Elegir otra firma
          </button>
        </div>
      )}

      {/* Canvas + recuadro superpuesto */}
      <div ref={scrollRef} className="flex-1 overflow-auto flex items-start justify-center p-4 bg-gray-700 relative">
        {buscandoUbicacion && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-lg px-4 py-2 text-xs text-gray-600 shadow z-10">
            🔍 Ubicando el lugar donde debes firmar...
          </div>
        )}
        <div ref={contenedorRef} style={{ position: "relative", display: "inline-block" }}>
          <canvas ref={canvasRef} className="shadow-2xl block" style={{ maxWidth: "100%" }} />

          {!firmado && firmaDataUrl && (
            <div
              onPointerDown={handlePointerDownMover}
              onPointerMove={handlePointerMoveGlobal}
              onPointerUp={handlePointerUpGlobal}
              style={{
                position: "absolute",
                left: caja.x, top: caja.y, width: caja.w, height: caja.h,
                border: "2px dashed #16a34a",
                background: "rgba(22,163,74,0.05)",
                cursor: "move",
                touchAction: "none",
              }}
            >
              <img src={firmaDataUrl} draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} alt="firma" />

              {/* Manija de redimensionar, esquina inferior derecha */}
              <div
                onPointerDown={handlePointerDownRedimensionar}
                onPointerMove={handlePointerMoveGlobal}
                onPointerUp={handlePointerUpGlobal}
                style={{
                  position: "absolute", right: -8, bottom: -8,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#16a34a", border: "2px solid white",
                  cursor: "nwse-resize", touchAction: "none",
                }}
              />
            </div>
          )}
        </div>

        {procesando && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Procesando firma...</p>
            </div>
          </div>
        )}
      </div>

      {/* Botón confirmar, fijo abajo mientras se está ubicando */}
      {!firmado && firmaDataUrl && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex justify-center">
          <button onClick={confirmarFirma} disabled={procesando}
            className="bg-green-700 text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-60">
            ✓ Confirmar firma aquí
          </button>
        </div>
      )}
    </div>
  );
}
