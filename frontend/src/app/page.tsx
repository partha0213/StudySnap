"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface AnalysisResult {
  explanation: string;
  quiz: QuizQuestion[];
}

type Difficulty = "eli5" | "detailed";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = "http://localhost:8000";

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  // --- State ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("eli5");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set());
  const [quizComplete, setQuizComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Image Handling ---

  const handleImageSelect = useCallback((file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Maximum size is 10 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    setResult(null);
    resetQuiz();
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const removeImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    resetQuiz();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // --- Quiz Handling ---

  const resetQuiz = () => {
    setSelectedAnswers({});
    setRevealedQuestions(new Set());
    setQuizComplete(false);
  };

  const handleOptionSelect = (questionIndex: number, option: string) => {
    if (revealedQuestions.has(questionIndex)) return;

    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: option }));
    setRevealedQuestions((prev) => {
      const next = new Set(prev);
      next.add(questionIndex);
      return next;
    });

    // Check if quiz is complete
    if (result && revealedQuestions.size + 1 === result.quiz.length) {
      setQuizComplete(true);
    }
  };

  const getScore = (): number => {
    if (!result) return 0;
    return result.quiz.reduce((score, q, i) => {
      return score + (selectedAnswers[i] === q.correct_answer ? 1 : 0);
    }, 0);
  };

  const getScoreMessage = (score: number, total: number): string => {
    const pct = score / total;
    if (pct === 1) return "🎉 Perfect score! You nailed it!";
    if (pct >= 0.66) return "👏 Great job! You've got a solid understanding!";
    if (pct >= 0.33) return "📚 Good effort! Review the explanation and try again.";
    return "💪 Keep studying! The explanation above will help.";
  };

  // --- API Call ---

  const analyzeImage = async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    resetQuiz();

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("difficulty", difficulty);

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.detail || `Server error (${response.status}). Please try again.`
        );
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---

  return (
    <main className="app-container">
      {/* ---- Hero ---- */}
      <header className="hero">
        <div className="hero-badge">
          <span className="dot" />
          Powered by Gemini AI
        </div>
        <h1>StudySnap</h1>
        <p>
          Snap a photo of anything confusing — notes, textbooks, diagrams, math
          problems — and get a clear explanation with an instant quiz.
        </p>
      </header>

      {/* ---- Upload Zone ---- */}
      <section className="upload-section">
        <div
          className={`upload-zone ${isDragOver ? "drag-over" : ""} ${
            imagePreview ? "has-image" : ""
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          id="upload-zone"
        >
          {imagePreview ? (
            <div className="image-preview-wrapper">
              <img
                src={imagePreview}
                alt="Uploaded study material"
                className="image-preview"
              />
              <button
                className="remove-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                aria-label="Remove image"
                id="remove-image-btn"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="upload-icon">📸</div>
              <h3>Drop your study material here</h3>
              <p>or click to browse — JPEG, PNG, WebP, GIF (max 10 MB)</p>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            ref={fileInputRef}
            id="file-input"
          />
        </div>
      </section>

      {/* ---- Controls ---- */}
      <div className="controls-row">
        <div className="toggle-group" role="radiogroup" aria-label="Difficulty level">
          <button
            className={`toggle-btn ${difficulty === "eli5" ? "active" : ""}`}
            onClick={() => setDifficulty("eli5")}
            role="radio"
            aria-checked={difficulty === "eli5"}
            id="toggle-eli5"
          >
            🧒 ELI5
          </button>
          <button
            className={`toggle-btn ${difficulty === "detailed" ? "active" : ""}`}
            onClick={() => setDifficulty("detailed")}
            role="radio"
            aria-checked={difficulty === "detailed"}
            id="toggle-detailed"
          >
            🎓 Detailed
          </button>
        </div>
      </div>

      {/* ---- Analyze Button ---- */}
      <button
        className="analyze-btn"
        onClick={analyzeImage}
        disabled={!imageFile || isLoading}
        id="analyze-btn"
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            Analyzing with Gemini...
          </>
        ) : (
          <>📖 Snap &amp; Learn</>
        )}
      </button>

      {/* ---- Loading Skeleton ---- */}
      {isLoading && (
        <div className="result-section">
          <div className="glass-card loading-card">
            <div className="loading-spinner-lg" />
            <h3>Gemini is reading your material...</h3>
            <p>Generating explanation and quiz questions</p>
            <div style={{ marginTop: 24 }}>
              <div className="shimmer-bar" />
              <div className="shimmer-bar" />
              <div className="shimmer-bar" />
            </div>
          </div>
        </div>
      )}

      {/* ---- Error ---- */}
      {error && !isLoading && (
        <div className="result-section">
          <div className="glass-card error-card">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ---- Explanation ---- */}
      {result && !isLoading && (
        <div className="result-section">
          <div className="section-header">
            <span className="icon">💡</span>
            <h2>Explanation</h2>
          </div>
          <div className="glass-card explanation-card">
            <div className="explanation-content">
              {formatExplanation(result.explanation)}
            </div>
          </div>

          {/* ---- Quiz ---- */}
          {result.quiz.length > 0 && (
            <div className="quiz-section">
              <div className="section-header">
                <span className="icon">🧠</span>
                <h2>Test Your Understanding</h2>
              </div>

              {result.quiz.map((q, qIndex) => (
                <div
                  className="glass-card quiz-card"
                  key={qIndex}
                  style={{ animationDelay: `${qIndex * 0.1}s` }}
                >
                  <div className="quiz-question-number">{qIndex + 1}</div>
                  <div className="quiz-question-text">{q.question}</div>
                  <div className="quiz-options">
                    {q.options.map((option, oIndex) => {
                      const isRevealed = revealedQuestions.has(qIndex);
                      const isSelected = selectedAnswers[qIndex] === option;
                      const isCorrect = option === q.correct_answer;

                      let className = "quiz-option";
                      if (isRevealed) {
                        className += " disabled";
                        if (isCorrect) className += " correct";
                        else if (isSelected && !isCorrect) className += " incorrect";
                      } else if (isSelected) {
                        className += " selected";
                      }

                      return (
                        <button
                          key={oIndex}
                          className={className}
                          onClick={() => handleOptionSelect(qIndex, option)}
                          disabled={isRevealed}
                          id={`quiz-${qIndex}-option-${oIndex}`}
                        >
                          <span className="option-indicator">
                            {isRevealed && isCorrect
                              ? "✓"
                              : isRevealed && isSelected && !isCorrect
                              ? "✕"
                              : ""}
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* ---- Score Card ---- */}
              {quizComplete && (
                <div className="glass-card score-card">
                  <div className="score-value">
                    {getScore()}/{result.quiz.length}
                  </div>
                  <div className="score-label">Questions Correct</div>
                  <div className="score-message">
                    {getScoreMessage(getScore(), result.quiz.length)}
                  </div>
                  <button
                    className="try-again-btn"
                    onClick={() => {
                      removeImage();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    id="try-again-btn"
                  >
                    📸 Snap Another
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- Footer ---- */}
      <footer className="footer">
        Built with Gemini AI &amp; Next.js — StudySnap © {new Date().getFullYear()}
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Helper: Format explanation text with basic bold/section support
// ---------------------------------------------------------------------------

function formatExplanation(text: string): React.ReactNode[] {
  // Split into paragraphs and render with basic formatting
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    // Bold text between ** markers
    const parts = para.split(/\*\*(.*?)\*\*/g);
    const formatted = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
    );
    return (
      <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? "14px" : 0 }}>
        {formatted}
      </p>
    );
  });
}
