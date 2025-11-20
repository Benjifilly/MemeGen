# 🎨 MemeGen AI - The Next-Gen Meme Studio

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?logo=tailwind-css)
![Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-8E75B2)

**MemeGen AI** is a powerful, modern web application that fuses a robust image editor with cutting-edge Artificial Intelligence. Built with React 19 and the Google Gen AI SDK, it allows users to generate, edit, and caption memes using models like **Gemini 3 Pro**, **Gemini 2.5 Flash**, and **Imagen 4.0**.

---

## ✨ Features

### 🧠 AI-Powered Tools
*   **Magic Captions (Gemini 3 Pro):** Upload any image, and the AI analyzes the context to generate 5 witty, sarcastic, or relatable meme captions automatically.
*   **Generative Edit (Gemini 2.5 Flash):** Modify existing images using natural language prompts (e.g., "Make the cat wear sunglasses", "Change background to space").
*   **AI Image Generator (Imagen 4.0):** Create high-quality meme templates from scratch using text prompts.

### 🛠️ Professional Editor
*   **Layer System:** Manage text and stickers as independent layers.
*   **Rich Text Editing:** Support for classic meme fonts (Oswald, Anton, Bangers, Comic Neue) with customizable colors, strokes, and alignment.
*   **Sticker Library:** Integrated GIPHY search to add stickers and GIFs to your creations.
*   **Touch-Friendly Canvas:** Pinch-to-zoom, rotate, and resize gestures optimized for mobile and desktop.
*   **Smart Filters:** Apply CSS-based filters like Noir, Deep Fried, Vintage, and more.

### 🚀 Export & Sharing
*   **High-Quality Export:** Download as PNG or JPEG with quality control.
*   **Clipboard Support:** Copy images directly to your clipboard for instant sharing on Discord, Slack, or Twitter.
*   **History:** Undo/Redo functionality to manage your editing session.

---

## 📦 Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **AI Integration:** `@google/genai` SDK
*   **Icons:** Lucide React
*   **APIs:**
    *   Google Gemini API (Multimodal & Text)
    *   Imgflip & Memegen.link (Template fetching)
    *   GIPHY API (Stickers)

---

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   A **Google AI Studio API Key** (Get it [here](https://aistudio.google.com/))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/memegen-ai.git
    cd memegen-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    *   Create a `.env` file in the root directory.
    *   Add your Google Gemini API Key:
    ```env
    API_KEY=your_actual_google_api_key_here
    ```
    *(Note: The application uses `process.env.API_KEY`)*

4.  **Run the development server:**
    ```bash
    npm start
    # or
    npm run dev
    ```

5.  **Open your browser:**
    Navigate to `http://localhost:1234` (or the port shown in your terminal).

---

## 📖 Usage Guide

1.  **Start:** Choose a trending template, upload your own image, or generate one with AI.
2.  **Edit:**
    *   **Magic Captions:** Click the "Wand" icon to let AI write the text.
    *   **Add Text:** Click "Add Text" and customize font/color in the sidebar.
    *   **Stickers:** Switch to the "Stickers" tab and search GIPHY.
    *   **Filters:** Click "Filters" in the top bar to change the mood.
3.  **Refine:** Drag, rotate, and pinch layers on the canvas. Use the "Edit" tab for precise slider control.
4.  **Export:** Click "Download" to save or "Copy to Clipboard" to share immediately.

---

## 🔐 Security Note

This project uses the API Key on the client-side for demonstration purposes. For a production deployment, it is recommended to proxy requests through a backend server to keep your API keys secure.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Made with ❤️ and 🤖 by [Your Name]
