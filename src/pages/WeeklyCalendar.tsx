import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { DayColumn } from '../components/DayColumn';
import { getWeekDates, formatDate, getNextWeek, getPreviousWeek, getWeekLabel, isToday as checkIsToday } from '../utils/dateUtils';
import type { DayData, Settings, WeekData, Todo, Supplement } from '../types';
import { DAY_NAMES } from '../types';
// import { api } from '../services/api'; // TODO: Replace mock data with real API calls

// Mock data - will be replaced with API calls
const mockSettings: Settings = {
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

const mockDayData = (date: string): DayData => {
  // Create consistent demo data based on date to avoid constant re-rendering
  const dateHash = date.split('-').reduce((acc, part) => acc + parseInt(part), 0);
  const dayIndex = new Date(date).getDay();
  
  return {
    date,
    metrics: {
      steps: 7500 + (dateHash % 5000),
      cardio_minutes: 20 + (dateHash % 40),
      calories_out: 2200 + (dateHash % 800),
    },
    workouts: dayIndex === 0 || dayIndex === 6 ? [] : [
      {
        id: `workout-${date}`,
        ...(() => {
          const workouts = [
            { name: 'Löpning', type: 'Cardio' },
            { name: 'Styrketräning', type: 'Styrka' },
            { name: 'Cykling', type: 'Cardio' },
            { name: 'Yoga', type: 'Flexibilitet' },
            { name: 'HIIT', type: 'Cardio' },
            { name: 'Bänkpress', type: 'Styrka' }
          ];
          return workouts[dateHash % workouts.length];
        })(),
        duration: 45 + (dateHash % 30),
        calories: 300 + (dateHash % 200),
        start_time: `${date}T07:00:00Z`,
      }
    ],
    todos: [],
    supplements: [],
  };
};

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [settings] = useState<Settings>(mockSettings);
  
  const weekDates = getWeekDates(currentDate);
  const weekLabel = getWeekLabel(currentDate);
  
  const [todos, setTodos] = useState<Todo[]>(() => {
    // Exempel träningsuppgifter för att bli riktigt fit
    const initialWeekDates = getWeekDates(new Date());
    const workoutExamples = [
      { date: formatDate(initialWeekDates[0]), text: "Push-ups 4x25" },
      { date: formatDate(initialWeekDates[0]), text: "Pull-ups 4x5" },
      { date: formatDate(initialWeekDates[0]), text: "Squats 3x20" },
      { date: formatDate(initialWeekDates[0]), text: "Burpees 3x10" },
      { date: formatDate(initialWeekDates[1]), text: "Löpning 5km" },
      { date: formatDate(initialWeekDates[1]), text: "Abs roller 3x15" },
      { date: formatDate(initialWeekDates[1]), text: "Promenad 45min" },
      { date: formatDate(initialWeekDates[1]), text: "Plankan 3x60sek" },
      { date: formatDate(initialWeekDates[2]), text: "Dips 3x15" },
      { date: formatDate(initialWeekDates[2]), text: "HIIT 20min" },
      { date: formatDate(initialWeekDates[2]), text: "Mountain climbers 3x30" },
      { date: formatDate(initialWeekDates[2]), text: "Deadlifts 3x12" },
      { date: formatDate(initialWeekDates[3]), text: "Bicep curls 3x15" },
      { date: formatDate(initialWeekDates[3]), text: "Tricep dips 3x12" },
      { date: formatDate(initialWeekDates[3]), text: "Lunges 3x16" },
      { date: formatDate(initialWeekDates[3]), text: "Russian twists 3x20" },
      { date: formatDate(initialWeekDates[4]), text: "Jump squats 3x15" },
      { date: formatDate(initialWeekDates[4]), text: "Wall sit 3x45sek" },
      { date: formatDate(initialWeekDates[4]), text: "Push-up variations 3x10" },
      { date: formatDate(initialWeekDates[4]), text: "Leg raises 3x12" },
      { date: formatDate(initialWeekDates[5]), text: "Shoulder press 3x12" },
      { date: formatDate(initialWeekDates[5]), text: "Calf raises 3x20" },
      { date: formatDate(initialWeekDates[5]), text: "Side plank 2x30sek" },
      { date: formatDate(initialWeekDates[5]), text: "High knees 3x30sek" },
    ];

    return workoutExamples.map((workout, index) => ({
      id: `workout-todo-${index}`,
      user_id: 'user1',
      date: workout.date,
      text: workout.text,
      done: false,
      created_at: new Date().toISOString(),
    }));
  });
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  
  useEffect(() => {
    // Mock loading week data
    const days = weekDates.map(date => mockDayData(formatDate(date)));
    setWeekData({
      startDate: formatDate(weekDates[0]),
      days: days.map(day => ({
        ...day,
        todos: todos.filter(todo => todo.date === day.date),
        supplements: supplements.filter(supp => supp.date === day.date),
      })),
    });
  }, [currentDate, todos, supplements, weekDates]);
  
  const handleTodoAdd = (date: string, text: string) => {
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      user_id: 'user1',
      date,
      text,
      done: false,
      created_at: new Date().toISOString(),
    };
    setTodos(prev => [...prev, newTodo]);
  };
  
  const handleTodoToggle = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };
  
  const handleTodoDelete = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };
  
  const handleSupplementToggle = (date: string, key: string) => {
    const existingSupplement = supplements.find(s => s.date === date && s.key === key);
    
    if (existingSupplement) {
      setSupplements(prev => prev.map(supp =>
        supp.id === existingSupplement.id ? { ...supp, taken: !supp.taken } : supp
      ));
    } else {
      const newSupplement: Supplement = {
        id: `supplement-${Date.now()}`,
        user_id: 'user1',
        date,
        key: key as 'vitamin_d' | 'omega_3' | 'creatine' | 'magnesium',
        taken: true,
      };
      setSupplements(prev => [...prev, newSupplement]);
    }
  };
  
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const goToPreviousWeek = () => {
    setCurrentDate(prev => getPreviousWeek(prev));
  };
  
  const goToNextWeek = () => {
    setCurrentDate(prev => getNextWeek(prev));
  };

  
  if (!weekData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/70">Laddar din vecka...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col p-1 gap-1">
      {/* Ultra Compact Navigation */}
      <div className="flex justify-between items-center h-8">
        <div className="join">
          <button
            onClick={goToPreviousWeek}
            className="btn join-item btn-outline btn-xs"
            title="Föregående vecka"
          >
            <ChevronLeft size={12} />
          </button>
          
          <button
            onClick={goToToday}
            className="btn join-item btn-primary btn-xs"
          >
            <RotateCcw size={10} />
            Idag
          </button>
          
          <button
            onClick={goToNextWeek}
            className="btn join-item btn-outline btn-xs"
            title="Nästa vecka"
          >
            <ChevronRight size={12} />
          </button>
        </div>

        <h1 className="text-sm font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Vecka {weekLabel}
        </h1>

        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
            <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path d="m7 10l5 5l5-5z"/></svg>
          </div>
          <ul tabIndex={0} className="menu dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-44 mt-1">
            <li><a className="text-xs">📊 Exportera PDF</a></li>
            <li><a className="text-xs">📈 Statistik</a></li>
            <li><a className="text-xs">🔄 Synka</a></li>
          </ul>
        </div>
      </div>
      
      {/* Day Names Header with Dates */}
      <div className="grid grid-cols-7 gap-0.5">
        {weekDates.map((date, index) => {
          const isToday = checkIsToday(date);
          return (
            <div key={index} className="text-center">
              <div className={`badge badge-xs w-full py-1 ${
                isToday ? 'badge-primary' : 'badge-neutral'
              }`}>
                <span className="font-semibold uppercase tracking-wide text-xs">
                  {DAY_NAMES[index]} {date.getDate()}/{date.getMonth() + 1}
                  {isToday && ' •'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Grid */}
      <div>
        <div className="grid grid-cols-7 gap-0.5">
          {weekData.days.map((dayData) => (
            <DayColumn
              key={dayData.date}
              dayData={dayData}
              settings={settings}
              weekData={weekData}
              onTodoAdd={handleTodoAdd}
              onTodoToggle={handleTodoToggle}
              onTodoDelete={handleTodoDelete}
              onSupplementToggle={handleSupplementToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}