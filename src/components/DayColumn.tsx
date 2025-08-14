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
  
  // Calculate minimum heights based on week's maximum content
  const maxWorkouts = Math.max(...weekData.days.map(day => day.workouts.length));
  const maxTodos = Math.max(...weekData.days.map(day => day.todos.length));
  
  // Calculate actual content heights for this specific day
  const currentWorkouts = dayData.workouts.length;
  const currentTodos = dayData.todos.length;
  
  // Calculate the heights for the LONGEST modules in the week (including metrics + workouts)
  const maxHealthModuleHeight = Math.max(60 + (maxWorkouts * 25), 120); // Larger for metrics + workouts
  const maxTodoModuleHeight = Math.max(40 + (maxTodos * 20), 80); // Larger for todos
  
  // Calculate the actual height needed for this day's content
  const thisHealthHeight = Math.max(60 + (currentWorkouts * 25), 120);
  const thisTodoHeight = Math.max(40 + (currentTodos * 20), 80);
  
  
  return (
    <div 
      className={`day-column ${isCurrentDay ? 'day-column-today' : ''}`}
    >
      <div className="flex flex-col space-y-1.5">
        {/* Apple Health Data Section - Always same height based on week's max */}
        <div style={{ minHeight: `${maxHealthModuleHeight}px` }} className="bg-gradient-to-br from-red-50/50 to-orange-50/50 border border-red-200/30 rounded p-1">
          <div className="text-xs font-semibold text-base-content/70 mb-1">🏥 Hälsodata</div>
          {dayData.metrics && settings.modules_enabled.withings ? (
            <AppleHealthModule dayData={dayData} />
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: `${maxHealthModuleHeight - 30}px` }}>
              <span className="text-xs text-base-content/50">Ingen hälsodata</span>
            </div>
          )}
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