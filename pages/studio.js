import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Head from "next/head";
import { supabase } from "../lib/supabaseClient";

const COLORS = [
  { name: "Ink", value: "#15121C" },
  { name: "Coral", value: "#FF4D6D" },
  { name: "Cyan", value: "#3FE8E0" },
  { name: "Gold", value: "#FFC857" },
  { name: "Violet", value: "#7C5CFF" },
  { name: "Moss", value: "#4E8B5C" },
  { name: "Blush", value: "#FF9AA8" },
  { name: "White", value: "#F5EFE0" },
];

export default function Studio() {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const lastMidPoint = useRef(null);
  const lastTime = useRef(null);

  const [color, setColor] = useState(COLORS[0].value);
  const [size, setSize] = useState(6);
  const [tool, setTool] = useState("brush"); // "brush" | "eraser"
  const [opacity, setOpacity] = useState(100);
  const [softBrush, setSoftBrush] = useState(false);
  const [blendMix, setBlendMix] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSaveBox, setShowSaveBox] = useState(false);
  const [drawingName, setDrawingName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  function pushHistory() {
    const canvas = canvasRef.current;
    setHistory((h) => {
      const next = [...h, canvas.toDataURL("image/png")];
      return next.length > 15 ? next.slice(next.length - 15) : next;
    });
  }

  function undo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const next = [...h];
      const last = next.pop();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      };
      img.src = last;
      return next;
    });
  }

  // Set up canvas at device pixel ratio for crisp lines
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const ratio = window.devicePixelRatio || 1;

    function resize() {
      const { width, height } = parent.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      const prev = document.createElement("canvas");
      prev.width = canvas.width;
      prev.height = canvas.height;
      prev.getContext("2d").drawImage(canvas, 0, 0);

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.drawImage(prev, 0, 0, prev.width / ratio, prev.height / ratio);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }, []);

  function startDraw(e) {
    e.preventDefault();
    pushHistory();
    isDrawing.current = true;
    const point = getPoint(e);
    lastPoint.current = point;
    lastMidPoint.current = point;
    lastTime.current = performance.now();
  }

  function draw(e) {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(e);

    const now = performance.now();
    const dt = Math.max(now - (lastTime.current || now), 1);
    const dx = point.x - lastPoint.current.x;
    const dy = point.y - lastPoint.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = dist / dt; // px per ms

    const baseWidth = tool === "eraser" ? size * 3 : size;
    // Faster movement -> thinner line, like a real hand-drawn taper.
    // No effect on eraser, which should stay a consistent width.
    const taper = tool === "eraser" ? 1 : Math.max(0.4, 1 - speed * 1.8);
    const strokeWidth = baseWidth * taper;

    const midPoint = {
      x: (lastPoint.current.x + point.x) / 2,
      y: (lastPoint.current.y + point.y) / 2,
    };

    ctx.save();
    ctx.globalAlpha = tool === "eraser" ? 1 : opacity / 100;
    ctx.globalCompositeOperation =
      tool === "brush" && blendMix ? "multiply" : "source-over";
    if (tool === "brush" && softBrush) {
      ctx.filter = `blur(${Math.max(1, strokeWidth * 0.18)}px)`;
    }

    ctx.beginPath();
    ctx.moveTo(lastMidPoint.current.x, lastMidPoint.current.y);
    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midPoint.x, midPoint.y);
    ctx.strokeStyle = tool === "eraser" ? "#F5EFE0" : color;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
    ctx.restore();

    lastPoint.current = point;
    lastMidPoint.current = midPoint;
    lastTime.current = now;
  }

  function endDraw() {
    isDrawing.current = false;
    lastPoint.current = null;
  }

  function fillPaper() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#F5EFE0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function clearCanvas() {
    pushHistory();
    fillPaper();
  }

  function saveDrawing() {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "my-drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function saveToLibrary() {
    if (!drawingName.trim()) {
      setSaveMessage("Give it a name first.");
      return;
    }
    setSaving(true);
    setSaveMessage(null);

    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png");

      const { error } = await supabase
        .from("drawings")
        .insert([{ name: drawingName.trim(), image_data: imageData }]);

      if (error) throw error;

      setSaveMessage("Saved!");
      setDrawingName("");
      setTimeout(() => {
        setShowSaveBox(false);
        setSaveMessage(null);
      }, 1200);
    } catch (err) {
      setSaveMessage(err.message || "Something went wrong saving.");
    } finally {
      setSaving(false);
    }
  }

  function drawImageOntoCanvas(dataUri) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    };
    img.src = dataUri;
  }

  // Fill canvas with paper color on first mount, or load a drawing sent
  // over from the Library ("Edit in Studio").
  useEffect(() => {
    let pending = null;
    try {
      const raw = sessionStorage.getItem("loadIntoStudio");
      if (raw) {
        pending = JSON.parse(raw);
        sessionStorage.removeItem("loadIntoStudio");
      }
    } catch (err) {
      pending = null;
    }

    if (pending && pending.image_data) {
      fillPaper();
      drawImageOntoCanvas(pending.image_data);
      setDrawingName(pending.name || "");
    } else {
      fillPaper();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: "Space Grotesk", sans-serif;
          background: #15121c;
        }
      `}</style>

      <main style={styles.main}>
        <header style={styles.header}>
          <Link href="/" style={styles.backLink}>
            ← Analyzer
          </Link>
          <h1 style={styles.title}>Studio</h1>
          <Link href="/library" style={styles.backLink}>
            Library →
          </Link>
        </header>
        <div style={{ padding: "0 16px 8px", textAlign: "center" }}>
          <Link href="/vector" style={{ fontSize: 12, color: "#7C5CFF", textDecoration: "none" }}>
            Try the new Vector editor →
          </Link>
        </div>

        <div style={styles.controlBar}>
          <div style={styles.swatchRow}>
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setColor(c.value);
                  setTool("brush");
                }}
                aria-label={c.name}
                style={{
                  ...styles.swatch,
                  background: c.value,
                  outline:
                    color === c.value && tool === "brush"
                      ? "3px solid #FF4D6D"
                      : "2px solid rgba(245,239,224,0.25)",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>

          <div style={styles.sizeRow}>
            <span style={styles.sizeLabel}>Size</span>
            <input
              type="range"
              min="2"
              max="40"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={styles.slider}
            />
            <span
              style={{
                ...styles.sizePreview,
                width: Math.max(size, 6),
                height: Math.max(size, 6),
                background: tool === "eraser" ? "#F5EFE0" : color,
                border: tool === "eraser" ? "1px solid #FFC857" : "none",
              }}
            />
          </div>

          <div style={styles.sizeRow}>
            <span style={styles.sizeLabel}>Opacity</span>
            <input
              type="range"
              min="10"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.opacityValue}>{opacity}%</span>
          </div>

          <div style={styles.toggleRow}>
            <button
              onClick={() => setSoftBrush((v) => !v)}
              style={{
                ...styles.toggleChip,
                ...(softBrush ? styles.toggleChipActive : {}),
              }}
            >
              Soft edge
            </button>
            <button
              onClick={() => setBlendMix((v) => !v)}
              style={{
                ...styles.toggleChip,
                ...(blendMix ? styles.toggleChipActive : {}),
              }}
            >
              Blend colors
            </button>
          </div>
        </div>

        <div style={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>

        <div style={styles.dock}>
          <button
            onClick={undo}
            disabled={history.length === 0}
            style={{
              ...styles.toolButton,
              opacity: history.length === 0 ? 0.4 : 1,
            }}
          >
            Undo
          </button>
          <button
            onClick={() => setTool("brush")}
            style={{
              ...styles.toolButton,
              ...(tool === "brush" ? styles.toolButtonActive : {}),
            }}
          >
            Brush
          </button>
          <button
            onClick={() => setTool("eraser")}
            style={{
              ...styles.toolButton,
              ...(tool === "eraser" ? styles.toolButtonActiveGold : {}),
            }}
          >
            Eraser
          </button>
          <button onClick={saveDrawing} style={styles.toolButton}>
            Save
          </button>
          <button
            onClick={() => setShowSaveBox(true)}
            style={{ ...styles.toolButton, ...styles.toolButtonActiveCyan }}
          >
            Save to Library
          </button>
          <button onClick={clearCanvas} style={styles.clearButton}>
            Clear
          </button>
        </div>
        {showSaveBox && (
          <div style={styles.overlay}>
            <div style={styles.overlayCard}>
              <p style={styles.overlayTitle}>Name this drawing</p>
              <input
                type="text"
                placeholder="e.g. blue hair warrior"
                value={drawingName}
                onChange={(e) => setDrawingName(e.target.value)}
                style={styles.overlayInput}
                autoFocus
              />
              <div style={styles.overlayButtons}>
                <button
                  onClick={() => {
                    setShowSaveBox(false);
                    setSaveMessage(null);
                    setDrawingName("");
                  }}
                  style={styles.overlayCancel}
                >
                  Cancel
                </button>
                <button onClick={saveToLibrary} disabled={saving} style={styles.overlaySave}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
              {saveMessage && <p style={styles.overlayMessage}>{saveMessage}</p>}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#15121C",
    color: "#F5EFE0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px 8px",
  },
  backLink: {
    fontSize: 13,
    color: "#3FE8E0",
    textDecoration: "none",
    fontWeight: 500,
    width: 70,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.02em",
    margin: 0,
  },
  controlBar: {
    padding: "8px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  swatchRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  sizeRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  sizeLabel: {
    fontSize: 13,
    color: "rgba(245,239,224,0.6)",
    width: 36,
  },
  slider: {
    flex: 1,
    accentColor: "#FF4D6D",
  },
  sizePreview: {
    borderRadius: "50%",
    flexShrink: 0,
  },
  opacityValue: {
    fontSize: 12,
    color: "rgba(245,239,224,0.6)",
    width: 34,
    textAlign: "right",
    flexShrink: 0,
  },
  toggleRow: {
    display: "flex",
    gap: 10,
  },
  toggleChip: {
    flex: 1,
    padding: "8px 0",
    borderRadius: 8,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "transparent",
    color: "rgba(245,239,224,0.7)",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  toggleChipActive: {
    background: "#7C5CFF",
    borderColor: "#7C5CFF",
    color: "#F5EFE0",
  },
  canvasWrap: {
    flex: 1,
    margin: "0 16px 16px",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(245,239,224,0.15)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
    minHeight: 320,
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "100%",
    touchAction: "none",
  },
  dock: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    padding: "0 16px 24px",
  },
  toolButton: {
    flex: "1 1 30%",
    minWidth: 90,
    padding: "12px 0",
    borderRadius: 10,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "#2A2438",
    color: "#F5EFE0",
    fontFamily: "inherit",
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
  },
  toolButtonActive: {
    background: "#FF4D6D",
    borderColor: "#FF4D6D",
    color: "#15121C",
  },
  toolButtonActiveGold: {
    background: "#FFC857",
    borderColor: "#FFC857",
    color: "#15121C",
  },
  toolButtonActiveCyan: {
    background: "#3FE8E0",
    borderColor: "#3FE8E0",
    color: "#15121C",
  },
  clearButton: {
    flex: "1 1 30%",
    minWidth: 90,
    padding: "12px 0",
    borderRadius: 10,
    border: "1px solid rgba(63,232,224,0.4)",
    background: "transparent",
    color: "#3FE8E0",
    fontFamily: "inherit",
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(21,18,28,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 50,
  },
  overlayCard: {
    background: "#2A2438",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    border: "1px solid rgba(245,239,224,0.15)",
  },
  overlayTitle: {
    fontWeight: 700,
    fontSize: 16,
    margin: "0 0 12px",
  },
  overlayInput: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid rgba(245,239,224,0.25)",
    background: "#15121C",
    color: "#F5EFE0",
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
  },
  overlayButtons: {
    display: "flex",
    gap: 10,
    marginTop: 14,
  },
  overlayCancel: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "transparent",
    color: "#F5EFE0",
    fontFamily: "inherit",
    fontSize: 14,
    cursor: "pointer",
  },
  overlaySave: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: "none",
    background: "#3FE8E0",
    color: "#15121C",
    fontFamily: "inherit",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  overlayMessage: {
    marginTop: 10,
    fontSize: 13,
    color: "#FF9AA8",
    textAlign: "center",
  },
};
