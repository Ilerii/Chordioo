from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import librosa
import numpy as np
import tempfile
import uvicorn

app = FastAPI(title="Chord Recognizer")

# Chord templates for major chords (C, D, E, F, G, A, B)
CHORD_TEMPLATES = {
    'C': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'C#': [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'D': [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'D#': [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    'E': [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    'F': [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    'F#': [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    'G': [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    'G#': [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    'A': [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    'A#': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    'B': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
}

def detect_chord(chroma_vector):
    """Compare chroma vector to templates and return best matching chord."""
    best_chord = None
    max_corr = -1
    for chord, template in CHORD_TEMPLATES.items():
        corr = np.dot(chroma_vector, template)
        if corr > max_corr:
            max_corr = corr
            best_chord = chord
    return best_chord

@app.post("/detect-chords")
async def detect_chords(file: UploadFile = File(...)):
    print('starting ...')
    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        contents = await file.read()
        tmp.write(contents)
        audio_path = tmp.name

    # Load audio
    y, sr = librosa.load(audio_path, sr=22050)
    
    # Parameters
    hop_length = 512  # ~23 ms per frame
    window_length = 2048  # ~93 ms

    # Compute chroma
    chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=hop_length, n_fft=window_length)

    # Detect chords per frame
    chords = []
    times = librosa.frames_to_time(np.arange(chroma.shape[1]), sr=sr, hop_length=hop_length)
    for i, frame in enumerate(chroma.T):
        chord = detect_chord(frame)
        chords.append({"time": float(times[i]), "chord": chord})
    print('chords', chords)
    return JSONResponse(content={"chords": chords})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
