
# LLM - Powered Chart Maker

## Quick Setup

### Backend (Node.js + TypeScript)

1. In the `backend` folder:

```pwsh
  cd backend
  npm install
  npm run dev
```

- Set `OPENAI_API_KEY` in a `.env` file for LLM integration.
- If no key is set, the backend uses a deterministic parser for diagrams.

1. For production:

```pwsh
  npx tsc
  node dist/index.js
```

### Frontend (React + Vite + TypeScript)

1. In the `frontend` folder:

```pwsh
  cd frontend
  npm install
  npm run dev
```

- Open the URL printed by Vite (usually [http://localhost:5173](http://localhost:5173)).

1. For production:

```pwsh
  npm run build
```

---

## Approach & Architecture

**Approach:**

- The **frontend** (React + Vite + TypeScript) lets users enter or upload text, highlight any selection (including multi-line), and choose a diagram type (flowchart, timeline, rules map). The UI is modern, responsive, and user-friendly. When a diagram is requested, the frontend sends the text, diagram type, and any instructions to the backend.
- The **backend** (Node.js + Express + TypeScript) receives the request and builds a prompt for the LLM (OpenAI API). If the LLM is unavailable, fails, or returns an empty result, a deterministic fallback parser generates a valid Mermaid diagram from the text, ensuring a diagram is always returned.
- **Diagrams** are rendered client-side using Mermaid.js for instant, interactive visualization.
- The system is robust: it always returns a diagram (even if the LLM fails) and supports flexible user input through multi-line highlighting and selection.

---

## Overview

Test_LLM is a full-stack app that turns text into clear, structured charts (flowcharts, timelines, or rules maps) using LLMs (like OpenAI). Users can highlight content, prompt the LLM, and instantly generate visual diagrams to make complex material easier to understand.

## Features

- Paste/type text or upload files (txt and pdf)
- Highlight text in the editor to generate diagrams for a selection
- Multi-line highlighting: select and color text across multiple lines/blocks
- Choose chart type: flowchart, timeline, or rules
- Instantly generate diagrams using an LLM (or fallback to local parser)
- Renders diagrams using Mermaid.js
- Backend API supports OpenAI-compatible LLMs (with fallback for demo/testing)
- Modular, extensible codebase (React + Vite + TypeScript frontend, Node.js + Express + TypeScript backend)
- **Modern UI/UX:**
  - Redesigned layout and card UI with clear sections, subtle shadows, and rounded corners
  - Upgraded typography and color scheme for accessibility and professional look
  - Polished buttons and controls with modern colors, hover/focus effects, and rounded corners
  - Enhanced responsiveness and spacing for all screen sizes
  - Subtle animations and feedback for color pickers, button presses, and diagram rendering
- **PDF highlight workflow:** When you upload a PDF and click any extracted highlight, its text is sent directly to the main document/text area for chart generation. The PDFViewer's own textarea is not affected.

## Getting Started

## Usage

1. Enter or paste text, or upload a file (txt, doc, pdf)
2. (Optional) Highlight a portion of the text to generate a diagram for just that selection
3. If you upload a PDF, extracted highlights will appear above the main text area. **Click any highlight to send its text to the main document/text area for chart generation.**
4. Select the diagram type (flowchart, timeline, rules)
5. Click "Generate" to send the request to the backend
6. The diagram is rendered instantly using Mermaid.js

**Note:**

- If you do not set an OpenAI API key, the backend will generate diagrams from your text using a deterministic parser (not just a static demo chart).

## Environment variables

This project reads runtime configuration from a `.env` file in the `backend` folder. The repo already ignores `.env` files via `.gitignore`, so your secrets are not checked into source control.

Create a file `backend/.env` (do NOT commit it) with contents similar to:

```env
OPENAI_API_KEY=sk-...your-key-here...
VITE_API_BASE=http://localhost:4000
```

Notes:

- Keep `.env` local and never paste API keys into PRs or public chats.

Frontend note:

- A small frontend example env is provided at `frontend/.env.example`. You can copy it to `frontend/.env` during development to set `VITE_API_BASE` (the frontend will default to `http://localhost:4000` if the variable is missing).

## Troubleshooting

- **Diagram not generating: (✅)**

  - Ensure both frontend and backend servers are running.
  - Make sure you have entered or selected text before clicking Generate.
  - If you see "No diagram generated yet or unable to generate diagram for the input," check backend logs for errors.
- **PDF highlight extraction issues: (✅)**

  - Only real text highlights (not ink/drawing) are extracted from PDFs.
  - Some PDFs may not support highlight extraction due to how they were created.
  - Browser security or cross-origin issues may prevent PDF.js from extracting highlights in some cases.
- **OpenAI API key or LLM errors: (✅)**

  - If you see errors about missing API keys, set `OPENAI_API_KEY` in your backend `.env` file.
  - If the LLM is unavailable, the backend will use a fallback parser to generate diagrams.
- **Network or CORS errors: (✅)**

  - Make sure the frontend is allowed to access the backend (CORS is enabled in the backend by default).
  - Check your browser console for network errors if diagrams are not returned.
- **Diagram rendering errors: (✅)**

  - If you see "Invalid Mermaid diagram" or no diagram appears, the input or LLM output may not be valid Mermaid code.
  - Try rephrasing your input or check backend logs for details.

## Architecture

- **Frontend**: React (Vite, TypeScript)
  - `App.tsx`: Main UI, handles text input, selection, diagram type, and API calls
  - `DiagramCanvas.tsx`: Renders Mermaid diagrams
  - `FileUpload.tsx`, `PDFViewer.tsx`: File handling and PDF preview
- **Backend**: Node.js (Express, TypeScript)
  - `/api/diagram`: Accepts text, diagram type, and optional instruction; builds LLM prompt and returns Mermaid code
  - Uses OpenAI API if key is set, otherwise generates diagrams from your text using a local parser
  - Fallback parser for offline/demo use

## LLM Integration

- Set `OPENAI_API_KEY` in the backend environment to enable real LLM diagram generation
- If not set, the backend generates diagrams from your text using a local parser (not just hardcoded demo diagrams)
- Prompts are carefully constructed to instruct the LLM to return only valid Mermaid code

## Example Prompts

**Order Fulfillment Process (Flowchart):**

```text
1. Customer places an order online.
2. System checks inventory.
3. If item is in stock, process payment.
4. If payment is successful, prepare shipment.
```

**Project Timeline (Timeline):**

```text
2022: Project kickoff and requirements gathering.
2023: Design and development phase.
2024: Testing and deployment.
2025: Maintenance and support.
```

**Order Processing Rules (Rules Map):**

```text
If item is in stock, then process payment, else notify customer.
If payment is successful, then prepare shipment, else cancel order.
If shipment is delayed, then notify customer.
```

```text
You are an assistant that converts plain English into a MERMAID diagram of type flowchart.
Return ONLY the mermaid diagram text (no explanation). Use the mermaid language appropriate for that type:
- flowchart: "flowchart TD" or "flowchart LR" with nodes and arrows.
- timeline: use "gantt" or a simple labeled timeline using "timeline" syntax if available (if not, use a vertical flow of time).
- rules: produce a graph or list of conditional rules as mermaid "flowchart" nodes that show triggers and outcomes.
Input text:
...user text...
```

## UI/UX Roadmap

- Redesign layout and card UI: Modern card-based design with clear sections, subtle shadows, and rounded corners. Controls are visually grouped and aligned with modern spacing and padding.
- Enhance responsiveness and spacing: Ensure the UI looks great on all screen sizes. Use flexbox or grid for layout, add responsive breakpoints.
- Add subtle animations and feedback: Add smooth transitions for color pickers, button presses, and diagram rendering. Provide clear feedback for loading and errors.
- Visual polish (layout, typography, button styles, responsive spacing, subtle animations).
- Improve diagram parsing & error handling. Make prompts and fallback parser more robust to avoid invalid Mermaid being returned.

## Deploying to Vercel (frontend + backend as serverless functions)

To deploy the entire app to Vercel as a single project (frontend + serverless backend):

1. Create a new project on Vercel and import this repository.
2. In Project Settings > Environment Variables, add:
   - `OPENAI_API_KEY` — your OpenAI API key (leave empty to use the deterministic fallback parser)
   - (Optional) `OPENAI_API_URL` — custom OpenAI-compatible endpoint
3. When configuring the project, set the root to the repository root; Vercel will detect the frontend and the `frontend/api/` serverless functions automatically.
4. Deploy. After the build finishes, the frontend will talk to the serverless function at `/api/diagram`.

Notes:

- For local development keep running `npm run dev` in the `frontend` and `backend` folders as before. In production the frontend calls `/api/diagram` by default.
- If you prefer to host only the frontend on Vercel and keep the backend elsewhere, set `VITE_API_BASE` in Vercel to point to the external backend URL instead of adding serverless functions.
