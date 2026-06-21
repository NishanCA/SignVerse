from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
from deep_translator import GoogleTranslator
import time
import os
import shutil
import csv
import numpy as np
from spellchecker import SpellChecker
import requests
import io
import edge_tts
from phrases import COMMON_PHRASES, get_starters

# 1. app = FastAPI() must be created immediately after imports.
app = FastAPI(title="SignVerse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[INFO] FastAPI server starting...")

spell = SpellChecker()

# ──────────────────────────────────────────────────────────────────────────────
# Base paths
# ──────────────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "..", "hand-gesture-recognition-mediapipe-main", "model")

KEYPOINT_MODEL_PATH = os.path.join(MODEL_DIR, "keypoint_classifier", "keypoint_classifier.tflite")
KEYPOINT_LABEL_PATH = os.path.join(MODEL_DIR, "keypoint_classifier", "keypoint_classifier_label.csv")

NUMBER_MODEL_PATH   = os.path.join(MODEL_DIR, "number_classifier", "number_classifier.tflite")
NUMBER_LABEL_PATH   = os.path.join(MODEL_DIR, "number_classifier", "number_classifier_label.csv")


# ──────────────────────────────────────────────────────────────────────────────
# Lazy Loading Helpers
# ──────────────────────────────────────────────────────────────────────────────
def load_labels(path: str) -> list[str]:
    try:
        with open(path, encoding="utf-8-sig") as f:
            return [row[0].strip() for row in csv.reader(f) if row]
    except Exception as e:
        print(f"[WARN] Could not load labels from {path}: {e}")
        return []

keypoint_labels = []
number_labels = []
kp_interp, kp_in, kp_out = None, None, None
nb_interp, nb_in, nb_out = None, None, None
_tflite_loaded = False

def get_tflite_models():
    global _tflite_loaded, kp_interp, kp_in, kp_out, nb_interp, nb_in, nb_out
    global keypoint_labels, number_labels
    if not _tflite_loaded:
        print("[INFO] Initializing TFLite models...")
        import tensorflow as tf
        
        keypoint_labels = load_labels(KEYPOINT_LABEL_PATH)
        number_labels   = load_labels(NUMBER_LABEL_PATH)
        
        def load_tflite_internal(path: str):
            try:
                interp = tf.lite.Interpreter(model_path=os.path.abspath(path), num_threads=2)
                interp.allocate_tensors()
                in_idx  = interp.get_input_details()[0]["index"]
                out_idx = interp.get_output_details()[0]["index"]
                return interp, in_idx, out_idx
            except Exception as e:
                print(f"[ERROR] Could not load TFLite model {path}: {e}")
                return None, None, None
                
        kp_interp, kp_in, kp_out = load_tflite_internal(KEYPOINT_MODEL_PATH)
        nb_interp, nb_in, nb_out = load_tflite_internal(NUMBER_MODEL_PATH)
        _tflite_loaded = True


_whisper_model = None
def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("[INFO] Loading Whisper model...")
        from faster_whisper import WhisperModel
        _whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
        print("[OK] Whisper model loaded.")
    return _whisper_model


_autocomplete_model = None
_autocomplete_loaded = False
def get_autocomplete_model():
    global _autocomplete_model, _autocomplete_loaded
    if not _autocomplete_loaded:
        print("[INFO] Loading Autocomplete model (distilgpt2)...")
        from transformers import pipeline
        try:
            _autocomplete_model = pipeline("text-generation", model="distilgpt2", device=-1)
            print("[OK] Autocomplete model loaded.")
        except Exception as e:
            print(f"[ERROR] Could not load autocomplete model: {e}")
            _autocomplete_model = None
        _autocomplete_loaded = True
    return _autocomplete_model


_wordsegment_loaded = False
def initialize_wordsegment():
    global _wordsegment_loaded
    if not _wordsegment_loaded:
        import wordsegment
        wordsegment.load()
        _wordsegment_loaded = True


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic models
# ──────────────────────────────────────────────────────────────────────────────
class TranslationRequest(BaseModel):
    text: str
    target_language: str

class AutocompleteRequest(BaseModel):
    words: list[str]

class CheckWordRequest(BaseModel):
    word: str

class SegmentRequest(BaseModel):
    text: str

class ClassifyRequest(BaseModel):
    landmarks: list[float]   # 42 pre-processed floats
    hand_side: str           # "Right" (letters) or "Left" (numbers)

class AslGlossRequest(BaseModel):
    text: str


# ──────────────────────────────────────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────────────────────────────────────
def run_tflite(interp, in_idx, out_idx, landmark_arr: np.ndarray) -> tuple[int, float]:
    """Run inference and return (result_index, confidence)."""
    interp.set_tensor(in_idx, landmark_arr)
    interp.invoke()
    result = interp.get_tensor(out_idx)
    squeezed = np.squeeze(result)
    idx = int(np.argmax(squeezed))
    conf = float(squeezed[idx])
    return idx, conf


