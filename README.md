# MemeGen AI

MemeGen AI is a next-generation, web-based media studio powered by Google's Gemini AI models. This application combines a robust HTML5 canvas editor with state-of-the-art generative AI, enabling users to create, edit, and caption memes through a modern interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)
![Gemini API](https://img.shields.io/badge/AI-Gemini%202.5%20%2F%203.0-8E75B2.svg)

## Overview

MemeGen AI modernizes the meme creation process by integrating generative AI directly into the workflow. It features a fully responsive canvas editor for manual composition, coupled with AI tools for generating assets, brainstorming captions via image analysis, and intelligently editing images using natural language prompts.

## Features

### AI-Powered Tools
- **Magic Captions**: Utilizes **Gemini 3 Pro** to analyze uploaded images and generate contextually relevant, humorous captions automatically.
- **Generative Image Creation**: Create high-quality custom templates using **Imagen 4.0** and **Gemini 2.5 Flash**.
- **Magic Edit**: Remix and modify existing images using natural language prompts via **Gemini 2.5 Flash Image**.

### Studio Editor
- **Advanced Canvas**: Drag, drop, resize, and rotate text and sticker layers with full touch support.
- **Layer Management**: A complete layer stack system for managing multiple text boxes and stickers.
- **Image Filters**: Professional-grade CSS filters including Noir, Vintage, Cyber, and more.
- **Template Library**: Integrated search for thousands of templates via Imgflip and Memegen.link APIs.
- **Asset Integration**: Direct access to GIPHY's sticker library and a comprehensive Emoji picker.

### Technical Highlights
- **Performance**: Built on React 19 for optimal rendering performance.
- **Styling**: Modern, dark-themed UI using Tailwind CSS.
- **Architecture**: Clean component-based architecture with strict TypeScript typing.
- **Export**: High-resolution export to PNG or JPG with custom quality controls.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Icons**: Lucide React
- **External APIs**: 
  - Google Gemini API
  - GIPHY API
  - Imgflip API
  - Memegen.link API

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Google AI Studio API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/memegen-ai.git
   cd memegen-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory (or configure in your deployment provider settings). Do not commit this file.
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm start
   ```

## Deployment

This project is optimized for deployment on modern frontend hosting platforms like **Vercel**, **Netlify**, or **Cloudflare Pages**.

1. Push your code to a GitHub repository.
2. Connect the repository to your hosting provider.
3. Add your `API_KEY` in the deployment settings under "Environment Variables".
4. Deploy.

## Privacy and Security

- **Client-Side Processing**: Canvas manipulations and composition happen directly in the browser.
- **AI Data**: Images sent to the Gemini API for analysis or editing are processed according to Google's AI data policy.
- **Secret Management**: API keys are injected at build or runtime via environment variables.

## License

This project is licensed under the MIT License.