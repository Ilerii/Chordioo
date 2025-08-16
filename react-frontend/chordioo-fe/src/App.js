import React, { useState } from "react";
import axios from "axios";

const PIANO_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function App() {
  const [file, setFile] = useState(null);
  const [chords, setChords] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setChords([]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:8000/detect-chords",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setChords(response.data.chords);
    } catch (error) {
      console.error(error);
      alert("Error detecting chords. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getChordKeys = (chord) => {
    // For simplicity, assume major chord (root + major third + fifth)
    const ROOT_INDEX = PIANO_KEYS.indexOf(chord);
    if (ROOT_INDEX === -1) return [];
    const THIRD_INDEX = (ROOT_INDEX + 4) % 12; // major third
    const FIFTH_INDEX = (ROOT_INDEX + 7) % 12; // perfect fifth
    return [ROOT_INDEX, THIRD_INDEX, FIFTH_INDEX];
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🎵 Chord Recognizer with Piano Roll</h1>

      <input type="file" accept=".wav,.mp3" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading} style={{ marginLeft: "1rem" }}>
        {loading ? "Detecting..." : "Detect Chords"}
      </button>

      {chords.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Piano Roll</h2>
          <div style={{ display: "flex", flexDirection: "column-reverse" }}>
            {PIANO_KEYS.map((keyName, keyIndex) => (
              <div
                key={keyName}
                style={{ display: "flex", height: "20px", marginBottom: "2px" }}
              >
                {chords.map((c, i) => {
                  const activeKeys = getChordKeys(c.chord);
                  const isActive = activeKeys.includes(keyIndex);
                  return (
                    <div
                      key={i}
                      style={{
                        width: "10px",
                        height: "100%",
                        backgroundColor: isActive ? "orange" : "#eee",
                        border: "1px solid #ccc",
                      }}
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: "1rem" }}>Legend:</h3>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ width: "20px", height: "20px", backgroundColor: "orange" }}></div>
            <span>Active Chord Note</span>
            <div style={{ width: "20px", height: "20px", backgroundColor: "#eee", border: "1px solid #ccc" }}></div>
            <span>Inactive</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
