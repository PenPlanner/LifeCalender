export interface WithingsMetrics {
  steps: number;
  cardio_minutes: number;
  calories_out: number;
  max_hr?: number;
  sleep_hours?: number;
}

export interface Workout {
  id: string;
  name: string;
  type: string;
  duration: number;
  calories: number;
  start_time: string;
}

export interface Todo {
  id: string;
  user_id: string;
  date: string;
  text: string;
  done: boolean;
  created_at: string;
}

export interface Supplement {
  id: string;
  user_id: string;
  date: string;
  key: 'vitamin_d' | 'omega_3' | 'creatine' | 'magnesium';
  taken: boolean;
}

export interface DayData {
  date: string;
  metrics?: WithingsMetrics;
  workouts: Workout[];
  todos: Todo[];
  supplements: Supplement[];
}

export interface WeekData {
  startDate: string;
  days: DayData[];
}

export interface Settings {
  modules_enabled: {
    withings: boolean;
    todos: boolean;
    supplements: boolean;
    weekly_summary: boolean;
  };
  day_fields: {
    steps: boolean;
    cardio_minutes: boolean;
    calories_out: boolean;
    max_hr: boolean;
    sleep: boolean;
  };
  goals: {
    steps: number;
    cardio_minutes: number;
    calories_out: number;
  };
  layout_order: string[];
}

export interface WithingsCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string[];
}

export interface ProgressMetric {
  current: number;
  goal: number;
  percentage: number;
  label: string;
}

export const SUPPLEMENT_LABELS = {
  vitamin_d: { name: 'Vitamin D3', icon: '☀️' },
  omega_3: { name: 'Omega-3', icon: '🐟' },
  creatine: { name: 'Kreatin', icon: '💪' },
  magnesium: { name: 'Magnesium', icon: '🧪' }
} as const;

export const DAY_NAMES = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'] as const;