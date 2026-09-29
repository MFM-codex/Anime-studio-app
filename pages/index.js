import { useState } from "react";
import Head from "next/head";
import AnalyzerPanel from "../components/AnalyzerPanel";
import StudioPanel from "../components/StudioPanel";
import VectorPanel from "../components/VectorPanel";
import LibraryPanel from "../components/LibraryPanel";

const TABS = [
  { id: "analyze", label: "Analyze" },
  { id: "draw", label: "Draw" },
  { id: "vector", label: "Vector" },
  { id: "library", label: "Library" },
];

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [studioLoadRequest, setStudioLoadRequest] = useState(null);

  function handleEditInStudio(drawing) {
    // A new object reference each time, so StudioPanel's effect fires
    // even if the same drawing is sent over twice in a row.
    setStudioLoadRequest({ ...drawing, _token: Date.now() });
    setActiveTab("draw");
  }

  return (
    <>
      <Head>
        <title>Anime Studio</title>
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
          color: #f5efe0;
        }
      `}</style>

      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>Anime Studio</h1>
        </header>

        <nav style={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.id ? styles.tabButtonActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* All four panels stay mounted at all times — only visibility
            toggles. This means switching tabs never loses in-progress
            work: a half-finished drawing, an open vector path, or an
            analysis result all stay exactly as you left them. */}
        <div style={{ display: activeTab === "analyze" ? "block" : "none" }}>
          <AnalyzerPanel />
        </div>
        <div style={{ display: activeTab === "draw" ? "block" : "none" }}>
          <StudioPanel
            loadRequest={studioLoadRequest}
            onLoadConsumed={() => setStudioLoadRequest(null)}
          />
        </div>
        <div style={{ display: activeTab === "vector" ? "block" : "none" }}>
          <VectorPanel />
        </div>
        <div style={{ display: activeTab === "library" ? "block" : "none" }}>
          <LibraryPanel onEditInStudio={handleEditInStudio} />
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "16px 16px 4px",
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.02em",
    margin: 0,
  },
  tabBar: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#15121C",
  },
  tabButton: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 10,
    border: "1px solid rgba(245,239,224,0.2)",
    background: "#2A2438",
    color: "rgba(245,239,224,0.7)",
    fontFamily: "inherit",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
  },
  tabButtonActive: {
    background: "#FF4D6D",
    borderColor: "#FF4D6D",
    color: "#15121C",
  },
};
