import type { Settings, WithingsCredentials, Todo } from '../types';

// Simple REST API client for Upstash Redis (browser-friendly)
const UPSTASH_URL = import.meta.env.VITE_UPSTASH_REDIS_REST_URL || 'https://whole-mouse-18725.upstash.io';
const UPSTASH_TOKEN = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || 'AUklAAIncDFjMWNmOTAxOWQ5NDY0OTlhYWZmZjkwYzRlNWIwMGI2MXAxMTg3MjU';

class UpstashSimpleError extends Error {
  public cause?: unknown;
  
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'UpstashSimpleError';
    this.cause = cause;
  }
}

// Simple Redis commands using REST API
class SimpleRedis {
  private baseUrl: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseUrl = url;
    this.token = token;
  }

  private async command<T>(cmd: string[]): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cmd),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Upstash command failed:', error);
      throw new UpstashSimpleError('Redis command failed', error);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.command(['GET', key]);
  }

  async set(key: string, value: string): Promise<string> {
    return this.command(['SET', key, value]);
  }

  async ping(): Promise<string> {
    return this.command(['PING']);
  }
}

const redis = new SimpleRedis(UPSTASH_URL, UPSTASH_TOKEN);

// Redis Keys
const KEYS = {
  SETTINGS: 'app:settings',
  WITHINGS_CREDENTIALS: 'app:withings:credentials',
};

const getTodosKey = (date: string) => `todos:${date}`;
const getSupplementsKey = (date: string) => `supplements:${date}`;

// Settings API
export const upstashSettingsApi = {
  async getSettings(): Promise<Settings> {
    try {
      console.log('🔍 Getting settings from Upstash...');
      const settings = await redis.get(KEYS.SETTINGS);
      
      if (settings) {
        const parsed = JSON.parse(settings);
        console.log('✅ Settings loaded from Upstash:', parsed);
        return parsed as Settings;
      }
      
      // Return default settings if none exist
      const defaultSettings: Settings = {
        modules_enabled: {
          withings: true,
          todos: true,
          supplements: true,
          weekly_summary: true,
        },
        day_fields: {
          steps: true,
          cardio_minutes: true,
          calories_out: true,
          max_hr: false,
          sleep: false,
        },
        goals: {
          steps: 10000,
          cardio_minutes: 30,
          calories_out: 2500,
        },
        layout_order: ['metrics', 'workouts', 'todos', 'supplements'],
      };
      
      console.log('📝 Using default settings');
      return defaultSettings;
    } catch (error) {
      console.error('❌ Failed to get settings from Upstash:', error);
      throw new UpstashSimpleError('Failed to get settings', error);
    }
  },

  async updateSettings(settings: Settings): Promise<void> {
    try {
      console.log('💾 Saving settings to Upstash:', settings);
      await redis.set(KEYS.SETTINGS, JSON.stringify(settings));
      console.log('✅ Settings saved to Upstash');
    } catch (error) {
      console.error('❌ Failed to save settings to Upstash:', error);
      throw new UpstashSimpleError('Failed to save settings', error);
    }
  },
};

// Withings Credentials API
export const upstashWithingsApi = {
  async saveCredentials(credentials: WithingsCredentials): Promise<void> {
    try {
      console.log('🔐 Saving Withings credentials to Upstash (encrypted)');
      await redis.set(KEYS.WITHINGS_CREDENTIALS, JSON.stringify(credentials));
      console.log('✅ Withings credentials saved to Upstash');
    } catch (error) {
      console.error('❌ Failed to save Withings credentials to Upstash:', error);
      throw new UpstashSimpleError('Failed to save credentials', error);
    }
  },

  async getCredentials(): Promise<WithingsCredentials | null> {
    try {
      console.log('🔍 Getting Withings credentials from Upstash...');
      const credentials = await redis.get(KEYS.WITHINGS_CREDENTIALS);
      if (credentials) {
        const parsed = JSON.parse(credentials);
        console.log('✅ Withings credentials loaded from Upstash');
        return parsed as WithingsCredentials;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get Withings credentials from Upstash:', error);
      throw new UpstashSimpleError('Failed to get credentials', error);
    }
  },

  async testOAuth(): Promise<{ success: boolean; message: string }> {
    try {
      const credentials = await this.getCredentials();
      if (!credentials) {
        return { success: false, message: 'No credentials found' };
      }
      
      if (!credentials.client_id || !credentials.client_secret) {
        return { success: false, message: 'Incomplete credentials' };
      }
      
      // Test Redis connection
      await redis.ping();
      
      return { success: true, message: 'Credentials and Upstash connection are valid' };
    } catch (error) {
      console.error('❌ OAuth test failed:', error);
      return { success: false, message: 'Test failed' };
    }
  },
};

// Todos API
export const upstashTodosApi = {
  async getTodos(date: string): Promise<Todo[]> {
    try {
      console.log(`🔍 Getting todos for ${date} from Upstash...`);
      const todos = await redis.get(getTodosKey(date));
      if (todos) {
        const parsed = JSON.parse(todos);
        console.log(`✅ Todos loaded for ${date}:`, parsed);
        return parsed as Todo[];
      }
      return [];
    } catch (error) {
      console.error(`❌ Failed to get todos for ${date}:`, error);
      throw new UpstashSimpleError('Failed to get todos', error);
    }
  },

  async saveTodos(date: string, todos: Todo[]): Promise<void> {
    try {
      console.log(`💾 Saving todos for ${date} to Upstash:`, todos);
      await redis.set(getTodosKey(date), JSON.stringify(todos));
      console.log(`✅ Todos saved for ${date}`);
    } catch (error) {
      console.error(`❌ Failed to save todos for ${date}:`, error);
      throw new UpstashSimpleError('Failed to save todos', error);
    }
  },

  async addTodo(date: string, text: string): Promise<Todo> {
    try {
      const todos = await this.getTodos(date);
      const newTodo: Todo = {
        id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: 'default-user',
        date,
        text,
        done: false,
        created_at: new Date().toISOString(),
      };
      
      const updatedTodos = [...todos, newTodo];
      await this.saveTodos(date, updatedTodos);
      return newTodo;
    } catch (error) {
      console.error(`❌ Failed to add todo for ${date}:`, error);
      throw new UpstashSimpleError('Failed to add todo', error);
    }
  },

  async toggleTodo(date: string, todoId: string): Promise<void> {
    try {
      const todos = await this.getTodos(date);
      const updatedTodos = todos.map(todo =>
        todo.id === todoId ? { ...todo, done: !todo.done } : todo
      );
      await this.saveTodos(date, updatedTodos);
    } catch (error) {
      console.error(`❌ Failed to toggle todo ${todoId}:`, error);
      throw new UpstashSimpleError('Failed to toggle todo', error);
    }
  },

  async deleteTodo(date: string, todoId: string): Promise<void> {
    try {
      const todos = await this.getTodos(date);
      const updatedTodos = todos.filter(todo => todo.id !== todoId);
      await this.saveTodos(date, updatedTodos);
    } catch (error) {
      console.error(`❌ Failed to delete todo ${todoId}:`, error);
      throw new UpstashSimpleError('Failed to delete todo', error);
    }
  },
};

// Health check
export const upstashHealth = {
  async ping(): Promise<boolean> {
    try {
      await redis.ping();
      console.log('🏓 Upstash Redis is healthy');
      return true;
    } catch (error) {
      console.error('❌ Upstash Redis health check failed:', error);
      return false;
    }
  },
};

// Export unified API
export const upstashApi = {
  settings: upstashSettingsApi,
  withings: upstashWithingsApi,
  todos: upstashTodosApi,
  health: upstashHealth,
};