# ──────────────────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "SignVerse API running"}

@app.get("/health")
async def health():
    return {"status": "ok"}



@app.post("/api/classify")
def classify_gesture(req: ClassifyRequest):
    """
    Classify hand gesture.
    - hand_side == "Right"  →  keypoint classifier  →  letters / Delete
    - hand_side == "Left"   →  number classifier     →  0-9
    Matches exactly what app.py does (image is flipped before MediaPipe,
    so Right = physical right hand).
    """
    if len(req.landmarks) != 42:
        raise HTTPException(status_code=400, detail=f"Expected 42 values, got {len(req.landmarks)}")

    get_tflite_models()

    arr = np.array([req.landmarks], dtype=np.float32)

    if req.hand_side == "Right":
        if kp_interp is None:
            raise HTTPException(status_code=503, detail="Keypoint classifier not loaded")
        idx, conf = run_tflite(kp_interp, kp_in, kp_out, arr)
        label = keypoint_labels[idx] if idx < len(keypoint_labels) else "?"
    else:  # Left
        if nb_interp is None:
            raise HTTPException(status_code=503, detail="Number classifier not loaded")
        idx, conf = run_tflite(nb_interp, nb_in, nb_out, arr)
        label = number_labels[idx] if idx < len(number_labels) else "?"

    return {"label": label, "index": idx, "confidence": conf, "hand_side": req.hand_side}


