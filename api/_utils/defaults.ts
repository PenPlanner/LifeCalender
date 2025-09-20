import type { Settings } from '../../src/types';

export const DEFAULT_SETTINGS: Settings = {
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
