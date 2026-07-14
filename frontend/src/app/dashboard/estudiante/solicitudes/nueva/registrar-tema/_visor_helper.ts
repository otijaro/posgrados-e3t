  // Previsualizar → visor embebido (iframe) en la misma página
  const mostrarEnVisor = useCallback((b64: string) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const blob  = new Blob([bytes], { type: "application/pdf" });
    if (prevVisorUrl.current) URL.revokeObjectURL(prevVisorUrl.current);
    const url = URL.createObjectURL(blob);
    prevVisorUrl.current = url;
    setVisorUrl(url);
    setTimeout(() => visorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  const handlePrevisualizar = async () => {
    setGenerandoVer(true);
    setErrorServidor(null);
    try {
      const b64 = await fetchPDF();
      mostrarEnVisor(b64);
    } catch (err: unknown) {
      setErrorServidor(err instanceof Error ? err.message : "Error al generar el PDF");
    } finally {
      setGenerandoVer(false);
    }
  };

  // Firmar → genera PDF y abre el firmador modal
  const handleFirmar = async () => {
    setGenerandoPDF(true);
    setErrorServidor(null);
    try {
      const b64 = await fetchPDF();
      setPdfGenerado(b64);
      setMostrarFirmador(true);
    } catch (err: unknown) {
      setErrorServidor(err instanceof Error ? err.message : "Error al generar el PDF");
    } finally {
      setGenerandoPDF(false);
    }
  };