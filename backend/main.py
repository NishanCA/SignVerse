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

# Allowed frontend origins.
# Add any additional preview/branch URLs from Vercel here.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://signverse-rust.vercel.app",
    # Vercel preview deployments use the pattern below — wildcard not supported
    # by FastAPI CORSMiddleware, so add specific preview URLs as needed.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

print("[INFO] FastAPI server starting...")

spell = SpellChecker()



_whisper_model = None
def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("[INFO] Loading Whisper model...")
        from faster_whisper import WhisperModel
        _whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
        print("[OK] Whisper model loaded.")
    return _whisper_model





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



class AslGlossRequest(BaseModel):
    text: str



# ──────────────────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "SignVerse API running"}

@app.get("/health")
async def health():
    return {"status": "ok"}


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
    try:
        prefix = " ".join(req.words).strip()

        # 1. Empty prefix → suggest starters
        if not prefix:
            return {"sentence": "", "suggestions": get_starters(5)}

        prefix_lower = prefix.lower()

        # 2. Dictionary search — phrases that contain the prefix (substring match)
        matches = [p for p in COMMON_PHRASES if prefix_lower in p.lower()]

        if matches:
            # Prioritize exact prefix matches over substring matches
            prefix_matches = [p for p in matches if p.lower().startswith(prefix_lower)]
            other_matches  = [p for p in matches if not p.lower().startswith(prefix_lower)]

            # Sort by length (shortest match first)
            prefix_matches.sort(key=len)
            other_matches.sort(key=len)

            combined = prefix_matches + other_matches
            return {"sentence": prefix, "suggestions": combined[:5]}
            
        return {"sentence": prefix, "suggestions": []}

    except Exception as e:
        # Top-level catch — autocomplete failures must never crash the backend
        print(f"[Autocomplete] Unhandled error: {e}")
        return {"suggestions": []}


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
