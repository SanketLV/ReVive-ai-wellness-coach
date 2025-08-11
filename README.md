# ReVive - AI Wellness Coach

A production-ready Next.js application with AI-powered wellness coaching, featuring Redis 8 as a multi-model data platform, PostgreSQL database, and intelligent health insights.

## 🚀 Features

- 🔐 **Authentication**: Secure email/password authentication using Better Auth
- 💾 **Database**: PostgreSQL with Drizzle ORM for relational data
- 🎨 **UI**: Modern, responsive interface with shadcn/ui components
- 🤖 **AI Integration**: OpenAI API integration for intelligent wellness coaching
- 📊 **Redis 8 Multi-Model**: Primary database, search engine, and real-time data processor
- 🎯 **Wellness Tracking**: Comprehensive health monitoring with AI-powered insights
- 🔍 **Vector Search**: Semantic recommendation engine for meals and workouts
- ⚡ **Real-Time Analytics**: Live health data processing and trend analysis

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Authentication**: Better Auth with secure session management
- **Database**: PostgreSQL with Drizzle ORM for relational data
- **UI Components**: shadcn/ui with Tailwind CSS for modern design
- **AI APIs**: OpenAI GPT-4 for intelligent coaching
- **Data Platform**: Redis 8 with multiple modules (JSON, Search, TimeSeries, Streams)
- **Deployment**: Docker-ready with production configurations

## ⚠️ Important: Data Entry Order Requirements

**CRITICAL**: This application requires data to be entered in chronological order. Users must add health data sequentially:

1. **First**: Add data for the earliest date
2. **Second**: Add data for the next date
3. **Third**: Add data for the following date
4. **Fourth**: Add data for the latest date

**If a user adds data for date 4 first, they will NOT be able to add data for dates 2 or 3 later.** This is due to the Redis Streams implementation and time-series data structure requirements.

**Recommendation**: Always guide users to enter health data chronologically, starting from the earliest date they want to track.

## 📋 Prerequisites

- **Node.js**: 18.17.0 or higher
- **PostgreSQL**: 14.0 or higher
- **Redis**: 8.0 or higher (with Redis Stack modules)
- **Docker**: For local Redis Stack development
- **OpenAI API Key**: For AI-powered features

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repository-url>
cd ai-wellness-coach
npm install
```

### 2. Environment Configuration

Create `.env.local` from `.env.example`:

```env
# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/ai_wellness_coach

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here-change-this-in-production
BETTER_AUTH_URL=http://localhost:3000

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start Redis Stack

```bash
# Start Redis with all modules
npm run docker:up

# Verify Redis is running
npm run docker:logs
```

### 4. Database Setup

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Open database studio
npm run db:studio
```

### 5. Start Development Server

```bash
# Start with Redis and Next.js
npm run dev:full
```

The application will be available at `http://localhost:3000`.

## 🐳 Docker Commands

