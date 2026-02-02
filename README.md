# GamerZone 🎮

A modern gaming social platform built with Next.js, Supabase, and AI-powered features.

## Features

### Core Features
- **Player Discovery**: Browse and connect with gamers
- **Real-time Chat**: Instant messaging with typing indicators
- **Swap System**: Exchange gamertags securely
- **LFG Board**: Find teammates for your favorite games
- **Admin Panel**: Comprehensive moderation tools

### AI-Powered Features ✨
- **GamerBot**: Intelligent chat assistant for gaming questions and tips
- **Bio Enhancer**: AI-powered profile improvement
- **Toxicity Analysis**: Smart moderation with AI suggestions

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **AI**: DeepSeek API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- DeepSeek API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GamerZone
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## DeepSeek AI Setup

For detailed AI features setup, see [DEEPSEEK_SETUP.md](./DEEPSEEK_SETUP.md)

**Quick setup**:
1. Get API key from [DeepSeek Platform](https://platform.deepseek.com/)
2. Add to `.env.local`: `DEEPSEEK_API_KEY=sk-...`
3. Restart dev server

## Project Structure

```
├── app/
│   ├── api/
│   │   └── deepseek/        # AI API routes
│   ├── components/          # React components
│   ├── admin/              # Admin panel
│   ├── chat/               # Chat interface
│   └── ...
├── hooks/                  # Custom React hooks
├── utils/
│   ├── supabase/          # Supabase utilities
│   └── deepseek.ts        # AI utilities
└── context/               # React context providers
```

## Key Features Documentation

### GamerBot
AI chatbot in the chat interface that answers gaming questions in Hebrew.

### Bio Enhancer
Hover over your bio on your player card and click the ✨ icon to improve it with AI.

### Toxicity Analysis
Admin panel tool that analyzes blocked words and suggests improvements.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is private and proprietary.
