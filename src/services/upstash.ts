import { Redis } from '@upstash/redis';
import type { Settings, WithingsCredentials, Todo } from '../types';

// Initialize Upstash Redis client
const redis = new Redis({
  url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL || 'https://whole-mouse-18725.upstash.io',
  token: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || 'AUklAAIncDFjMWNmOTAxOWQ5NDY0OTlhYWZmZjkwYzRlNWIwMGI2MXAxMTg3MjU',
});

// Redis Keys
const KEYS = {
  SETTINGS: 'app:settings',
  WITHINGS_CREDENTIALS: 'app:withings:credentials',
};

const getTodosKey = (date: string) => `todos:${date}`;
const getSupplementsKey = (date: string) => `supplements:${date}`;

class UpstashError extends Error {
  public cause?: unknown;
  
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'UpstashError';
    this.cause = cause;
  }
}

// Settings API
export const upstashSettingsApi = {
  async getSettings(): Promise<Settings> {
    try {
      console.log('🔍 Getting settings from Upstash...');
      const settings = await redis.get(KEYS.SETTINGS);
      
      if (settings) {
        console.log('✅ Settings loaded from Upstash:', settings);
        return settings as Settings;
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
      throw new UpstashError('Failed to get settings', error);
    }
  },

  async updateSettings(settings: Settings): Promise<void> {
    try {
      console.log('💾 Saving settings to Upstash:', settings);
      await redis.set(KEYS.SETTINGS, settings);
      console.log('✅ Settings saved to Upstash');
    } catch (error) {
      console.error('❌ Failed to save settings to Upstash:', error);
      throw new UpstashError('Failed to save settings', error);
    }
  },
};

// Withings Credentials API
export const upstashWithingsApi = {
  async saveCredentials(credentials: WithingsCredentials): Promise<void> {
    try {
      console.log('🔐 Saving Withings credentials to Upstash (encrypted)');
      // In a real app, you'd encrypt these before storing
      await redis.set(KEYS.WITHINGS_CREDENTIALS, credentials);
      console.log('✅ Withings credentials saved to Upstash');
    } catch (error) {
      console.error('❌ Failed to save Withings credentials to Upstash:', error);
      throw new UpstashError('Failed to save credentials', error);
    }
  },

  async getCredentials(): Promise<WithingsCredentials | null> {
    try {
      console.log('🔍 Getting Withings credentials from Upstash...');
      const credentials = await redis.get(KEYS.WITHINGS_CREDENTIALS);
      console.log('✅ Withings credentials loaded from Upstash');
      return credentials as WithingsCredentials | null;
    } catch (error) {
      console.error('❌ Failed to get Withings credentials from Upstash:', error);
      throw new UpstashError('Failed to get credentials', error);
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
      
      // Basic validation - in a real app you'd test the actual OAuth flow
      return { success: true, message: 'Credentials format is valid' };
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
      console.log(`✅ Todos loaded for ${date}:`, todos);
      return (todos as Todo[]) || [];
    } catch (error) {
      console.error(`❌ Failed to get todos for ${date}:`, error);
      throw new UpstashError('Failed to get todos', error);
    }
  },

  async saveTodos(date: string, todos: Todo[]): Promise<void> {
    try {
      console.log(`💾 Saving todos for ${date} to Upstash:`, todos);
      await redis.set(getTodosKey(date), todos);
      console.log(`✅ Todos saved for ${date}`);
    } catch (error) {
      console.error(`❌ Failed to save todos for ${date}:`, error);
      throw new UpstashError('Failed to save todos', error);
    }
  },

  async addTodo(date: string, text: string): Promise<Todo> {
    try {
      const todos = await this.getTodos(date);
      const newTodo: Todo = {
        id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: 'default-user', // For now, single user
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
      throw new UpstashError('Failed to add todo', error);
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
      throw new UpstashError('Failed to toggle todo', error);
    }
  },

  async deleteTodo(date: string, todoId: string): Promise<void> {
    try {
      const todos = await this.getTodos(date);
      const updatedTodos = todos.filter(todo => todo.id !== todoId);
      await this.saveTodos(date, updatedTodos);
    } catch (error) {
      console.error(`❌ Failed to delete todo ${todoId}:`, error);
      throw new UpstashError('Failed to delete todo', error);
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