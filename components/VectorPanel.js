import { useRef, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const COLORS = [
  "#15121C",
  "#FF4D6D",
  "#3FE8E0",
  "#FFC857",
  "#7C5CFF",
  "#4E8B5C",
  "#FF9AA8",
  "#F5EFE0",
];

const NODE_RADIUS = 10;
const HANDLE_RADIUS = 9;
const CLOSE_THRESHOLD = 16;
const SEGMENT_HIT_THRESHOLD = 12;
const DOUBLE_TAP_MS = 350;

let idCounter = 1;
function nextId() {
  idCounter += 1;
  return idCounter;
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function cubicPoint(p0, c1, c2, p3, t) {
  const mt = 1 - t;
  const x =
    mt * mt * mt * p0.x +
    3 * mt * mt * t * c1.x +
    3 * mt * t * t * c2.x +
    t * t * t * p3.x;
  const y =
    mt * mt * mt * p0.y +
    3 * mt * mt * t * c1.y +
    3 * mt * t * t * c2.y +
    t * t * t * p3.y;
  return { x, y };
}

function makeNode(x, y) {
  return {
    id: nextId(),
    x,
    y,
    hx1: x,
    hy1: y,
    hx2: x,
    hy2: y,
    type: "corner",
  };
}

function makePath(node) {
  return {
    id: nextId(),
    nodes: [node],
    closed: false,
    color: COLORS[0],
    width: 4,
    opacity: 100,
  };
}

export default function VectorPanel() {
  const canvasRef = useRef(null);
  const dragging = useRef(null);
  const lastTap = useRef(null);
  const gesture = useRef(null);
  const multiTouchActive = useRef(false);

  const [paths, setPaths] = useState([]);
  const [activePathId, setActivePathId] = useState(null);
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showSaveBox, setShowSaveBox] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drawingName, setDrawingName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // ---------- canvas sizing ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const ratio = window.devicePixelRatio || 1;

    function resize() {
      const { width, height } = parent.getBoundingClientRect();
      if (width === 0 || height === 0) return; // tab not visible yet
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      render();
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- render whenever state changes ----------
  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, activePathId, selectedPathId, selectedNodeId, zoom, pan]);

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / ratio;
    const cssHeight = canvas.height / ratio;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#F5EFE0";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    ctx.restore();

    ctx.save();
    ctx.setTransform(ratio * zoom, 0, 0, ratio * zoom, ratio * pan.x, ratio * pan.y);

    paths.forEach((path) => drawPath(ctx, path));

    const activePath = paths.find((p) => p.id === activePathId);
    if (activePath && activePath.nodes.length >= 2 && !activePath.closed) {
      const first = activePath.nodes[0];
      ctx.beginPath();
      ctx.arc(first.x, first.y, NODE_RADIUS + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "#3FE8E0";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    paths.forEach((path) => {
      path.nodes.forEach((node) => {
        const isSelected = node.id === selectedNodeId;
        ctx.beginPath();
        ctx.arc(node.x, node.y, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#FF4D6D" : "#15121C";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#F5EFE0";
        ctx.stroke();
      });
    });

    if (selectedNodeId) {
      const path = paths.find((p) => p.id === selectedPathId);
      const node = path && path.nodes.find((n) => n.id === selectedNodeId);
      if (node) {
        ctx.strokeStyle = "rgba(124,92,255,0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(node.hx1, node.hy1);
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(node.hx2, node.hy2);
        ctx.stroke();

        [
          { x: node.hx1, y: node.hy1 },
          { x: node.hx2, y: node.hy2 },
        ].forEach((h) => {
          ctx.beginPath();
          ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#7C5CFF";
          ctx.fill();
        });
      }
    }

    ctx.restore();
  }

  function drawPath(ctx, path) {
    if (path.nodes.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(path.nodes[0].x, path.nodes[0].y);
    const count = path.nodes.length;
    const segEnd = path.closed ? count : count - 1;
    for (let i = 0; i < segEnd; i++) {
      const cur = path.nodes[i];
      const next = path.nodes[(i + 1) % count];
      ctx.bezierCurveTo(cur.hx2, cur.hy2, next.hx1, next.hy1, next.x, next.y);
    }
    if (path.closed) ctx.closePath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.width;
    ctx.globalAlpha = path.opacity / 100;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ---------- hit testing ----------
  const getPoint = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      return {
        x: (screenX - pan.x) / zoom,
        y: (screenY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  function screenToWorld(screenX, screenY) {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }

  function hitTestHandle(point) {
    if (!selectedNodeId) return null;
    const path = paths.find((p) => p.id === selectedPathId);
    const node = path && path.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    if (dist(point, { x: node.hx1, y: node.hy1 }) <= HANDLE_RADIUS) {
      return { type: "handleIn", pathId: path.id, nodeId: node.id };
    }
    if (dist(point, { x: node.hx2, y: node.hy2 }) <= HANDLE_RADIUS) {
      return { type: "handleOut", pathId: path.id, nodeId: node.id };
    }
    return null;
  }

  function hitTestNode(point) {
    for (const path of paths) {
      for (const node of path.nodes) {
        if (dist(point, node) <= NODE_RADIUS) {
          return { path, node };
        }
      }
    }
    return null;
  }

  function hitTestSegment(point) {
    for (const path of paths) {
      const count = path.nodes.length;
      const segEnd = path.closed ? count : count - 1;
      for (let i = 0; i < segEnd; i++) {
        const cur = path.nodes[i];
        const next = path.nodes[(i + 1) % count];
        for (let s = 1; s < 20; s++) {
          const t = s / 20;
          const sample = cubicPoint(
            cur,
            { x: cur.hx2, y: cur.hy2 },
            { x: next.hx1, y: next.hy1 },
            next,
            t
          );
          if (dist(point, sample) <= SEGMENT_HIT_THRESHOLD) {
            return { path, afterIndex: i, point: sample };
          }
        }
      }
    }
    return null;
  }

  // ---------- node type + smooth handle logic ----------
  function recalcSmoothHandles(nodes, index, closed) {
    const count = nodes.length;
    const node = nodes[index];
    const hasPrev = closed || index > 0;
    const hasNext = closed || index < count - 1;
    if (!hasPrev || !hasNext) {
      node.hx1 = node.x;
      node.hy1 = node.y;
      node.hx2 = node.x;
      node.hy2 = node.y;
      return;
    }
    const prev = nodes[(index - 1 + count) % count];
    const next = nodes[(index + 1) % count];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const inLen = dist(node, prev) / 3;
    const outLen = dist(node, next) / 3;
    node.hx1 = node.x - ux * inLen;
    node.hy1 = node.y - uy * inLen;
    node.hx2 = node.x + ux * outLen;
    node.hy2 = node.y + uy * outLen;
  }

  function toggleNodeType() {
    if (!selectedNodeId) return;
    setPaths((prev) =>
      prev.map((path) => {
        if (path.id !== selectedPathId) return path;
        const nodes = path.nodes.map((n) => ({ ...n }));
        const idx = nodes.findIndex((n) => n.id === selectedNodeId);
        if (idx === -1) return path;
        const node = nodes[idx];
        if (node.type === "corner") {
          node.type = "smooth";
          recalcSmoothHandles(nodes, idx, path.closed);
        } else {
          node.type = "corner";
          node.hx1 = node.x;
          node.hy1 = node.y;
          node.hx2 = node.x;
          node.hy2 = node.y;
        }
        return { ...path, nodes };
      })
    );
  }

  // ---------- pointer handlers ----------
  function onPointerDown(e) {
    e.preventDefault();

    if (e.touches && e.touches.length === 2) {
      multiTouchActive.current = true;
      dragging.current = null;
      const [t1, t2] = e.touches;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
      const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };
      const midScreen = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const startDist = dist(p1, p2);
      gesture.current = {
        startDist,
        startZoom: zoom,
        startPan: pan,
        worldMid: screenToWorld(midScreen.x, midScreen.y),
      };
      return;
    }

    if (multiTouchActive.current) {
      return;
    }

    const point = getPoint(e);

    const handleHit = hitTestHandle(point);
    if (handleHit) {
      dragging.current = handleHit;
      return;
    }

    const nodeHit = hitTestNode(point);
    if (nodeHit) {
      const now = Date.now();
      if (
        lastTap.current &&
        lastTap.current.nodeId === nodeHit.node.id &&
        now - lastTap.current.time < DOUBLE_TAP_MS
      ) {
        deleteNode(nodeHit.path.id, nodeHit.node.id);
        lastTap.current = null;
        return;
      }
      lastTap.current = { nodeId: nodeHit.node.id, time: now };
      setSelectedPathId(nodeHit.path.id);
      setSelectedNodeId(nodeHit.node.id);
      dragging.current = {
        type: "node",
        pathId: nodeHit.path.id,
        nodeId: nodeHit.node.id,
      };
      return;
    }

    const segHit = hitTestSegment(point);
    if (segHit) {
      insertNode(segHit.path.id, segHit.afterIndex, segHit.point);
      return;
    }

    const activePath = paths.find((p) => p.id === activePathId);
    if (activePath) {
      const first = activePath.nodes[0];
      if (activePath.nodes.length >= 2 && dist(point, first) <= CLOSE_THRESHOLD) {
        setPaths((prev) =>
          prev.map((p) => (p.id === activePath.id ? { ...p, closed: true } : p))
        );
        setActivePathId(null);
        setSelectedNodeId(null);
        setSelectedPathId(null);
        return;
      }
      const newNode = makeNode(point.x, point.y);
      setPaths((prev) =>
        prev.map((p) =>
          p.id === activePath.id ? { ...p, nodes: [...p.nodes, newNode] } : p
        )
      );
      setSelectedPathId(activePath.id);
      setSelectedNodeId(newNode.id);
      return;
    }

    const node = makeNode(point.x, point.y);
    const path = makePath(node);
    setPaths((prev) => [...prev, path]);
    setActivePathId(path.id);
    setSelectedPathId(path.id);
    setSelectedNodeId(node.id);
  }

  function onPointerMove(e) {
    if (e.touches && e.touches.length === 2 && gesture.current) {
      e.preventDefault();
      const [t1, t2] = e.touches;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
      const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };
      const midScreen = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const newDist = dist(p1, p2);
      const { startDist, startZoom, worldMid } = gesture.current;

      let newZoom = startZoom * (newDist / startDist);
      newZoom = Math.min(5, Math.max(0.3, newZoom));

      const newPan = {
        x: midScreen.x - worldMid.x * newZoom,
        y: midScreen.y - worldMid.y * newZoom,
      };

      setZoom(newZoom);
      setPan(newPan);
      return;
    }

    if (multiTouchActive.current) return;
    if (!dragging.current) return;
    e.preventDefault();
    const point = getPoint(e);
    const { type, pathId, nodeId } = dragging.current;

    setPaths((prev) =>
      prev.map((path) => {
        if (path.id !== pathId) return path;
        const nodes = path.nodes.map((n) => ({ ...n }));
        const idx = nodes.findIndex((n) => n.id === nodeId);
        if (idx === -1) return path;
        const node = nodes[idx];

        if (type === "node") {
          const dx = point.x - node.x;
          const dy = point.y - node.y;
          node.x = point.x;
          node.y = point.y;
          node.hx1 += dx;
          node.hy1 += dy;
          node.hx2 += dx;
          node.hy2 += dy;
        } else if (type === "handleOut") {
          node.hx2 = point.x;
          node.hy2 = point.y;
          if (node.type === "smooth") {
            const angle = Math.atan2(point.y - node.y, point.x - node.x);
            const inLen = dist(node, { x: node.hx1, y: node.hy1 });
            node.hx1 = node.x + Math.cos(angle + Math.PI) * inLen;
            node.hy1 = node.y + Math.sin(angle + Math.PI) * inLen;
          }
        } else if (type === "handleIn") {
          node.hx1 = point.x;
          node.hy1 = point.y;
          if (node.type === "smooth") {
            const angle = Math.atan2(point.y - node.y, point.x - node.x);
            const outLen = dist(node, { x: node.hx2, y: node.hy2 });
            node.hx2 = node.x + Math.cos(angle + Math.PI) * outLen;
            node.hy2 = node.y + Math.sin(angle + Math.PI) * outLen;
          }
        }

        return { ...path, nodes };
      })
    );
  }

  function onPointerUp(e) {
    const remaining = e && e.touches ? e.touches.length : 0;
    if (remaining === 0) {
      multiTouchActive.current = false;
      gesture.current = null;
    }
    dragging.current = null;
  }

  // ---------- node / path operations ----------
  function insertNode(pathId, afterIndex, point) {
    const newNode = makeNode(point.x, point.y);
    setPaths((prev) =>
      prev.map((path) => {
        if (path.id !== pathId) return path;
        const nodes = [...path.nodes];
        nodes.splice(afterIndex + 1, 0, newNode);
        return { ...path, nodes };
      })
    );
    setSelectedPathId(pathId);
    setSelectedNodeId(newNode.id);
  }

  function deleteNode(pathId, nodeId) {
    setPaths((prev) =>
      prev
        .map((path) => {
          if (path.id !== pathId) return path;
          const nodes = path.nodes.filter((n) => n.id !== nodeId);
          return { ...path, nodes };
        })
        .filter((path) => path.nodes.length > 0)
    );
    setSelectedNodeId(null);
    setSelectedPathId(null);
    if (activePathId === pathId) {
      setActivePathId(null);
    }
  }

  function deleteSelectedNode() {
    if (!selectedNodeId || !selectedPathId) return;
    deleteNode(selectedPathId, selectedNodeId);
  }

  function finishPath() {
    setActivePathId(null);
    setSelectedNodeId(null);
    setSelectedPathId(null);
  }

  function newPath() {
    finishPath();
  }

  function clearAll() {
    setPaths([]);
    setActivePathId(null);
    setSelectedPathId(null);
    setSelectedNodeId(null);
  }

  // ---------- zoom controls ----------
  function zoomBy(factor, anchorScreen) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const anchor = anchorScreen || {
      x: rect.width / 2,
      y: rect.height / 2,
    };
    const worldAnchor = screenToWorld(anchor.x, anchor.y);
    let newZoom = zoom * factor;
    newZoom = Math.min(5, Math.max(0.3, newZoom));
    const newPan = {
      x: anchor.x - worldAnchor.x * newZoom,
      y: anchor.y - worldAnchor.y * newZoom,
    };
    setZoom(newZoom);
    setPan(newPan);
  }

  function resetZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function onWheel(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomBy(factor, anchor);
  }

  // ---------- live styling ----------
  function targetPathId() {
    return selectedPathId || activePathId;
  }

  function applyStyle(patch) {
    const id = targetPathId();
    if (!id) return;
    setPaths((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  const targetPath = paths.find((p) => p.id === targetPathId());
  const selectedNode =
    selectedNodeId &&
    paths
      .find((p) => p.id === selectedPathId)
      ?.nodes.find((n) => n.id === selectedNodeId);

  // ---------- save to library ----------
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

  return (
    <div style={styles.wrap}>
      <p style={styles.hint}>
        Tap empty space to drop a node. Tap the first node again to close a
        shape. Drag any node to move it, drag the purple dots to bend a
        curve. Double-tap a node to delete it. Tap a line to insert a node
        on it. Pinch with two fingers to zoom, drag with two fingers to
        pan — one finger always edits nodes.
      </p>

      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
          onWheel={onWheel}
        />
        <div style={styles.zoomControls}>
          <button onClick={() => zoomBy(1.2)} style={styles.zoomButton}>
            +
          </button>
          <span style={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => zoomBy(1 / 1.2)} style={styles.zoomButton}>
            −
          </button>
          <button onClick={resetZoom} style={styles.zoomResetButton}>
            Reset
          </button>
        </div>
      </div>

      <div style={styles.controlBar}>
        <div style={styles.swatchRow}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => applyStyle({ color: c })}
              disabled={!targetPathId()}
              aria-label={c}
              style={{
                ...styles.swatch,
                background: c,
                opacity: targetPathId() ? 1 : 0.3,
                outline:
                  targetPath && targetPath.color === c
                    ? "3px solid #FF4D6D"
                    : "2px solid rgba(245,239,224,0.25)",
              }}
            />
          ))}
        </div>

        <div style={styles.sizeRow}>
          <span style={styles.sizeLabel}>Width</span>
          <input
            type="range"
            min="1"
            max="24"
            value={targetPath ? targetPath.width : 4}
            disabled={!targetPathId()}
            onChange={(e) => applyStyle({ width: Number(e.target.value) })}
            style={styles.slider}
          />
        </div>

        <div style={styles.sizeRow}>
          <span style={styles.sizeLabel}>Opacity</span>
          <input
            type="range"
            min="10"
            max="100"
            value={targetPath ? targetPath.opacity : 100}
            disabled={!targetPathId()}
            onChange={(e) => applyStyle({ opacity: Number(e.target.value) })}
            style={styles.slider}
          />
        </div>

        {selectedNode && (
          <div style={styles.toggleRow}>
            <button
              onClick={toggleNodeType}
              style={{ ...styles.toggleChip, ...styles.toggleChipActive }}
            >
              {selectedNode.type === "corner" ? "Corner" : "Smooth"} — tap
              to switch
            </button>
            <button onClick={deleteSelectedNode} style={styles.dangerChip}>
              Delete node
            </button>
          </div>
        )}
      </div>

      <div style={styles.dock}>
        <button onClick={finishPath} style={styles.toolButton}>
          Finish path
        </button>
        <button onClick={newPath} style={styles.toolButton}>
          New path
        </button>
        <button
          onClick={() => setShowSaveBox(true)}
          style={{ ...styles.toolButton, ...styles.toolButtonActiveCyan }}
        >
          Save to Library
        </button>
        <button onClick={clearAll} style={styles.clearButton}>
          Clear all
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
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    minHeight: "70vh",
  },
  hint: {
    fontSize: 12,
    color: "rgba(245,239,224,0.55)",
    padding: "0 16px 10px",
    lineHeight: 1.4,
  },
  canvasWrap: {
    position: "relative",
    flex: 1,
    margin: "0 16px 16px",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(245,239,224,0.15)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
    minHeight: 320,
  },
  zoomControls: {
    position: "absolute",
    bottom: 12,
    right: 12,
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(21,18,28,0.85)",
    borderRadius: 10,
    padding: "6px 8px",
    border: "1px solid rgba(245,239,224,0.15)",
  },
  zoomButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "none",
    background: "#2A2438",
    color: "#F5EFE0",
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
  },
  zoomLabel: {
    fontSize: 12,
    color: "#F5EFE0",
    width: 42,
    textAlign: "center",
  },
  zoomResetButton: {
    padding: "0 8px",
    height: 30,
    borderRadius: 8,
    border: "none",
    background: "#3FE8E0",
    color: "#15121C",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "100%",
    touchAction: "none",
  },
  controlBar: {
    padding: "0 16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  swatchRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 30,
    height: 30,
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
    width: 54,
  },
  slider: {
    flex: 1,
    accentColor: "#7C5CFF",
  },
  toggleRow: {
    display: "flex",
    gap: 10,
  },
  toggleChip: {
    flex: 1,
    padding: "10px 6px",
    borderRadius: 8,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "transparent",
    color: "rgba(245,239,224,0.7)",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  },
  toggleChipActive: {
    background: "#7C5CFF",
    borderColor: "#7C5CFF",
    color: "#F5EFE0",
  },
  dangerChip: {
    flex: 1,
    padding: "10px 6px",
    borderRadius: 8,
    border: "none",
    background: "#FF4D6D",
    color: "#15121C",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
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
    border: "1px solid rgba(255,77,109,0.4)",
    background: "transparent",
    color: "#FF4D6D",
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