@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    temp_path = f"temp_{int(time.time())}_{file.filename}"
    try:
        with open(temp_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
        model = get_whisper_model()
        segments, info = model.transcribe(
            temp_path, vad_filter=True, beam_size=1, best_of=1, temperature=0.0
        )
        text = " ".join(seg.text for seg in segments).strip()
        return {"text": text, "language": info.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/api/translate")
def translate_text(req: TranslationRequest):
    try:
        if req.target_language == "en":
            return {"translated_text": req.text}
        translated = GoogleTranslator(source="en", target=req.target_language).translate(req.text)
        return {"translated_text": translated}
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/to_asl_gloss")
def text_to_asl_gloss(req: AslGlossRequest):
    import re
    try:
        english_text = GoogleTranslator(source="auto", target="en").translate(req.text)
    except Exception:
        english_text = req.text
        
    text_clean = re.sub(r'[^\w\s]', '', english_text).upper()
    words = text_clean.split()
    
    time_words = {"TOMORROW", "YESTERDAY", "TODAY", "NOW", "LATER", "MORNING", "AFTERNOON", "NIGHT"}
    stop_words = {"AM", "IS", "ARE", "WAS", "WERE", "BE", "BEING", "BEEN", 
                  "A", "AN", "THE", "TO", "DO", "DOES", "DID", "OF", "IN", "ON", "AT", 
                  "BY", "FOR", "WITH", "ABOUT", "AS", "INTO", "THROUGH"}
    lemmas = {
        "GOING": "GO",
        "WENT": "GO",
        "NEEDS": "NEED",
        "NEEDED": "NEED",
        "HELPING": "HELP",
        "HELPED": "HELP"
    }
    
    result_words = []
    times = []
    
    for w in words:
        if w in time_words:
            times.append(w)
        elif w not in stop_words:
            result_words.append(lemmas.get(w, w))
            
    gloss = " ".join(times + result_words)
    
    if text_clean == "HELLO HOW ARE YOU":
        gloss = "HELLO HOW YOU"
    elif "CAN YOU HELP ME" in text_clean:
        gloss = "YOU HELP ME"
        
    return {"original": req.text, "english": english_text, "asl_gloss": gloss.strip()}


@app.post("/api/autocomplete")
def autocomplete_sentence(req: AutocompleteRequest):
    prefix = " ".join(req.words).strip()
    
    # 1. Empty Prefix -> Suggest starters
    if not prefix:
        return {"sentence": "", "suggestions": get_starters(5)}
        
    prefix_lower = prefix.lower()
    
    # 2. Dictionary Search
    # Find phrases that contain the prefix (substring match)
    matches = [p for p in COMMON_PHRASES if prefix_lower in p.lower()]
    
    if matches:
        # Prioritize exact prefix matches over substring matches
        prefix_matches = [p for p in matches if p.lower().startswith(prefix_lower)]
        other_matches = [p for p in matches if not p.lower().startswith(prefix_lower)]
        
        # Sort by length (shortest match first)
        prefix_matches.sort(key=len)
        other_matches.sort(key=len)
        
        combined = prefix_matches + other_matches
        # Return the full sentence as the suggestion
        return {"sentence": prefix, "suggestions": combined[:5]}
    
    # 3. GPT-2 Fallback
    model = get_autocomplete_model()
    if model is None:
        return {"sentence": prefix, "suggestions": []}
        
    try:
        results = model(
            prefix, 
            max_new_tokens=4, 
            num_return_sequences=2, 
            do_sample=True,
            temperature=0.7,
            pad_token_id=model.tokenizer.eos_token_id
        )
        suggestions = []
        for r in results:
            text = r["generated_text"]
            if text.startswith(prefix) and text != prefix:
                clean_suggestion = text.strip()
                if clean_suggestion not in suggestions:
                    suggestions.append(clean_suggestion)
        return {"sentence": prefix, "suggestions": suggestions[:2]}
    except Exception as e:
        print(f"[WARN] Autocomplete failed: {e}")
        return {"sentence": prefix, "suggestions": []}


@app.post("/api/check_word")
def check_word(req: CheckWordRequest):
    word = req.word.strip().lower()
    if not word:
        return {"valid": False}
    # Check if spellchecker recognizes it
    # known() returns a set of known words from the input iterable
    is_valid = len(spell.known([word])) > 0
    return {"valid": is_valid, "word": word}

@app.post("/api/segment")
def segment_text(req: SegmentRequest):
    import re
    initialize_wordsegment()
    import wordsegment

    # 1. Strip spaces and lowercase (wordsegment is trained on lowercase)
    raw = req.text.replace(" ", "").lower()
    if not raw:
        return {"segmented": ""}

    # 2. Bigram-aware word segmentation
    words = wordsegment.segment(raw)

    # 3. Drop orphaned single characters that aren't real standalone English words.
    #    When "NICEE" is signed, wordsegment → ["nice", "e"].
    #    "e" makes no sense alone, so drop it.  Only "a" and "i" are valid standalone.
    VALID_SINGLES = {"a", "i"}
    words = [w for w in words if len(w) > 1 or w in VALID_SINGLES]
    if not words:
        return {"segmented": ""}

    sentence = " ".join(words)

    # 4. Capitalize only the very first character
    sentence = sentence[0].upper() + sentence[1:]

    # 5. Call LanguageTool for corrections
    url = "https://api.languagetool.org/v2/check"
    try:
        response = requests.post(
            url,
            data={"text": sentence, "language": "en-US"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            matches = data.get("matches", [])
            matches = sorted(matches, key=lambda m: m.get("offset", 0), reverse=True)
            chars = list(sentence)

            for match in matches:
                offset = match.get("offset")
                length = match.get("length")
                replacements = match.get("replacements", [])
                if not replacements or offset is None or length is None:
                    continue

                rule_category = match.get("rule", {}).get("category", {}).get("id", "")
                rule_id       = match.get("rule", {}).get("id", "")
                rep           = replacements[0].get("value", "")

                # ── Spelling corrections: allow ONLY for repeated-letter typos ──────
                # This catches "nicee" → "nice", "reallly" → "really",
                # but SKIPS proper nouns like "nishan" (no consecutive repeated letters).
                SPELLING_CATS = {"TYPOS", "POSSIBLE_TYPO", "SPELLING"}
                if rule_category in SPELLING_CATS:
                    fragment = sentence[offset:offset + length]
                    has_consecutive_repeat = bool(re.search(r'(.)\1', fragment))
                    if not has_consecutive_repeat:
                        continue   # skip — looks like a proper noun, not a typo

                # ── Skip mid-sentence CASING suggestions ────────────────────────────
                if rule_category == "CASING" and offset > 0:
                    continue
                if rule_id == "UPPERCASE_SENTENCE_START" and offset > 0:
                    continue

                chars[offset:offset + length] = list(rep)

            corrected = "".join(chars).strip()

            # 6. Add terminal punctuation
            if corrected and corrected[-1] not in ".?!":
                first_word = corrected.split()[0].lower()
                question_starters = {
                    "how", "what", "why", "who", "where", "are", "is", "do", "does",
                    "can", "could", "should", "would", "am", "was", "were", "did",
                    "have", "has", "had",
                }
                corrected += "?" if first_word in question_starters else "."

            return {"segmented": corrected}
    except Exception as e:
        print(f"[WARN] LanguageTool API failed: {e}")

    # Fallback: return the cleaned wordsegment result
    return {"segmented": sentence}


@app.get("/api/tts")
async def text_to_speech(text: str):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty text")
    
    # en-US-AriaNeural is Microsoft's natural-sounding neural voice
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
    audio_buffer = io.BytesIO()
    
    try:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
        audio_buffer.seek(0)
        return StreamingResponse(audio_buffer, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
