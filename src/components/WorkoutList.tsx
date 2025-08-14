import { Clock, Flame } from 'lucide-react';
import type { Workout } from '../types';

interface WorkoutItemProps {
  workout: Workout;
}

function WorkoutItem({ workout }: WorkoutItemProps) {
  const getWorkoutBadge = () => {
    const type = workout.type.toLowerCase();
    if (type.includes('cardio') || type.includes('löp')) return 'badge-info';
    if (type.includes('styrk') || type.includes('gym')) return 'badge-success';
    if (type.includes('yoga') || type.includes('stretch')) return 'badge-accent';
    return 'badge-primary';
  };

  return (
    <div className="bg-info/10 border border-info/30 rounded p-1.5">
      <div className="flex items-center gap-1 mb-1">
        <div className={`badge ${getWorkoutBadge()} badge-xs`}>
          {workout.type}
        </div>
      </div>
      <div className="text-xs font-semibold text-base-content mb-1">
        {workout.name}
      </div>
      <div className="flex gap-2 text-xs text-base-content/70">
        <span className="flex items-center gap-0.5"><Clock size={8} />{workout.duration}m</span>
        <span className="flex items-center gap-0.5"><Flame size={8} />{workout.calories}cal</span>
      </div>
    </div>
  );
}

interface WorkoutListProps {
  workouts: Workout[];
  date: string;
}

export function WorkoutList({ workouts, date }: WorkoutListProps) {
  const dayWorkouts = workouts.filter(workout => 
    workout.start_time.startsWith(date)
  );
  
  return (
    <div className="space-y-1">
      {dayWorkouts.map((workout) => (
        <WorkoutItem key={workout.id} workout={workout} />
      ))}
      
      {dayWorkouts.length === 0 && (
        <div className="text-center py-2 text-xs text-base-content/50">
          😴 Vilodag
        </div>
      )}
    </div>
  );
}