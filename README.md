<div align="center">

<img width="120" height="120" alt="Spark Logo" src="./icon.svg" />

# ✨ Spark Personal OS

**Your AI-Powered Second Brain & Life Operating System**

[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Firebase](https://img.shields.io/badge/Firebase-Enabled-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation)

</div>

---

## 🎯 Overview

**Spark Personal OS** is a comprehensive personal productivity and life management application that combines the power of AI with a beautiful, responsive interface. It serves as your "second brain" - organizing tasks, habits, notes, goals, and much more in one unified platform.

### Why Spark?

- 🧠 **AI-First Design** - Powered by Google Gemini for intelligent suggestions, summaries, and insights
- 📱 **PWA Support** - Install on any device with offline capability
- 🔐 **Privacy Focused** - End-to-end encryption for sensitive data (passwords, vault)
- ☁️ **Cloud Sync** - Seamlessly sync with Google Drive across all devices
- 🎨 **Premium Design** - Modern glassmorphism UI with smooth animations

---

## ⭐ Features

### 📋 Core Productivity
| Feature | Description |
|---------|-------------|
| **Tasks & Projects** | Create, organize, and track tasks with subtasks, priorities, and due dates |
| **Habits Tracker** | Build positive habits with streak tracking and visual heatmaps |
| **Goals & Roadmaps** | Set long-term goals with phased roadmaps and progress tracking |
| **Notes & Ideas** | Capture thoughts with markdown support and AI-powered summaries |
| **Journal** | Daily journaling with mood tracking and reflection prompts |

### 🏋️ Health & Fitness
| Feature | Description |
|---------|-------------|
| **Workout Tracker** | Full workout logging with exercise library, sets, reps, and weight tracking |
| **Personal Records** | Track PRs with visual badges and celebration animations |
| **Workout Templates** | Save and reuse workout routines |
| **Body Weight Tracking** | Monitor weight changes over time with charts |
| **Rest Timer** | Built-in timer between sets |

### 📚 Knowledge Management
| Feature | Description |
|---------|-------------|
| **Learning Items** | Track courses, tutorials, and learning progress |
| **Book Tracking** | Manage reading list with progress and notes |
| **RSS Feed Reader** | Curated content from your favorite sources |
| **AI Summaries** | Get AI-generated summaries of articles and content |
| **Smart Capture** | Quick capture with AI-powered categorization |

### 💰 Financial Tools
| Feature | Description |
|---------|-------------|
| **Investments Tracker** | Monitor portfolio and watchlist |
| **Karma Points** | Gamified productivity scoring system |
| **Achievement System** | Unlock achievements as you progress |

### 🔐 Security
| Feature | Description |
|---------|-------------|
| **Password Manager** | Encrypted password vault with secure storage |
| **Master Password** | Protected access to sensitive data |
| **Encrypted Sync** | Secure cloud synchronization |

### 🎨 User Experience
| Feature | Description |
|---------|-------------|
| **Multiple Views** | Kanban, Calendar, Timeline, and List views |
| **Dark/Light Mode** | System-aware with manual override |
| **Custom Themes** | Personalize accent colors and appearance |
| **Keyboard Shortcuts** | Power-user navigation |
| **Voice Input** | Speech-to-text for hands-free capture |
| **Offline Support** | Full functionality without internet |

---

## 🚀 Installation

### Prerequisites

- **Node.js** v18+
- **npm** or **yarn**
- **Gemini API Key** (for AI features)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/spark-personal-os.git
cd spark-personal-os

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

### Environment Variables

Create a `.env.local` file with the following:

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

---

## 📖 Documentation

### Project Structure

```
sparkos/
├── components/          # Reusable UI components (99+)
│   ├── workout/         # Workout-specific components
│   ├── settings/        # Settings sections
│   ├── password/        # Password manager
│   ├── widgets/         # Dashboard widgets
│   └── ui/              # Core UI primitives
├── screens/             # Main application screens (16)
│   ├── HomeScreen.tsx   # Dashboard & Today view
│   ├── LibraryScreen.tsx # Planner with multiple views
│   ├── FeedScreen.tsx   # RSS & curated content
│   ├── SettingsScreen.tsx
│   └── ...
├── services/            # Business logic & APIs (27)
│   ├── geminiService.ts # Gemini AI integration
│   ├── dataService.ts   # Data persistence
│   ├── cryptoService.ts # Encryption
│   └── ...
├── hooks/               # Custom React hooks (25)
├── src/
│   ├── contexts/        # React contexts
│   └── design-tokens.css # Premium design system
├── types.ts             # TypeScript types
└── constants.ts         # App constants
```

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run lint:fix   # Fix linting issues
npm run format     # Format code with Prettier
npm run deploy     # Build and deploy to Firebase
```

---

## 🌐 Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions to:
- **Vercel** (recommended)
- **Firebase Hosting**
- **Netlify**

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/spark-personal-os)

---

## 🔧 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 with TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS + Custom CSS Variables |
| **State Management** | React Query + Context API |
| **AI** | Google Gemini API |
| **Auth & Storage** | Firebase + Google OAuth |
| **Animation** | Framer Motion |
| **PWA** | Vite PWA Plugin |
| **Calendar** | react-big-calendar |
| **Virtualization** | react-virtuoso + react-window |

---

## 🗺️ Roadmap

### Planned Features

- [ ] **Voice Assistant** - Jarvis-style voice commands
- [ ] **Daily Audio Briefing** - Listen to your day summary
- [ ] **Smart Correlations** - AI-powered insights (exercise vs productivity)
- [ ] **Focus Modes** - Context-aware UI (Morning, Work, Night)
- [ ] **Chrome Extension** - Save anything to Spark from the browser
- [ ] **Life RPG** - Gamification with XP and character progression
- [ ] **Zen Mode** - Distraction-free single-task view

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is private. All rights reserved.

---

## 💡 Acknowledgments

- [Google Gemini](https://deepmind.google/technologies/gemini/) for AI capabilities
- [Lucide Icons](https://lucide.dev/) for beautiful icons
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

---

<div align="center">

**Built with ❤️ for productivity enthusiasts**

[⬆ Back to Top](#-spark-personal-os)

</div>
