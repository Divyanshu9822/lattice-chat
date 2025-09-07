# Lattice Chat

> A revolutionary AI chat interface that transforms conversations through visual branching and context-aware interactions.


AI conversations by introducing **Git-like branching** to chat interfaces. Unlike traditional linear chat applications, Lattice allows you to explore multiple conversation paths simultaneously on an interactive canvas, making complex discussions more organized and productive.

**Perfect for:**
- Research and exploration with multiple AI conversation threads
- Creative brainstorming sessions with divergent thinking paths
- Complex problem-solving requiring multiple solution approaches
- Teams collaborating on AI-assisted projects
- Anyone who wants to maximize AI conversation potential

**Key Philosophy:** Transform linear conversations into visual conversation trees where every response can branch into new exploration paths.

## 🚀 Key Features

### 🌳 **Visual Conversation Branching**
- **Git-like branching system** - Create new conversation paths from any point
- **Interactive canvas** - Navigate conversations like a mind map
- **Visual connections** - See how conversations relate and flow
- **Infinite exploration** - No limits on conversation depth or breadth

### 🎯 **Context-Aware Text Selection**
- **Smart text selection** - Select any part of AI responses to branch from
- **Automatic quoting** - Selected text appears as context in new branches  
- **Seamless branching** - Natural workflow from selection to new conversation
- **Context preservation** - Full conversation history maintained across branches

### 🤖 **Powered by Google Gemini**
- **Advanced AI responses** with Gemini 2.5 Flash integration by default
- **Context-aware conversations** that understand conversation history
- **Streaming responses** for real-time interaction

### 🎨 **Professional Canvas Interface**
- **Zoomable canvas** - Navigate large conversation trees with ease
- **Smooth animations** - Polished interactions and transitions
- **Drag and pan** - Intuitive canvas navigation
- **Mini-map** - Overview of entire conversation structure


## 📦 Installation & Setup

### Prerequisites
- **Node.js** version 18.0 or higher
- **Google Gemini API key** - Get yours from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-username/lattice-chat.git
cd lattice-chat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Google Gemini API key to .env.local

# Start development server
npm run dev
```

### Environment Configuration
Create a `.env.local` file with your API key:
```env
VITE_GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
```

> 🔐 **Security Note:** Your API key is only used client-side for direct communication with Google's Gemini API. Never commit API keys to version control.

## 🎯 How to Use Lattice Chat

### Starting Your First Conversation
1. **Open Lattice Chat** in your browser
2. **Click "Start Conversation"** or press `Ctrl+K` (Windows) / `⌘K` (Mac)
3. **Type your question** and press Enter
4. **Watch your conversation** appear as the first node on the canvas

### Creating Conversation Branches
1. **Select text** from any AI response by clicking and dragging
2. **Click the "+" button** that appears near your selection
3. **Add your follow-up question** in the quote input box
4. **Press Enter** to create a new conversation branch
5. **Explore multiple paths** from any conversation point

### Navigating the Canvas
- **Pan** - Click and drag on empty space to move around
- **Zoom** - Use mouse wheel or zoom controls in bottom-right
- **Focus** - Click any conversation node to center it
- **Fit View** - Click the fit-to-screen button to see entire conversation

### Advanced Features
- **Keyboard Shortcuts** - `Ctrl+K`/`⌘K` to start new conversation
- **Context Awareness** - Each branch maintains full conversation history
- **Visual Connections** - Follow the lines to see conversation flow
- **Node Details** - Click nodes to see timestamps and model information


## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/lattice-chat.git
cd lattice-chat

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Development Workflow
1. **Fork** the repository and create a feature branch
2. **Make changes** with clear, descriptive commits
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Submit a pull request** with detailed description

### Code Standards
- **TypeScript** with strict type checking
- **ESLint + Prettier** for consistent formatting
- **Component documentation** with JSDoc
- **Comprehensive testing** with Jest and React Testing Library


##  License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

***

<div align="center">

**Made with ❤️ by [Divyanshu9822](https://github.com/Divyanshu9822)**

[🌟 Star on GitHub](https://github.com/Divyanshu9822/lattice-chat) • [🐛 Report Bug](https://github.com/Divyanshu9822/lattice-chat/issues) • [✨ Request Feature](https://github.com/Divyanshu9822/lattice-chat/issues)

</div>
