import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { supabase } from "../lib/supabaseClient";

export default function Library() {
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
        .select("id, name, image_data, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDrawings(data || []);
    } catch (err) {
      setError(err.message || "Couldn't load your library.");
    } finally {
      setLoading(false);
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
          <Link href="/studio" style={styles.backLink}>
            ← Studio
          </Link>
          <h1 style={styles.title}>Library</h1>
          <div style={{ width: 60 }} />
        </header>

        <input
          type="text"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.search}
        />

        {loading && <p style={styles.status}>Loading...</p>}
        {error && <p style={styles.errorText}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p style={styles.status}>
            {drawings.length === 0
              ? "Nothing saved yet — go draw something in the Studio."
              : "No drawings match that search."}
          </p>
        )}

        <div style={styles.grid}>
          {filtered.map((d) => (
            <button key={d.id} onClick={() => setSelected(d)} style={styles.thumbButton}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image_data} alt={d.name} style={styles.thumb} />
              <span style={styles.thumbName}>{d.name}</span>
            </button>
          ))}
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
                  onClick={() => deleteDrawing(selected.id)}
                  style={styles.overlayDelete}
                >
                  Delete
                </button>
              </div>
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
    background: "#15121C",
    color: "#F5EFE0",
    padding: "16px 16px 40px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backLink: {
    fontSize: 13,
    color: "#3FE8E0",
    textDecoration: "none",
    fontWeight: 500,
    width: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  search: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "#2A2438",
    color: "#F5EFE0",
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
    marginBottom: 20,
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
    gap: 10,
    marginTop: 14,
  },
  overlayClose: {
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
  overlayDelete: {
    flex: 1,
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
