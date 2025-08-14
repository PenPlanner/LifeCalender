import type { WeekData, Settings, WithingsCredentials, Todo, Supplement } from '../types';

const API_BASE = '/api';
const POCKETBASE_URL = 'http://localhost:8090'; // Default PocketBase port

class ApiError extends Error {
  public status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

// Settings API
export const settingsApi = {
  async getSettings(): Promise<Settings> {
    return apiRequest<Settings>('/admin/settings');
  },

  async updateSettings(settings: Settings): Promise<void> {
    await apiRequest('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },
};

// Withings API
export const withingsApi = {
  async saveCredentials(credentials: WithingsCredentials): Promise<void> {
    await apiRequest('/admin/withings/credentials', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async testOAuth(): Promise<{ success: boolean; message: string }> {
    return apiRequest('/admin/withings/test-oauth');
  },

  async getWeekData(startDate: string): Promise<WeekData> {
    return apiRequest<WeekData>(`/withings/week?start=${startDate}`);
  },

  async initiateOAuth(): Promise<{ authUrl: string }> {
    return apiRequest<{ authUrl: string }>('/withings/oauth/initiate');
  },
};

// Todos API
export const todosApi = {
  async getTodos(userId: string, startDate: string, endDate: string): Promise<Todo[]> {
    return apiRequest<Todo[]>(`/todos?user_id=${userId}&start=${startDate}&end=${endDate}`);
  },

  async createTodo(todo: Omit<Todo, 'id' | 'created_at'>): Promise<Todo> {
    return apiRequest<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(todo),
    });
  },

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    return apiRequest<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteTodo(id: string): Promise<void> {
    await apiRequest(`/todos/${id}`, {
      method: 'DELETE',
    });
  },
};

// Supplements API
export const supplementsApi = {
  async getSupplements(userId: string, startDate: string, endDate: string): Promise<Supplement[]> {
    return apiRequest<Supplement[]>(`/supplements?user_id=${userId}&start=${startDate}&end=${endDate}`);
  },

  async toggleSupplement(userId: string, date: string, key: string): Promise<Supplement> {
    return apiRequest<Supplement>('/supplements/toggle', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, date, key }),
    });
  },
};

// PocketBase client for real-time features
class PocketBaseClient {
  private baseUrl: string;

  constructor(baseUrl: string = POCKETBASE_URL) {
    this.baseUrl = baseUrl;
  }

  async authenticate(email: string, password: string): Promise<{ token: string; user: unknown }> {
    const response = await fetch(`${this.baseUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });

    if (!response.ok) {
      throw new ApiError('Authentication failed', response.status);
    }

    return response.json();
  }

  async subscribeToCollection(collection: string): Promise<void> {
    // WebSocket subscription for real-time updates
    // This would be implemented with PocketBase's real-time subscriptions
    console.log(`Subscribing to ${collection} collection`);
  }
}

export const pocketbase = new PocketBaseClient();

// Mock data service for development
export const mockApi = {
  async getSettings(): Promise<Settings> {
    return {
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
  },

  async getWeekData(startDate: string): Promise<WeekData> {
    // Mock implementation - would be replaced with actual API calls
    const mockDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Create consistent demo data based on date to avoid constant re-rendering
      const dateHash = dateStr.split('-').reduce((acc, part) => acc + parseInt(part), 0);
      const dayIndex = date.getDay();
      
      return {
        date: dateStr,
        metrics: {
          steps: 8000 + (dateHash % 4000),
          cardio_minutes: 25 + (dateHash % 35),
          calories_out: 2300 + (dateHash % 700),
        },
        workouts: dayIndex === 0 || dayIndex === 6 ? [] : [
          {
            id: `workout-${dateStr}`,
            name: ['Löpning', 'Styrketräning', 'Cykling'][dateHash % 3],
            type: 'Cardio',
            duration: 40 + (dateHash % 40),
            calories: 250 + (dateHash % 300),
            start_time: `${dateStr}T07:00:00Z`,
          }
        ],
        todos: [],
        supplements: [],
      };
    });

    return {
      startDate,
      days: mockDays,
    };
  },
};

// Environment-based API selection
export const api = process.env.NODE_ENV === 'development' ? mockApi : {
  settings: settingsApi,
  withings: withingsApi,
  todos: todosApi,
  supplements: supplementsApi,
};