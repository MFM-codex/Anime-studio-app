import { useState } from "react";

export default function AnalyzerPanel() {
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result;
      const [header, data] = dataUri.split(",");
      const typeMatch = header.match(/data:(.*);base64/);

      setPreview(dataUri);
      setBase64(data);
      setMediaType(typeMatch ? typeMatch[1] : "image/jpeg");
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!base64) {
      setError("Upload an image first.");
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setAnalysis(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <p style={styles.p}>
        Upload an image and get a breakdown of the technique — linework, color palette, shading,
        composition — plus steps to recreate it yourself.
      </p>

      <div style={styles.card}>
        <label style={styles.label}>Upload an image</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />

        {preview && (
          <div style={styles.previewWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Uploaded" style={styles.image} />
          </div>
        )}

        <button onClick={handleAnalyze} disabled={loading} style={styles.button}>
          {loading ? "Analyzing..." : "Analyze technique"}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {analysis && (
        <div style={styles.chatBubble}>
          <p style={styles.small}>Analysis:</p>
          <div style={styles.analysisText}>
            {analysis.split("\n").map((line, i) => (
              <p key={i} style={{ margin: "4px 0" }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    padding: "0 16px 24px",
    color: "#F5EFE0",
  },
  p: { color: "rgba(245,239,224,0.6)", marginBottom: 20, fontSize: 14 },
  card: {
    border: "1px solid rgba(245,239,224,0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    background: "#2A2438",
  },
  label: { display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14 },
  small: { fontSize: 13, color: "rgba(245,239,224,0.6)", marginBottom: 8, fontWeight: 600 },
  button: {
    marginTop: 16,
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#FF4D6D",
    color: "#15121C",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  previewWrap: { marginTop: 12 },
  image: {
    width: "100%",
    borderRadius: 8,
    marginTop: 6,
  },
  error: { color: "#FF9AA8", marginTop: 12, fontSize: 14 },
  chatBubble: {
    background: "#2A2438",
    border: "1px solid rgba(245,239,224,0.15)",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    lineHeight: 1.5,
  },
  analysisText: {
    whiteSpace: "pre-wrap",
  },
};
