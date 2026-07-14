# 📸 StudySnap

**Snap a photo of anything confusing — notes, textbooks, diagrams, math problems — and get a clear explanation with an instant quiz.**

StudySnap uses Google's Gemini 3.5 Flash vision model to analyze images of study material, explain them in plain language, and generate interactive quizzes to test your understanding.

![StudySnap Demo](https://img.shields.io/badge/Powered%20by-Gemini%20AI-orange?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-000?style=for-the-badge)

---

## ✨ Features

- **📷 Image Upload** — Drag-and-drop or click to upload photos of study material (JPEG, PNG, WebP, GIF)
- **💡 AI Explanations** — Gemini's vision model reads your material and explains it clearly
- **🧠 Interactive Quiz** — 3 multiple-choice questions generated from the content with instant feedback
- **🎯 Difficulty Toggle** — Switch between **ELI5** (simple) and **Detailed** (university-level) explanations
- **📊 Score Tracking** — See your quiz results with encouraging feedback
- **🎨 Premium UI** — Dark-mode glassmorphism design with warm amber/coral palette

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Vanilla CSS |
| **Backend** | FastAPI, Python 3.10+ |
| **AI Model** | Google Gemini 3.5 Flash (Multimodal Vision) |
| **Styling** | Custom dark-mode design system with glassmorphism |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone the repo

```bash
git clone https://github.com/partha0213/StudySnap.git
cd StudySnap
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Visit **http://localhost:3000** and start snapping!

---

## 📁 Project Structure

```
StudySnap/
├── backend/
│   ├── main.py              # FastAPI server + Gemini Vision integration
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   └── venv/                # Python virtual environment (gitignored)
├── frontend/
│   ├── src/app/
│   │   ├── layout.tsx       # Root layout with SEO metadata
│   │   ├── page.tsx         # Main app (upload, quiz, explanation)
│   │   └── globals.css      # Premium dark-mode design system
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🎮 How It Works

1. **Upload** a photo of study material (handwritten notes, textbook page, whiteboard, diagram, math problem)
2. **Choose difficulty** — ELI5 for simple explanations, Detailed for in-depth analysis
3. **Click "Snap & Learn"** — Gemini analyzes the image and returns an explanation + quiz
4. **Take the quiz** — Test your understanding with 3 interactive multiple-choice questions
5. **See your score** — Get instant feedback on your understanding

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/analyze` | Analyze an image (multipart form: `image` + `difficulty`) |

---

## 📄 License

MIT License — feel free to use and modify.

---

Built with ❤️ using **Gemini AI** & **Next.js** for the Education hackathon.
