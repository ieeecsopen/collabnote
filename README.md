# CollabNote

**CollabNote** is a next-generation collaborative workspace that fuses real-time document editing with advanced cognitive tools like Thinking Canvases, Decision Logs, and Knowledge Maps. It is designed to help teams think, plan, and create together in one seamless environment.

![CollabNote Dashboard](https://via.placeholder.com/800x450.png?text=CollabNote+Dashboard)

## 🚀 Features

- **📝 Real-time Collaboration**: Edit documents together instantly using Yjs and WebSockets.
- **🧠 Thinking Canvas**: A spatial canvas for brainstorming, diagramming, and organizing thoughts.
- **⚖️ Decision Log**: Track architectural decisions, votes, and rationale (ADRs).
- **🕸️ Knowledge Map**: Visualize connections between your documents and ideas.
- **🎓 Study & Review Modes**: Dedicated modes for focused reading and active recall.
- **📊 Analytics**: Insightful metrics on collaboration and document activity.
- **🎨 Glassmorphism UI**: A premium, modern user interface with a sleek monochrome aesthetic.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS (Custom Monochrome Theme)
- **Collaboration**: Yjs, y-websocket
- **Visualization**: React Flow, React Force Graph 2d
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Real-time**: WebSocket (ws)
- **Database**: Supabase (PostgreSQL)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase project

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/collabnote.git
cd collabnote
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
DB_PASSWORD=your_db_password
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the root directory, and install dependencies:
```bash
cd ..
npm install
```

Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_WEBSOCKET_URL=ws://localhost:3000
```

Start the frontend development server:
```bash
npm run dev
```

## 📂 Project Structure

```
collabnote/
├── components/       # React components (Sidebar, Editor, Dashboard, etc.)
├── contexts/         # React Contexts (Dialog, Auth)
├── hooks/            # Custom Hooks (useAuth, useDocuments)
├── server/           # Backend Node.js server
│   ├── migrations/   # SQL migrations for Supabase
│   └── src/          # Backend source code
├── services/         # API services (documentService, profileService)
├── index.html        # Entry point
└── index.css         # Global styles & Tailwind config
```

## 🎨 Design System

CollabNote follows a strict **Monochrome Glassmorphism** design system:
- **Colors**: Strictly grayscale (Slate/Zinc) with high contrast.
- **Typography**: 'Outfit' for headings, 'Inter' for body, 'JetBrains Mono' for code.
- **Effects**: Extensive use of `backdrop-blur` and semi-transparent backgrounds.

---
Built with ❤️ for the future of work.
