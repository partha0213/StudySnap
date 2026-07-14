"""
StudySnap Backend — FastAPI server for image analysis with Gemini Vision.

Accepts photo uploads of study materials (handwritten notes, textbook pages,
whiteboards, diagrams, math problems) and returns plain-language explanations
plus 3 quiz questions using Google's Gemini 2.5 Flash model.
"""

import logging
import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App Configuration
# ---------------------------------------------------------------------------

app = FastAPI(
    title="StudySnap API",
    description=(
        "Photo-to-explanation + quiz API powered by Gemini Vision. "
        "Upload an image of any study material and get a clear explanation "
        "with 3 quiz questions to test your understanding."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Gemini Client
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. "
        "Create a .env file with GEMINI_API_KEY=your_key_here"
    )

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_ID = "gemini-3.5-flash"

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = frozenset({
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
})

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------


class QuizQuestion(BaseModel):
    """A single multiple-choice quiz question."""

    question: str
    options: list[str]
    correct_answer: str


class AnalysisResponse(BaseModel):
    """Response containing an explanation and quiz questions."""

    explanation: str
    quiz: list[QuizQuestion]


# ---------------------------------------------------------------------------
# Prompt Templates
# ---------------------------------------------------------------------------

PROMPTS: dict[str, str] = {
    "eli5": (
        "You are a friendly tutor explaining things to a 10-year-old. "
        "Look at this image of study material.\n\n"
        "1. Explain what it shows in very simple, plain language. Use "
        "analogies and everyday examples a child would understand. Keep it "
        "concise (3-5 short paragraphs).\n\n"
        "2. Create exactly 3 multiple-choice questions testing basic "
        "understanding. Each needs exactly 4 options labeled A), B), C), D). "
        "correct_answer must exactly match one option. Vary which letter is "
        "correct across the 3 questions — don't always make it A.\n\n"
        "If the image is blurry, unclear, or doesn't look like study "
        "material, say so honestly instead of guessing."
    ),
    "detailed": (
        "You are an expert tutor providing thorough, university-level "
        "explanations. Look at this image of study material.\n\n"
        "1. Explain what it shows in detail. Include relevant context, "
        "key concepts, formulas or theorems, step-by-step breakdowns, and "
        "real-world significance. Use clear section headings in your text.\n\n"
        "2. Create exactly 3 multiple-choice questions that test deeper "
        "understanding, application, or analysis of the concepts. "
        "Each needs exactly 4 options labeled A), B), C), D). "
        "correct_answer must exactly match one option. Vary which letter is "
        "correct across the 3 questions — don't always make it A.\n\n"
        "If the image is blurry, unclear, or doesn't look like study "
        "material, say so honestly instead of guessing."
    ),
}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint to verify the API is running."""
    return {"status": "healthy", "model": MODEL_ID}


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_image(
    image: UploadFile = File(..., description="Image of study material"),
    difficulty: Literal["eli5", "detailed"] = Form("eli5"),
) -> AnalysisResponse:
    """
    Analyze an uploaded image of study material.

    Sends the image to Gemini's vision model and returns:
    - A plain-language explanation
    - 3 multiple-choice quiz questions

    Parameters
    ----------
    image : UploadFile
        The study material image (JPEG, PNG, WebP, or GIF, max 10 MB).
    difficulty : {"eli5", "detailed"}
        Explanation depth — "eli5" for simple, "detailed" for thorough.
    """
    # --- Validate MIME type ---
    if image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported image type '{image.content_type}'. "
                f"Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
            ),
        )

    # --- Read & validate size ---
    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Image too large ({len(image_bytes)} bytes). Max: 10 MB.",
        )

    logger.info(
        "Analyzing image: name=%s, type=%s, size=%d bytes, difficulty=%s",
        image.filename,
        image.content_type,
        len(image_bytes),
        difficulty,
    )

    # --- Call Gemini Vision with structured output ---
    prompt = PROMPTS[difficulty]
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=image.content_type,
                ),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResponse,
            ),
        )
    except Exception as exc:
        logger.exception("Gemini API call failed")
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error: {exc}",
        ) from exc

    # --- Validate & return ---
    if not response.text:
        raise HTTPException(
            status_code=502,
            detail="Gemini returned an empty response. Please try again.",
        )

    return AnalysisResponse.model_validate_json(response.text)


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
