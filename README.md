# LatticeChat 🎨💬

A modern, canvas-based AI chat interface with visual conversation branching capabilities. Built as a prototype for exploring non-linear AI conversations through an infinite canvas interface.

## ✨ Features

### Core Functionality
- **Canvas-Based Conversations**: Messages displayed as connected nodes on an infinite canvas
- **Visual Branching**: Create conversation branches from any message with visual connections
- **Real-time AI Streaming**: Powered by Google Gemini AI with streaming responses
- **Session Management**: Multiple conversation sessions with local persistence
- **Infinite Canvas**: Pan, zoom, and navigate through conversation trees

### User Experience
- **Keyboard Shortcuts**: `⌘K`/`Ctrl+K` to start conversations, `Esc` to cancel
- **Smooth Animations**: Framer Motion powered transitions
- **Intuitive Controls**: Pan with drag, zoom with mouse wheel, recenter with button
- **Visual Statistics**: Real-time node and connection counts

### Technical Architecture
- **TypeScript**: Complete type safety throughout
- **React 18**: Modern hooks and concurrent features
- **ReactFlow**: Professional canvas rendering engine
- **Zustand**: Lightweight state management
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast development and optimized builds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key (required)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd latticechat
npm install

# Environment setup
cp .env.example .env
# Edit .env and add: VITE_GEMINI_API_KEY=your_actual_api_key_here

# Development
npm run dev

# Production build
npm run build
```

## 🎯 Usage

### Starting Conversations
1. Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Type your message and press Enter
3. AI responses stream in real-time as canvas nodes

### Creating Branches
1. Hover over any message node
2. Click the branch button that appears
3. Type your branch message in the floating input
4. New conversation path created with visual connections

### Canvas Navigation
- **Pan**: Click and drag empty space
- **Zoom**: Mouse wheel or trackpad
- **Recenter**: Blue button in bottom right
- **Statistics**: Node/edge counts in top left

### Session Management
- Access via header dropdown (top right)
- Create/switch/delete conversation sessions
- All data persists locally

## 🏗️ Architecture

### Project Structure
```
src/
├── components/
│   ├── Canvas/          # Canvas components and nodes
│   └── Layout/          # Header and app layout
├── hooks/
│   └── useAIChat.ts     # AI integration hook
├── services/
│   └── geminiService.ts # Gemini API service
├── store/
│   ├── conversationStore.ts # Conversation state
│   └── uiStore.ts       # UI state
├── types/               # TypeScript definitions
└── utils/               # Utility functions
```

### Core Components
- **ConversationCanvas**: Main ReactFlow canvas component
- **MessageNode**: Individual conversation nodes
- **FloatingBranchInput**: Context-aware branching input
- **Header**: Session management and controls

### State Management
- **ConversationStore**: Sessions, nodes, edges, streaming
- **UIStore**: UI state and window management
- **Persistent Storage**: Local storage with versioned migration

## 🔧 Configuration

### Environment Variables
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here  # Required
```

### Development
```bash
npm run dev          # Development server
npm run build        # Production build  
npm run preview      # Preview build
npm run lint         # ESLint
```

## 📚 API Integration

This application requires a valid Google Gemini API key:
- Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- No fallback or demo mode - proper API key required
- Clear error messages for configuration issues

## 📱 Browser Support

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚧 Development Status

This is a **prototype** focused on exploring canvas-based conversation interfaces. The codebase has been refactored for:
- Clean, production-ready code
- No legacy or demo code
- Modern React patterns
- Full TypeScript coverage
- Comprehensive documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes with proper TypeScript types
4. Test build: `npm run build`
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - AI responses
- [ReactFlow](https://reactflow.dev/) - Canvas functionality
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

---
**LatticeChat - Prototype v1.0**