```bash
# Start Redis Stack (includes all modules)
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

## 🔍 Redis 8 Multi-Model Architecture

This project demonstrates Redis 8 as a complete data platform:

- **RedisJSON**: Primary data storage for user profiles, health insights, and chat history
- **RediSearch**: Full-text search with vector capabilities for AI recommendations
- **RedisTimeSeries**: Efficient storage and querying of health metrics
- **RedisStreams**: Real-time health data ingestion and event processing

### RedisInsight Access

Access the Redis web interface at [http://localhost:8001](http://localhost:8001) to:

- Browse data structures
- Monitor performance metrics
- Debug queries and indices
- Visualize data relationships

## 📁 Project Structure

```
ai-wellness-coach/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── components/             # Reusable UI components
├── lib/                    # Core libraries
│   ├── redis.ts           # Redis client and indices setup
│   ├── ai.ts              # AI client configuration
│   ├── auth.ts            # Authentication setup
│   ├── db/                # Database configuration
│   └── services/          # Business logic services
├── modules/                # Feature modules
│   ├── auth/              # Authentication components
│   ├── chat/              # AI chat interface
│   ├── dashboard/         # Health dashboard
│   ├── profile/           # User profile management
│   └── recommend/         # Recommendation engine
├── types/                  # TypeScript type definitions
├── docker-compose.yml      # Redis Stack configuration
└── package.json           # Dependencies and scripts
```

## 🧪 Development

### Adding New Features

1. Follow the established Redis patterns in `/lib/redis.ts`
2. Use the existing service architecture in `/lib/services/`
3. Add API endpoints in `/app/api/`
4. Test with the health data endpoint: `/api/health` (POST method)

### Redis Data Patterns

- **User Profiles**: `profile:{userId}` (RedisJSON)
- **Chat Cache**: `chat:{userId}:{timestamp}` (RedisJSON with vectors)
- **Health Metrics**: `ts:{metric}:{userId}` (RedisTimeSeries)
- **Health Streams**: `stream:health:{userId}` (RedisStreams)
- **Meal Data**: `meal:{mealId}` (RedisJSON with vectors)
- **Workout Data**: `workout:{workoutId}` (RedisJSON with vectors)

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Production Database
DATABASE_URL=postgresql://prod_user:secure_password@prod_host:5432/prod_db

# Production Redis
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password

# Production Auth
BETTER_AUTH_SECRET=your_secure_random_string_32_chars_minimum
BETTER_AUTH_URL=https://your-domain.com

# Production AI
OPENAI_API_KEY=your_production_openai_key

# Production App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Deployment Checklist

- [ ] Set all production environment variables
- [ ] Configure production Redis instance with all modules
- [ ] Set up PostgreSQL production database
- [ ] Configure proper CORS and security headers
- [ ] Set up monitoring and logging
- [ ] Test all Redis functionality in production
- [ ] Verify data entry order requirements work correctly

### Redis Production Requirements

Ensure your production Redis instance includes:

- **RedisJSON** module
- **RediSearch** module with vector support
- **RedisTimeSeries** module
- **RedisStreams** module
- **Adequate memory** for your data volume
- **Persistence** configuration for data durability

## 📚 API Documentation

### Health Endpoints

- `POST /api/health` - Ingest health data (steps, sleep, mood, water)
- `GET /api/health/profile` - Get or update user health profile and goals
- `GET /api/health/insights` - Get AI-generated health insights and trends

### Chat Endpoints

- `POST /api/chat` - AI wellness coaching chat

### Recommendation Endpoints

- `POST /api/recommend` - Get personalized meal/workout recommendations

### Metrics Endpoints

- `GET /api/metrics` - Health metrics analytics

### Testing API Endpoints

Test your API endpoints:

```bash
# Test health data ingestion (requires authentication)
curl -X POST http://localhost:3000/api/health \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"steps": 8000, "sleep": 7.5, "mood": "happy", "water": 2.0, "timestamp": 1704067200000}'

# Test health profile retrieval (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/health/profile

# Test health insights (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/health/insights
```

**Note**: These endpoints require user authentication. Use the sign-in flow to get a valid session token.

## 🔒 Security Considerations

- **Authentication**: Secure session management with Better Auth
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Data Validation**: Comprehensive input validation with Zod
- **Environment Variables**: Secure configuration management
- **Redis Security**: Password-protected Redis instances

## 📊 Performance Monitoring

- **Redis Performance**: Monitor through RedisInsight
- **API Response Times**: Built-in timing headers
- **Database Queries**: Drizzle query logging
- **Memory Usage**: Redis memory monitoring

## 🤝 Contributing

1. Check the PRD files for planned features
2. Follow the existing code patterns and architecture
3. Test with the health data endpoint (`/api/health`)
4. Ensure Redis functionality works correctly
5. Update documentation as needed
6. Test data entry order requirements

## 🆘 Support

For issues related to:

- **Data Entry Order**: Ensure chronological data entry
- **Redis Setup**: Check Docker logs and RedisInsight
- **Database**: Verify PostgreSQL connection and schema
- **AI Features**: Confirm OpenAI API key and quotas

---

**Built with ❤️ using Next.js 15, Redis 8, and OpenAI**
