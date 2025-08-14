import type { DayData, Settings, WeekData } from '../types';
import { isToday } from '../utils/dateUtils';
import { AppleHealthModule } from './AppleHealthModule';
import { TodoList } from './TodoList';
import { SupplementTracker } from './SupplementTracker';

interface DayColumnProps {
  dayData: DayData;
  settings: Settings;
  weekData: WeekData;
  onTodoAdd: (date: string, text: string) => void;
  onTodoToggle: (id: string) => void;
  onTodoDelete: (id: string) => void;
  onSupplementToggle: (date: string, key: string) => void;
}

export function DayColumn({ 
  dayData, 
  settings, 
  weekData,
  onTodoAdd, 
  onTodoToggle, 
  onTodoDelete, 
  onSupplementToggle 
}: DayColumnProps) {
  const date = new Date(dayData.date);
  const isCurrentDay = isToday(date);
  
  // Find the day with the most content to set baseline for all days
  // This ensures ALL todo sections align to the same horizontal level
  const calculateActualHealthContentHeight = (day: DayData) => {
    // Base metrics height (steps, calories, etc)
    const baseHeight = 80;
    
    // For now, estimate potential workout content
    // In reality, this will be determined by Withings data
    // We need to assume worst case scenario for consistent alignment
    const maxPossibleWorkouts = 4; // Assume max 4 workouts per day
    const workoutHeight = maxPossibleWorkouts * 30; // Each workout ~30px
    
    return baseHeight + workoutHeight;
  };
  
  // Set a fixed height that accommodates the busiest possible day
  const maxHealthModuleHeight = 200; // Fixed height to ensure perfect alignment
  
  const maxTodos = Math.max(...weekData.days.map(day => day.todos.length));
  const maxTodoModuleHeight = Math.max(40 + (maxTodos * 20), 80);
  
  // Calculate the actual height needed for this day's content (for future use)
  // const thisHealthHeight = Math.max(60 + (currentWorkouts * 25), 120);
  // const thisTodoHeight = Math.max(40 + (currentTodos * 20), 80);
  
  
  return (
    <div 
      className={`day-column ${isCurrentDay ? 'day-column-today' : ''}`}
    >
      <div className="flex flex-col space-y-1.5">
        {/* Apple Health Data Section - EXACT fixed height for perfect alignment */}
        <div style={{ height: `${maxHealthModuleHeight}px` }} className="bg-gradient-to-br from-red-50/50 to-orange-50/50 border border-red-200/30 rounded p-1 flex flex-col">
          <div className="text-xs font-semibold text-base-content/70 mb-1">🏥 Hälsodata</div>
          <div className="flex-1 overflow-y-auto">
            {settings.modules_enabled.withings ? (
              <AppleHealthModule dayData={dayData} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-base-content/50">Hälsodata inaktiverad</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Todos Section - Always same height based on week's max */}
        <div style={{ minHeight: `${maxTodoModuleHeight}px` }} className="bg-gradient-to-br from-green-50/50 to-yellow-50/50 border border-green-200/30 rounded p-1">
          <div className="text-xs font-semibold text-base-content/70 mb-1">✅ Uppgifter</div>
          {settings.modules_enabled.todos ? (
            <TodoList
              todos={dayData.todos}
              date={dayData.date}
              onAdd={(text) => onTodoAdd(dayData.date, text)}
              onToggle={onTodoToggle}
              onDelete={onTodoDelete}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: `${maxTodoModuleHeight - 30}px` }}>
              <span className="text-xs text-base-content/50">Todos inaktiverade</span>
            </div>
          )}
        </div>
        
        {/* Supplements Section - Fixed height for all days */}
        <div style={{ minHeight: "80px" }} className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 border border-purple-200/30 rounded p-1">
          <div className="text-xs font-semibold text-base-content/70 mb-1">💊 Kosttillskott</div>
          {settings.modules_enabled.supplements ? (
            <SupplementTracker
              supplements={dayData.supplements}
              date={dayData.date}
              onToggle={(key) => onSupplementToggle(dayData.date, key)}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: "50px" }}>
              <span className="text-xs text-base-content/50">Kosttillskott inaktiverade</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}