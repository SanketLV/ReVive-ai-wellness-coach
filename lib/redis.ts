import { createClient } from 'redis';

// Create Redis client with all modules
const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// Connection event handlers
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('ready', () => {
  console.log('Redis Client Ready');
});

// Initialize connection
let isConnected = false;

export async function connectRedis() {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('Redis connected successfully');
      
      // Initialize indices after connection
      await initializeIndices();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }
  return client;
}

// Initialize search indices for the application
async function initializeIndices() {
  try {
    // Chat cache index for semantic search
    await client.ft.create('idx:chat_cache', {
      '$.question': {
        type: 'TEXT',
        AS: 'question'
      },
      '$.response': {
        type: 'TEXT',
        AS: 'response'
      },
      '$.embedding': {
        type: 'VECTOR',
        ALGORITHM: 'HNSW',
        TYPE: 'FLOAT32',
        DIM: 1536, // OpenAI embedding dimension
        DISTANCE_METRIC: 'COSINE',
        AS: 'embedding'
      },
      '$.userId': {
        type: 'TAG',
        AS: 'userId'
      },
      '$.timestamp': {
        type: 'NUMERIC',
        AS: 'timestamp'
      }
    }, {
      ON: 'JSON',
      PREFIX: 'chat:'
    });
    console.log('Chat cache index created');
  } catch (error: any) {
    if (!error.message.includes('Index already exists')) {
      console.error('Error creating chat cache index:', error);
    }
  }

  try {
    // Recommendations index for meals and workouts
    await client.ft.create('idx:recommendations', {
      '$.title': {
        type: 'TEXT',
        AS: 'title'
      },
      '$.description': {
        type: 'TEXT',
        AS: 'description'
      },
      '$.type': {
        type: 'TAG',
        AS: 'type'
      },
      '$.diet': {
        type: 'TAG',
        AS: 'diet'
      },
      '$.prepTime': {
        type: 'NUMERIC',
        AS: 'prepTime'
      },
      '$.difficulty': {
        type: 'TAG',
        AS: 'difficulty'
      },
      '$.embedding': {
        type: 'VECTOR',
        ALGORITHM: 'HNSW',
        TYPE: 'FLOAT32',
        DIM: 1536,
        DISTANCE_METRIC: 'COSINE',
        AS: 'embedding'
      }
    }, {
      ON: 'JSON',
      PREFIX: 'recommendation:'
    });
    console.log('Recommendations index created');
  } catch (error: any) {
    if (!error.message.includes('Index already exists')) {
      console.error('Error creating recommendations index:', error);
    }
  }

  try {
    // User profiles index
    await client.ft.create('idx:users', {
      '$.email': {
        type: 'TEXT',
        AS: 'email'
      },
      '$.goals': {
        type: 'TAG',
        AS: 'goals'
      },
      '$.dietPreferences': {
        type: 'TAG',
        AS: 'dietPreferences'
      },
      '$.activityLevel': {
        type: 'TAG',
        AS: 'activityLevel'
      }
    }, {
      ON: 'JSON',
      PREFIX: 'user:'
    });
    console.log('Users index created');
  } catch (error: any) {
    if (!error.message.includes('Index already exists')) {
      console.error('Error creating users index:', error);
    }
  }
}

// Initialize TimeSeries keys for health metrics
export async function initializeTimeSeries(userId: string) {
  const metrics = ['steps', 'sleep', 'mood', 'hydration'];
  
  for (const metric of metrics) {
    const key = `ts:${userId}:${metric}`;
    try {
      await client.ts.create(key, {
        RETENTION: 365 * 24 * 60 * 60 * 1000, // 1 year retention
        LABELS: {
          userId,
          metric,
          type: 'health_data'
        }
      });
    } catch (error: any) {
      if (!error.message.includes('TSDB: key already exists')) {
        console.error(`Error creating TimeSeries for ${key}:`, error);
      }
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (isConnected) {
    await client.quit();
    isConnected = false;
    console.log('Redis connection closed');
  }
});

export default client;
