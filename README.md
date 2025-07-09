# Stellar Scribe

A modern, AI-powered note-taking application built with React and TypeScript. Features a clean, responsive design with dark mode support and integrated AI capabilities for text improvement, translation, and more.

## Features

- 📝 **Rich Markdown Editor** with live preview
- 🎨 **Modern UI** with dark/light theme toggle
- 🔍 **Real-time Search** across all notes
- 📌 **Pin Important Notes** to keep them at the top
- 🏷️ **Tag System** for better organization
- 🤖 **AI-Powered Tools**:
  - Text improvement and grammar correction
  - Translation to multiple languages
  - Dictionary lookups
  - Text summarization
  - Automatic tag suggestions
- 📱 **Responsive Design** works on desktop and mobile
- 💾 **Local Storage** - all data stays on your device
- ⚡ **Fast Performance** with Vite build system

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **AI Integration**: Google Gemini API
- **Icons**: Custom SVG icons
- **Storage**: Browser localStorage

## Getting Started

**Prerequisites:** Node.js (version 16 or higher)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd stellar-scribe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## Build for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Creating Notes**: Click the "New Note" button or use the sidebar
2. **Editing**: Use the left panel for writing in Markdown
3. **Preview**: See the formatted result in the right panel
4. **Search**: Use the search bar to find notes quickly
5. **Tags**: Add tags to organize your notes
6. **AI Features**: Select text and use the contextual menu for AI-powered improvements

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
