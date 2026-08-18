# ILMHUB — Online Python Code Editor & Interactive Execution Platform

**ILMHUB** is a modern, high-performance browser-based Python 3 IDE featuring real-time code execution, interactive terminal input/output, smart error diagnostics, multi-file workspaces, and customizable layouts.

---

## 🌟 Key Features

- **⚡ Real-Time Python 3 Runner**: Browser-sandboxed WebAssembly Python runtime (Pyodide) executing Python 3 directly in dedicated Web Workers without server delay.
- **⌨️ Interactive Standard Input (`input()`)**: Interactive terminal supporting dynamic `input("Prompt: ")` and real-time terminal stdout/stderr streaming.
- **🔍 Smart Error Diagnostics**: Instant syntax & runtime traceback parser with error line indicators and friendly plain-language explanations in 4 languages (English, O‘zbekcha, Русский, Ўзбекча).
- **📂 Multi-File Python Projects**: Create, edit, rename, and import multiple `.py` modules seamlessly (`import helper`).
- **🌓 Light & Dark Themes**: High-contrast, accessibility-compliant dark and light color palettes across both the IDE and the About page.
- **🖥️ Responsive Layouts**: Flexible split layouts (Bottom, Right, Left) with smooth resizers and maximized terminal mode.
- **🚀 Single-Package Full-Stack Deployment**: Run locally via VS Code, host on Node.js/Express, or deploy directly to **Vercel** or **Cloud Run**.

---

## 🚀 Quick Start in VS Code (Local Machine)

### 1. Download & Extract
1. In Google AI Studio, click the menu in the top right and select **Export > Download ZIP**.
2. Extract the downloaded `.zip` file into a folder on your computer.

### 2. Open in VS Code
1. Launch **Visual Studio Code**.
2. Go to **File > Open Folder...** and select the extracted project folder.

### 3. Install Dependencies & Run
Open the VS Code Terminal (`Ctrl + ~` on Windows/Linux or `Cmd + ~` on Mac) and run:

```bash
# 1. Install project dependencies
npm install

# 2. Start the local full-stack development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🐙 Push to GitHub

To store your project on GitHub and enable automatic continuous deployments:

```bash
# 1. Initialize git repository
git init

# 2. Add all project files
git add .

# 3. Commit
git commit -m "feat: ILMHUB Python IDE release"

# 4. Set default branch to main
git branch -M main

# 5. Link to your GitHub repository (replace with your repository URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ilmhub.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 🌐 Deploy to Vercel (1-Click Deployment)

The project includes pre-configured `vercel.json` and serverless API handlers for instant Vercel deployment:

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..." > "Project"**.
3. Import your GitHub repository (`ilmhub`).
4. Vercel automatically detects the **Vite** framework and build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **"Deploy"**.

Your live website is instantly available at `https://your-project.vercel.app`! Both frontend UI and backend API routes work together in one place.

---

## 🛠️ Project Structure

```
├── api/                    # Serverless API routes (Vercel & cloud functions)
│   ├── execute.ts          # Python execution endpoint
│   ├── health.ts           # API health check endpoint
│   └── stop.ts             # Process cancellation endpoint
├── src/
│   ├── components/         # Modular React components
│   │   ├── CodeEditor.tsx  # Monaco-based Python code editor
│   │   ├── Terminal.tsx    # Interactive I/O terminal
│   │   ├── ErrorPanel.tsx  # Error explanation & traceback panel
│   │   ├── Header.tsx      # Top navigation & toolbar
│   │   ├── LandingPage.tsx # About ILMHUB overview page
│   │   ├── SettingsModal.tsx # Workspace preferences modal
│   │   ├── StatusBar.tsx   # Bottom IDE status bar
│   │   └── Toast.tsx       # Toast notifications
│   ├── locales/            # Multi-language translations (EN, UZ, RU, UZ-CYRL)
│   ├── python/             # Python executor & Web Worker bridges
│   ├── services/           # Frontend API client services
│   ├── types.ts            # TypeScript interfaces & types
│   ├── App.tsx             # Root workspace container
│   ├── main.tsx            # React application entrypoint
│   └── index.css           # Global Tailwind CSS styles
├── server.ts               # Node.js / Express full-stack development & production server
├── vercel.json             # Vercel deployment configuration
├── vite.config.ts          # Vite build config
└── package.json            # Scripts & dependencies
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` / `Cmd + Enter` | Run Python Code |
| `Ctrl + S` / `Cmd + S` | Save Code Locally |
| `Ctrl + K` / `Cmd + K` | Clear Terminal Output |
| `Esc` | Close Open Modals / Dialogs |

---

## 📄 License
MIT © 2026 ILMHUB.
