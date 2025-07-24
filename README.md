# AI Wellness Coach

A Next.js application with Better Auth authentication, PostgreSQL database, and AI-powered wellness coaching features.

## 🚀 Features

- 🔐 **Authentication**: Email/password authentication using Better Auth
- 💾 **Database**: PostgreSQL with Drizzle ORM
- 🎨 **UI**: Modern interface with shadcn/ui components
- 🤖 **AI Integration**: OpenAI and Anthropic API support
- 📊 **Redis**: Caching and session storage
- 🎯 **Wellness Tracking**: User profiles, goals, and conversations

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Better Auth
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui with Tailwind CSS
- **AI APIs**: OpenAI and Anthropic
- **Caching**: Redis
- **TypeScript**: Full type safety

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis (optional, for caching)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Update `.env.local` with your database and API credentials:

```env
# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/ai_wellness_coach

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here-change-this-in-production
BETTER_AUTH_URL=http://localhost:3000

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

Generate and push the database schema:

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 5. Optional: Start with Redis

If you want to use Redis for caching:

```bash
npm run dev:full
```

## 🐳 Docker Commands

```bash
# Start Redis Stack
npm run docker:up

# Stop Redis Stack
npm run docker:down

# View Redis logs
npm run docker:logs

# Access Redis CLI
npm run redis:cli

# Start everything (Redis + Next.js)
npm run dev:full
```

## 🔍 Redis Stack Features

This project uses multiple Redis modules:

- **RedisJSON**: Store structured data (user profiles, chat history)
- **RediSearch**: Full-text and vector search for AI features
- **RedisTimeSeries**: Time-based health metrics
- **RedisStreams**: Event logging and real-time data
- **Redis Pub/Sub**: Real-time notifications

### RedisInsight

Access the Redis web interface at [http://localhost:8001](http://localhost:8001) to:
- Browse data structures
- Monitor performance
- Debug queries
- Visualize data

## 📁 Project Structure

```
ai-wellness-coach/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── page.tsx           # Main page
├── lib/                   # Utility libraries
│   ├── redis.ts          # Redis client and indices
│   └── ai.ts             # AI client configuration
├── prd/                   # Product Requirements Documents
├── docker-compose.yml     # Redis Stack configuration
├── .env.local            # Environment variables (create from .env.example)
└── package.json          # Dependencies and scripts
```

## 🧪 Development

### Adding New Features

1. Review the PRD files in the `/prd` directory
2. Follow the task lists for each feature
3. Use the established Redis patterns in `/lib/redis.ts`
4. Add API endpoints in `/app/api/`
5. Test with the health check endpoint

### Redis Data Patterns

- **Users**: `user:{userId}` (JSON)
- **Chat Cache**: `chat:{userId}:{timestamp}` (JSON with vectors)
- **Health Data**: `ts:{userId}:{metric}` (TimeSeries)
- **Recommendations**: `recommendation:{id}` (JSON with vectors)
- **Streams**: `stream:health:{userId}` (Streams)
- **Notifications**: `notify:{userId}` (Pub/Sub channels)

## 🚀 Deployment

The application is ready for deployment on platforms like Vercel, with Redis Stack running on a cloud provider or Redis Cloud.

### Environment Variables for Production

```env
REDIS_URL=redis://your-redis-instance:6379
OPENAI_API_KEY=your_production_openai_key
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=https://your-domain.com
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Redis Stack Documentation](https://redis.io/docs/stack/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🤝 Contributing

1. Check the PRD files for planned features
2. Follow the existing code patterns
3. Test with the health check endpoint
4. Update documentation as needed
