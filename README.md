# 🎙️ Pitchtrain

Pitchtrain is an open-source, browser-based voice pitch trainer designed to support voice training practice. It gives you real-time
visual feedback on your pitch, lets you set target frequency ranges, record and review sessions, and build a journal of your
progress over time. Available in English and German.

The app is primarily built for transgender voice training, though it's useful for anyone working on pitch awareness and control,
including singers and voice actors.

> ⚠️ **Pitchtrain is not a medical tool.** It does not diagnose, treat, or replace professional voice therapy. Please use it
> alongside
> qualified instruction from a speech-language therapist or voice coach experienced in trans voice training. Practicing without
> proper guidance can cause vocal strain or injury.

---

## 🌐 App

**[pitchtrain.github.io/app](https://pitchtrain.github.io/app)** also available via *
*[pitchtrain.github.io](https://pitchtrain.github.io)**

---

## ✨ Features

### 📊 Real-Time Pitch Detection

Pitchtrain analyzes your microphone input live, displaying your current pitch in Hz alongside a scrolling timeline chart. Three
detection algorithms are available (Macleod, YIN, and AMDF) so you can choose what works best for your voice and environment.

### 🎯 Voice Range Targets

Set a target pitch range to practice toward. Built-in presets cover male (85–145 Hz), androgynous (145–175 Hz), and female (175–275
Hz) ranges, or you can define a custom range. The chart and status indicators show whether your pitch is within range, above it, or
below it in real time.

### 🔴 Recording & Playback

Record your voice and review it with full pitch visualization. Scrub through the timeline to revisit specific moments. Recordings
are stored in your browser and can be named and saved to your journal.

### 🗣️ Detail Mode

Work through short prompts and tongue twisters one at a time, grouped into sets. Create your own sets, import a .txt file, or edit
the built-in default set. Sets support auto-advance (1–120 second timer) and shuffle mode, so you can focus on speaking rather than
managing the interface.

### 📖 Reading Mode

Read longer texts teleprompter-style. Use your own personal texts or pick from the built-in library (dialogs and texts in English
and German). A soft glow around the text gives live feedback as your pitch drifts above or below your target, with a tunable
feedback goal and threshold.

### 📓 Session Journal

Save named sessions to a built-in journal backed by your browser's local storage. Tag sessions with custom, color-coded labels and
filter the journal by tag. Export your full journal, including audio recordings, pitch data, custom practice sets and reading texts,
as a ZIP archive. Import it back on any device or browser.

### 📱 Progressive Web App

Pitchtrain can be installed directly from the browser and works offline. No app store required.

---

## 🔒 Privacy & Data

All of your data stays on your device. Pitchtrain does not have a backend server, does not require an account, and does not transmit
any data anywhere.

- 🎵 **Recordings, pitch samples and journal tags** are stored in your browser's IndexedDB under the key `pitchtrain:journal`.
- ⚙️ **Settings** (range preferences, detector algorithm, practice sets, reading texts, language) are stored in localStorage.
- 📦 **Exports** are ZIP files you download manually — they contain your audio recordings, pitch data as CSV files, tags, custom
  practice sets and reading texts in a manifest. These files are yours entirely.

Clearing your browser data or uninstalling the PWA will remove all stored sessions.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm

### Running Locally

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Type Checking

```bash
npm run typecheck
```

### Building for Production

```bash
npm run build
```

Output goes to `build/client` and is ready to be served as a static site.

### Deploying with Docker 🐳

```bash
docker compose up -d
```

The container serves the built app via Nginx. The included `docker-compose.yml` is configured to work with Traefik as a reverse
proxy — update the host labels to match your domain.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + React Router 7
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 + Radix UI + shadcn/ui components
- **Pitch Detection:** [pitchfinder](https://github.com/peterkhayes/pitchfinder) (YIN, AMDF, Macleod)
- **Audio:** Web Audio API (microphone input, real-time analysis)
- **i18n:** i18next + react-i18next (English, German)
- **Storage:** IndexedDB (sessions, tags), localStorage (settings, custom sets and texts)
- **Export:** JSZip (ZIP archives with audio + CSV)
- **Build:** Vite + vite-plugin-pwa
- **Deployment:** Docker + Nginx

---

## 🤝 Contributing

Contributions are welcome! If you're planning something significant, please open an issue first to discuss the approach.

Please keep pull requests focused — one feature or fix per PR. Run `npm run format` before committing to keep formatting consistent.

---

## 📄 License

[GPL-3.0](LICENSE)
