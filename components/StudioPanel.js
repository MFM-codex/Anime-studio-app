import { useRef, useState, useEffect, useCallback } from "react";
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

export default function StudioPanel({ loadRequest, onLoadConsumed }) {
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
  const [customColors, setCustomColors] = useState([]);
  const [frames, setFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [showPlayback, setShowPlayback] = useState(false);
  const [fps, setFps] = useState(6);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const frameIdCounter = useRef(1);
  const [paletteEditMode, setPaletteEditMode] = useState(false);

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
    let initialized = false;

    function resize() {
      const { width, height } = parent.getBoundingClientRect();
      if (width === 0 || height === 0) return; // tab not visible yet

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

      if (!initialized) {
        // First time this canvas has a real size — paint the paper
        // background fresh instead of copying forward an empty 0x0 canvas.
        ctx.fillStyle = "#F5EFE0";
        ctx.fillRect(0, 0, width, height);
        initialized = true;

        setFrames((prev) =>
          prev.length === 0 ? [{ id: 1, dataUrl: canvas.toDataURL("image/png") }] : prev
        );
      } else {
        ctx.drawImage(prev, 0, 0, prev.width / ratio, prev.height / ratio);
      }
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
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
    const speed = dist / dt;

    const baseWidth = tool === "eraser" ? size * 3 : size;
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
      const syncedFrames = syncActiveFrame(frames);
      // First frame is the thumbnail/preview image shown in the Library
      // grid; the full set is stored in `frames` so it can be reloaded
      // and played back later. A single-frame drawing just has a
      // frames array of length 1 — fully backward compatible.
      const framesForStorage = syncedFrames.length > 0 ? syncedFrames : [
        { id: 1, dataUrl: imageData },
      ];

      const { error } = await supabase.from("drawings").insert([
        {
          name: drawingName.trim(),
          image_data: framesForStorage[0].dataUrl,
          frames: JSON.stringify(framesForStorage),
        },
      ]);

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

  // ---------- animation frames ----------
  function syncActiveFrame(frameList) {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return frameList;
    const snapshot = canvas.toDataURL("image/png");
    return frameList.map((f, i) =>
      i === activeFrameIndex ? { ...f, dataUrl: snapshot } : f
    );
  }

  function switchToFrame(index, frameList) {
    setActiveFrameIndex(index);
    drawImageOntoCanvas(frameList[index].dataUrl);
    setHistory([]);
  }

  function addFrame() {
    const synced = syncActiveFrame(frames);
    frameIdCounter.current += 1;
    const newFrame = { id: frameIdCounter.current, dataUrl: null };
    const insertAt = activeFrameIndex + 1;
    const next = [...synced.slice(0, insertAt), newFrame, ...synced.slice(insertAt)];
    setFrames(next);
    setActiveFrameIndex(insertAt);
    fillPaper();
    setHistory([]);
    // Capture the blank paper as this new frame's stored image
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        setFrames((prev) =>
          prev.map((f, i) => (i === insertAt ? { ...f, dataUrl } : f))
        );
      }
    }, 0);
  }

  function duplicateFrame() {
    const synced = syncActiveFrame(frames);
    frameIdCounter.current += 1;
    const current = synced[activeFrameIndex];
    const newFrame = { id: frameIdCounter.current, dataUrl: current.dataUrl };
    const insertAt = activeFrameIndex + 1;
    const next = [...synced.slice(0, insertAt), newFrame, ...synced.slice(insertAt)];
    setFrames(next);
    switchToFrame(insertAt, next);
  }

  function deleteFrame(index) {
    if (frames.length <= 1) return; // always keep at least one frame
    const next = frames.filter((_, i) => i !== index);
    let newActive = activeFrameIndex;
    if (index < activeFrameIndex) newActive -= 1;
    else if (index === activeFrameIndex) newActive = Math.min(index, next.length - 1);
    setFrames(next);
    switchToFrame(newActive, next);
  }

  function moveFrame(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= frames.length) return;
    const synced = syncActiveFrame(frames);
    const next = [...synced];
    [next[index], next[target]] = [next[target], next[index]];
    setFrames(next);
    if (activeFrameIndex === index) setActiveFrameIndex(target);
    else if (activeFrameIndex === target) setActiveFrameIndex(index);
  }

  function selectFrame(index) {
    if (index === activeFrameIndex) return;
    const synced = syncActiveFrame(frames);
    setFrames(synced);
    switchToFrame(index, synced);
  }

  function openPlayback() {
    const synced = syncActiveFrame(frames);
    setFrames(synced);
    setPlaybackIndex(0);
    setShowPlayback(true);
  }

  useEffect(() => {
    if (!showPlayback || frames.length === 0) return;
    const interval = setInterval(() => {
      setPlaybackIndex((i) => (i + 1) % frames.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [showPlayback, fps, frames.length]);

  // Receive a drawing sent over from the Library panel ("Edit in Studio").
  // The canvas may not be sized yet if this tab was just switched to in
  // the same action — wait a frame until it has real dimensions.
  useEffect(() => {
    if (!(loadRequest && loadRequest.image_data)) return;

    let cancelled = false;
    function attempt() {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas || canvas.width === 0) {
        requestAnimationFrame(attempt);
        return;
      }
      fillPaper();

      if (loadRequest.frames && loadRequest.frames.length > 0) {
        frameIdCounter.current = loadRequest.frames.length + 1;
        setFrames(loadRequest.frames);
        setActiveFrameIndex(0);
        drawImageOntoCanvas(loadRequest.frames[0].dataUrl);
      } else {
        drawImageOntoCanvas(loadRequest.image_data);
        setFrames([{ id: 1, dataUrl: loadRequest.image_data }]);
        setActiveFrameIndex(0);
      }

      setDrawingName(loadRequest.name || "");
      setHistory([]);
      if (onLoadConsumed) onLoadConsumed();
    }
    attempt();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRequest]);

  // Load any custom palette colors saved on this device
  useEffect(() => {
    try {
      const raw = localStorage.getItem("customPaletteColors");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCustomColors(parsed);
      }
    } catch (err) {
      // ignore malformed/missing storage
    }
  }, []);

  function addCustomColor(hex) {
    setCustomColors((prev) => {
      if (prev.includes(hex)) return prev;
      const next = [...prev, hex];
      try {
        localStorage.setItem("customPaletteColors", JSON.stringify(next));
      } catch (err) {
        // ignore storage failures
      }
      return next;
    });
    setColor(hex);
    setTool("brush");
  }

  function removeCustomColor(hex) {
    setCustomColors((prev) => {
      const next = prev.filter((c) => c !== hex);
      try {
        localStorage.setItem("customPaletteColors", JSON.stringify(next));
      } catch (err) {
        // ignore storage failures
      }
      return next;
    });
  }

  return (
    <div style={styles.wrap}>
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

          {customColors.map((hex) => (
            <div key={hex} style={styles.customSwatchWrap}>
              <button
                onClick={() => {
                  if (paletteEditMode) return;
                  setColor(hex);
                  setTool("brush");
                }}
                aria-label={hex}
                style={{
                  ...styles.swatch,
                  background: hex,
                  outline:
                    color === hex && tool === "brush"
                      ? "3px solid #FF4D6D"
                      : "2px solid rgba(245,239,224,0.25)",
                  outlineOffset: 2,
                }}
              />
              {paletteEditMode && (
                <button
                  onClick={() => removeCustomColor(hex)}
                  style={styles.customSwatchRemove}
                  aria-label={`Remove ${hex}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <label style={styles.addSwatchButton}>
            +
            <input
              type="color"
              onChange={(e) => addCustomColor(e.target.value)}
              style={styles.hiddenColorInput}
            />
          </label>

          {customColors.length > 0 && (
            <button
              onClick={() => setPaletteEditMode((v) => !v)}
              style={{
                ...styles.editPaletteButton,
                ...(paletteEditMode ? styles.editPaletteButtonActive : {}),
              }}
            >
              {paletteEditMode ? "Done" : "Edit"}
            </button>
          )}
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

      <div style={styles.filmstrip}>
        {frames.map((frame, i) => (
          <div key={frame.id} style={styles.frameThumbWrap}>
            <button
              onClick={() => selectFrame(i)}
              style={{
                ...styles.frameThumbButton,
                ...(i === activeFrameIndex ? styles.frameThumbButtonActive : {}),
              }}
            >
              {frame.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={frame.dataUrl} alt={`Frame ${i + 1}`} style={styles.frameThumbImg} />
              ) : (
                <span style={styles.frameThumbLoading}>…</span>
              )}
            </button>
            <div style={styles.frameThumbControls}>
              <button
                onClick={() => moveFrame(i, -1)}
                disabled={i === 0}
                style={{ ...styles.frameMiniButton, opacity: i === 0 ? 0.3 : 1 }}
              >
                ←
              </button>
              <span style={styles.frameNumber}>{i + 1}</span>
              <button
                onClick={() => moveFrame(i, 1)}
                disabled={i === frames.length - 1}
                style={{
                  ...styles.frameMiniButton,
                  opacity: i === frames.length - 1 ? 0.3 : 1,
                }}
              >
                →
              </button>
            </div>
            {frames.length > 1 && (
              <button onClick={() => deleteFrame(i)} style={styles.frameDeleteButton}>
                ×
              </button>
            )}
          </div>
        ))}

        <div style={styles.frameAddWrap}>
          <button onClick={addFrame} style={styles.frameAddButton}>
            + Frame
          </button>
          <button onClick={duplicateFrame} style={styles.frameAddButton}>
            Duplicate
          </button>
        </div>
      </div>

      <div style={styles.dock}>
        <button onClick={openPlayback} style={{ ...styles.toolButton, ...styles.toolButtonActiveViolet }}>
          ▶ Play ({frames.length})
        </button>
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

      {showPlayback && (
        <div style={styles.overlay}>
          <div style={styles.playbackCard}>
            <p style={styles.overlayTitle}>Preview ({frames.length} frames)</p>
            {frames[playbackIndex] && frames[playbackIndex].dataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frames[playbackIndex].dataUrl}
                alt="Animation preview"
                style={styles.playbackImage}
              />
            )}
            <div style={styles.sizeRow}>
              <span style={styles.sizeLabel}>Speed</span>
              <input
                type="range"
                min="1"
                max="24"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.opacityValue}>{fps} fps</span>
            </div>
            <button
              onClick={() => setShowPlayback(false)}
              style={{ ...styles.overlaySave, marginTop: 14 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    minHeight: "70vh",
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
  customSwatchWrap: {
    position: "relative",
    width: 32,
    height: 32,
  },
  customSwatchRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "none",
    background: "#FF4D6D",
    color: "#15121C",
    fontSize: 12,
    lineHeight: "18px",
    padding: 0,
    cursor: "pointer",
  },
  addSwatchButton: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px dashed rgba(245,239,224,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(245,239,224,0.6)",
    fontSize: 18,
    cursor: "pointer",
    position: "relative",
  },
  hiddenColorInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
  editPaletteButton: {
    padding: "0 10px",
    height: 32,
    borderRadius: 16,
    border: "1px solid rgba(245,239,224,0.25)",
    background: "transparent",
    color: "rgba(245,239,224,0.7)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  },
  editPaletteButtonActive: {
    background: "#3FE8E0",
    borderColor: "#3FE8E0",
    color: "#15121C",
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
    height: "55vh",
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
  toolButtonActiveViolet: {
    background: "#7C5CFF",
    borderColor: "#7C5CFF",
    color: "#F5EFE0",
    flex: "1 1 100%",
  },
  filmstrip: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    padding: "0 16px 16px",
    alignItems: "flex-start",
  },
  frameThumbWrap: {
    position: "relative",
    flexShrink: 0,
    width: 56,
  },
  frameThumbButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    border: "2px solid rgba(245,239,224,0.2)",
    padding: 0,
    overflow: "hidden",
    background: "#2A2438",
    cursor: "pointer",
  },
  frameThumbButtonActive: {
    borderColor: "#FF4D6D",
  },
  frameThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  frameThumbLoading: {
    color: "rgba(245,239,224,0.4)",
    fontSize: 12,
  },
  frameThumbControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  frameMiniButton: {
    width: 18,
    height: 18,
    border: "none",
    background: "transparent",
    color: "#3FE8E0",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },
  frameNumber: {
    fontSize: 10,
    color: "rgba(245,239,224,0.5)",
  },
  frameDeleteButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "none",
    background: "#FF4D6D",
    color: "#15121C",
    fontSize: 12,
    lineHeight: "18px",
    padding: 0,
    cursor: "pointer",
  },
  frameAddWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flexShrink: 0,
  },
  frameAddButton: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px dashed rgba(245,239,224,0.4)",
    background: "transparent",
    color: "rgba(245,239,224,0.7)",
    fontSize: 11,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  playbackCard: {
    background: "#2A2438",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    border: "1px solid rgba(245,239,224,0.15)",
  },
  playbackImage: {
    width: "100%",
    borderRadius: 8,
    marginBottom: 14,
    background: "#F5EFE0",
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
