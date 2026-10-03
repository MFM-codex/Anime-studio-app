import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LibraryPanel({ onEditInStudio }) {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchDrawings();
  }, []);

  async function fetchDrawings() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("drawings")
        .select("id, name, image_data, frames, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDrawings(data || []);
    } catch (err) {
      setError(err.message || "Couldn't load your library.");
    } finally {
      setLoading(false);
    }
  }

  function handleEditInStudio(drawing) {
    setSelected(null);
    if (onEditInStudio) {
      let parsedFrames = null;
      if (drawing.frames) {
        try {
          parsedFrames = JSON.parse(drawing.frames);
        } catch (err) {
          parsedFrames = null;
        }
      }
      onEditInStudio({
        name: drawing.name,
        image_data: drawing.image_data,
        frames: parsedFrames,
      });
    }
  }

  async function deleteDrawing(id) {
    try {
      const { error } = await supabase.from("drawings").delete().eq("id", id);
      if (error) throw error;
      setDrawings((d) => d.filter((item) => item.id !== id));
      setSelected(null);
    } catch (err) {
      setError(err.message || "Couldn't delete that drawing.");
    }
  }

  const filtered = drawings.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.search}
        />
        <button onClick={fetchDrawings} style={styles.refreshButton} aria-label="Refresh">
          ⟳
        </button>
      </div>

      {loading && <p style={styles.status}>Loading...</p>}
      {error && <p style={styles.errorText}>{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p style={styles.status}>
          {drawings.length === 0
            ? "Nothing saved yet — go draw something in the Studio or Vector tab."
            : "No drawings match that search."}
        </p>
      )}

      <div style={styles.grid}>
        {filtered.map((d) => {
          let count = 1;
          if (d.frames) {
            try {
              const parsed = JSON.parse(d.frames);
              if (Array.isArray(parsed)) count = parsed.length;
            } catch (err) {
              count = 1;
            }
          }
          return (
            <button key={d.id} onClick={() => setSelected(d)} style={styles.thumbButton}>
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image_data} alt={d.name} style={styles.thumb} />
                {count > 1 && <span style={styles.frameBadge}>{count} frames</span>}
              </div>
              <span style={styles.thumbName}>{d.name}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.overlayCard} onClick={(e) => e.stopPropagation()}>
            <p style={styles.overlayTitle}>{selected.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image_data} alt={selected.name} style={styles.overlayImage} />
            <div style={styles.overlayButtons}>
              <button onClick={() => setSelected(null)} style={styles.overlayClose}>
                Close
              </button>
              <button
                onClick={() => handleEditInStudio(selected)}
                style={styles.overlayEdit}
              >
                Edit in Studio
              </button>
              <button
                onClick={() => deleteDrawing(selected.id)}
                style={styles.overlayDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    padding: "0 16px 24px",
  },
  searchRow: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  search: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "#2A2438",
    color: "#F5EFE0",
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
  },
  refreshButton: {
    width: 44,
    borderRadius: 10,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "#2A2438",
    color: "#F5EFE0",
    fontSize: 18,
    cursor: "pointer",
  },
  status: {
    color: "rgba(245,239,224,0.5)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  errorText: {
    color: "#FF9AA8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  thumbButton: {
    background: "#2A2438",
    border: "1px solid rgba(245,239,224,0.15)",
    borderRadius: 12,
    padding: 8,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  thumb: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: 8,
  },
  frameBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    background: "rgba(21,18,28,0.85)",
    color: "#3FE8E0",
    fontSize: 9,
    fontWeight: 600,
    padding: "2px 5px",
    borderRadius: 6,
  },
  thumbName: {
    fontSize: 12,
    color: "#F5EFE0",
    fontWeight: 500,
    textAlign: "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(21,18,28,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 50,
  },
  overlayCard: {
    background: "#2A2438",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    maxWidth: 380,
    border: "1px solid rgba(245,239,224,0.15)",
  },
  overlayTitle: {
    fontWeight: 700,
    fontSize: 16,
    margin: "0 0 12px",
  },
  overlayImage: {
    width: "100%",
    borderRadius: 8,
  },
  overlayButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  overlayClose: {
    flex: "1 1 40%",
    padding: "10px 0",
    borderRadius: 8,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "transparent",
    color: "#F5EFE0",
    fontFamily: "inherit",
    fontSize: 14,
    cursor: "pointer",
  },
  overlayEdit: {
    flex: "1 1 40%",
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
  overlayDelete: {
    flex: "1 1 100%",
    padding: "10px 0",
    borderRadius: 8,
    border: "none",
    background: "#FF4D6D",
    color: "#15121C",
    fontFamily: "inherit",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
};
