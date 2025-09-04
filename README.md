# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Canvas Chat Interface 🎨💬

A modern, card-based AI chat interface with conversation branching capabilities. Unlike traditional linear chat interfaces, this system displays conversations as individual cards that can be arranged horizontally, allowing users to explore multiple conversation paths simultaneously.

![Canvas Chat Interface](./docs/preview.png)

## ✨ Features

### Core Functionality
- **Card-Based Conversations**: Each conversation branch is displayed as an individual card
- **Horizontal Scrolling**: Multiple conversation branches arranged side-by-side
- **Conversation Branching**: Create new conversation paths from any message
- **Real-time AI Streaming**: Powered by Google Gemini AI with streaming responses
- **Persistent State**: Conversations are saved locally and persist across browser sessions

### User Experience
- **Clean Minimalist Design**: Focus on content with minimal visual noise
- **Smooth Animations**: Framer Motion powered transitions and interactions
- **Responsive Layout**: Works seamlessly across different screen sizes
- **Intuitive Branching**: Hover over any message to reveal branching options
- **Session Management**: Create, switch between, and manage multiple conversation sessions

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **Modern React**: Built with React 18 and modern hooks
- **State Management**: Zustand for efficient and scalable state management
- **Tailwind CSS**: Utility-first styling with custom design system
- **Hot Reload**: Instant development feedback with Vite

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Google Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd canvas-chat-interface
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Google Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Visit `http://localhost:5173` to see the application

## 🎯 Usage Guide

### Starting a Conversation
1. The app automatically creates a welcome conversation on first load
2. Use the floating input at the bottom to send your first message
3. AI responses stream in real-time within the conversation card

### Creating Branches
1. Hover over any message in a conversation card
2. Click the "⋯" (three dots) button that appears
3. A new conversation branch will be created from that point
4. Type a new message to diverge the conversation

### Managing Sessions
1. Click the session selector in the header (top right)
2. Create new conversation sessions with the "+ New Conversation" button
3. Switch between existing sessions from the dropdown
4. Delete sessions you no longer need

### Navigation
- **Horizontal Scrolling**: Use mouse wheel or trackpad to scroll between cards
- **Card Focus**: Click any card to make it the active conversation
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # React components
│   ├── Cards/          # Conversation cards and messages
│   ├── Input/          # Input components
│   └── Layout/         # Header and layout components
├── store/              # Zustand state management
├── services/           # AI service integration
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### State Management
- **ConversationStore**: Manages conversations, branches, and messages
- **UIStore**: Handles UI state, layout, and interactions
- **Persistent Storage**: All data is automatically saved to localStorage

### Component Architecture
- **CardContainer**: Main layout component for horizontal card arrangement
- **ConversationCard**: Individual conversation branch display
- **MessageBubble**: Individual message with branching capability
- **FloatingMessageInput**: Context-aware message input
- **Header**: Session management and app controls

## 🔧 Customization

### Styling
- Modify `tailwind.config.js` for design system changes
- Update CSS custom properties in `src/index.css`
- Component-specific styles are in individual component files

### AI Models
- The app uses Google Gemini Pro by default
- Switch models in `src/services/geminiService.ts`
- Mock service available for development without API key

### Layout Configuration
- Card dimensions and spacing in `src/store/uiStore.ts`
- Animation settings in component files using Framer Motion

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Development Features
- **Mock AI Service**: Set `VITE_MOCK_AI=true` in `.env` for development without API key
- **Hot Module Replacement**: Instant feedback during development
- **TypeScript**: Full type checking and IntelliSense support

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for powering the AI responses
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Tailwind CSS](https://tailwindcss.com/) for the design system
- [Zustand](https://zustand-demo.pmnd.rs/) for state management
- [Lucide](https://lucide.dev/) for beautiful icons

---
**Built with ❤️ for better AI conversations**
