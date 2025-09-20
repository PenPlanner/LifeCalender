import { Activity, Heart, Footprints, Clock, Flame, Scale, Moon, Droplets } from 'lucide-react';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DayData } from '../types';

interface WithingsDayData {
  measurements: Record<string, number>;
  activity: {
    steps?: number;
    distance?: number;
    calories?: number;
    moderate?: number;
    intense?: number;
  } | null;
  sleep: {
    data: {
      lightsleepduration?: number;
      deepsleepduration?: number;
      remsleepduration?: number;
    };
  } | null;
  workouts: Array<{
    id: string;
    category: string;
    duration: number;
    calories: number;
    distance: number;
    steps: number;
  }>;
}

interface AppleHealthModuleProps {
  dayData: DayData;
}

interface HealthDataConfig {
  weight: boolean;
  fatMass: boolean;
  muscleMass: boolean;
  bmi: boolean;
  basalMetabolicRate: boolean;
  steps: boolean;
  distance: boolean;
  calories: boolean;
  activeMinutes: boolean;
  vo2Max: boolean;
  restingHeartRate: boolean;
  continuousHeartRate: boolean;
  heartRateVariability: boolean;
  sleepDuration: boolean;
  sleepEfficiency: boolean;
  deepSleep: boolean;
  lightSleep: boolean;
  remSleep: boolean;
  sleepScore: boolean;
  systolicBP: boolean;
  diastolicBP: boolean;
  workouts: boolean;
}

export function AppleHealthModule({ dayData }: AppleHealthModuleProps) {
  const { workouts } = dayData;
  const selectedDate = dayData.date;
  const [withingsData, setWithingsData] = useState<WithingsDayData | null>(null);
  const [healthConfig, setHealthConfig] = useState<HealthDataConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load health data configuration
    const savedHealthConfig = localStorage.getItem('health-data-config');
    if (savedHealthConfig) {
      setHealthConfig(JSON.parse(savedHealthConfig));
    }
  }, []);

  const fetchWithingsData = useCallback(async (forceRefresh = false) => {
    if (!healthConfig) return;

    const cacheKey = `withings-data-${selectedDate}`;
    const cacheTimestampKey = `${cacheKey}-time`;

    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimestampKey);
      if (cached && cacheTime) {
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - Number(cacheTime) < fiveMinutes) {
          setWithingsData(JSON.parse(cached));
          return;
        }
      }
    }

    const userId = localStorage.getItem('lifecalendar-user-id') ?? 'user1';
    const params = new URLSearchParams({ date: selectedDate, userId });

    setIsLoading(true);
    try {
      const response = await fetch(`/api/withings/day?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API svarade ${response.status}`);
      }

      const data: WithingsDayData = await response.json();
      setWithingsData(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());
    } catch (error) {
      console.error('Error fetching Withings data from backend:', error);
      setWithingsData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, healthConfig]);

  useEffect(() => {
    fetchWithingsData();
  }, [fetchWithingsData]);

    const getWorkoutBadge = (type: string) => {
    const workoutType = type.toLowerCase();
    if (workoutType.includes('cardio') || workoutType.includes('löp')) return 'badge-info';
    if (workoutType.includes('styrk') || workoutType.includes('gym')) return 'badge-success';
    if (workoutType.includes('yoga') || workoutType.includes('stretch')) return 'badge-accent';
    return 'badge-primary';
  };
  
  const renderMetricItem = (
    key: keyof HealthDataConfig,
    label: string,
    value: number | string | null | undefined,
    icon: ReactNode,
    unit: string = ''
  ) => {
    if (!healthConfig?.[key]) return null;

    return (
      <div key={key} className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-xs text-base-content/70">{label}</span>
        </div>
        <span className="text-xs font-semibold text-red-600">
          {value !== undefined && value !== null
            ? `${typeof value === 'number' ? value.toLocaleString() : value}${unit}`
            : '-'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <span className="loading loading-spinner loading-xs"></span>
          <span className="ml-2 text-xs text-base-content/70">Laddar hälsodata...</span>
        </div>
      )}

      {/* Withings Health Metrics */}
      {withingsData && (
        <div className="space-y-0.5">
          {/* Body/Scale Metrics */}
          {withingsData.measurements && (
            <>
              {renderMetricItem('weight', 'Vikt', withingsData.measurements.Weight, <Scale size={10} className="text-red-600" />, 'kg')}
              {renderMetricItem('fatMass', 'Fettmassa', withingsData.measurements['Fat Mass'], <Droplets size={10} className="text-red-600" />, 'kg')}
              {renderMetricItem('muscleMass', 'Muskelmassa', withingsData.measurements['Muscle Mass'], <Activity size={10} className="text-red-600" />, 'kg')}
            </>
          )}

          {/* Activity Metrics */}
          {withingsData.activity && (
            <>
              {renderMetricItem('steps', 'Steg', withingsData.activity.steps, <Footprints size={10} className="text-red-600" />)}
              {renderMetricItem('distance', 'Distans', withingsData.activity.distance !== undefined ? (withingsData.activity.distance / 1000).toFixed(1) : undefined, <Activity size={10} className="text-red-600" />, 'km')}
              {renderMetricItem('calories', 'Kalorier', withingsData.activity.calories !== undefined ? Math.round(withingsData.activity.calories) : undefined, <Flame size={10} className="text-red-600" />)}
              {renderMetricItem('activeMinutes', 'Aktiva min', (withingsData.activity.moderate ?? 0) + (withingsData.activity.intense ?? 0), <Clock size={10} className="text-red-600" />, 'min')}
            </>
          )}

          {/* Heart Metrics */}
          {withingsData.measurements && (
            <>
              {renderMetricItem('restingHeartRate', 'Vilopuls', withingsData.measurements['Heart Rate'], <Heart size={10} className="text-red-600" />, 'bpm')}
              {renderMetricItem('systolicBP', 'Systoliskt', withingsData.measurements['Systolic BP'], <Heart size={10} className="text-red-600" />, 'mmHg')}
              {renderMetricItem('diastolicBP', 'Diastoliskt', withingsData.measurements['Diastolic BP'], <Heart size={10} className="text-red-600" />, 'mmHg')}
            </>
          )}

          {/* Sleep Metrics */}
          {withingsData.sleep && (
            <>
              {renderMetricItem('sleepDuration', 'Sömntid', withingsData.sleep.data ? Math.round(((withingsData.sleep.data.lightsleepduration ?? 0) + (withingsData.sleep.data.deepsleepduration ?? 0) + (withingsData.sleep.data.remsleepduration ?? 0)) / 3600) : undefined, <Moon size={10} className="text-red-600" />, 'h')}
              {renderMetricItem('deepSleep', 'Djupsömn', withingsData.sleep.data?.deepsleepduration !== undefined ? Math.round(withingsData.sleep.data.deepsleepduration / 3600) : undefined, <Moon size={10} className="text-red-600" />, 'h')}
              {renderMetricItem('lightSleep', 'Lättsömn', withingsData.sleep.data?.lightsleepduration !== undefined ? Math.round(withingsData.sleep.data.lightsleepduration / 3600) : undefined, <Moon size={10} className="text-red-600" />, 'h')}
              {renderMetricItem('remSleep', 'REM-sömn', withingsData.sleep.data?.remsleepduration !== undefined ? Math.round(withingsData.sleep.data.remsleepduration / 3600) : undefined, <Moon size={10} className="text-red-600" />, 'h')}
            </>
          )}
        </div>
      )}

      {/* Show empty state if no Withings data and no config */}
      {!withingsData && !isLoading && !healthConfig && (
        <div className="text-center py-4">
          <div className="text-xs text-base-content/50 mb-2">
            Ingen hälsodata tillgänglig
          </div>
          <div className="text-xs text-base-content/50 mb-2">
            Konfigurera Withings för hälsodata
          </div>
          <Link to="/admin" className="link link-primary text-xs">
            Gå till Admin →
          </Link>
        </div>
      )}

      {/* Show empty state if no Withings data but config exists */}
      {!withingsData && !isLoading && healthConfig && (
        <div className="text-center py-4">
          <div className="text-xs text-base-content/50 mb-2">
            Ingen Withings-data hittad
          </div>
          <div className="text-xs text-base-content/50">
            Kontrollera din anslutning i admin
          </div>
        </div>
      )}


        {/* Workouts - Withings and Apple Health combined */}
        {healthConfig?.workouts && ((withingsData?.workouts && withingsData.workouts.filter((w) => (w.duration || 0) >= 3).length > 0) || workouts.length > 0) && (
          <div className="border-t border-red-200/50 pt-1">
            <div className="space-y-0.5">
              {/* Withings Workouts */}
              {withingsData?.workouts?.filter((workout) => (workout.duration || 0) >= 3).map((workout) => {
                // Check if this workout type should show distance
                const showDistance = workout.category && [
                  'Promenad', 'Löpning', 'Cykling', 'Simning', 'Rodd', 'Skidor', 'Alpint', 
                  'Snowboard', 'Skridskor', 'Skidåkning', 'Rullskridskor'
                ].includes(workout.category);
                
                return (
                  <div key={`withings-${workout.id}`} className="bg-red-100/30 border border-red-200/50 rounded p-0.5">
                    <div className="text-[10px] font-semibold text-red-700 mb-0.5">
                      {workout.category || 'Träning'}
                    </div>
                    <div className="flex gap-1 text-[10px] text-red-600/80">
                      <span className="flex items-center gap-0.5">
                        <Clock size={6} />{workout.duration || 0}m
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Flame size={6} />{Math.round(workout.calories || 0)}cal
                      </span>
                      {showDistance && workout.distance > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Activity size={6} />{workout.distance}km
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Apple Health Workouts */}
              {workouts.map((workout) => (
                <div key={workout.id} className="bg-red-100/30 border border-red-200/50 rounded p-0.5">
                  <div className="flex items-center gap-0.5 mb-0.5">
                    <div className={`badge ${getWorkoutBadge(workout.type)} badge-xs opacity-70 text-[10px] px-1 py-0`}>
                      {workout.type}
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold text-red-700 mb-0.5">
                    {workout.name}
                  </div>
                  <div className="flex gap-1 text-[10px] text-red-600/80">
                    <span className="flex items-center gap-0.5">
                      <Clock size={6} />{workout.duration}m
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Flame size={6} />{workout.calories}cal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {healthConfig?.workouts && (!withingsData?.workouts || withingsData.workouts.filter((w) => (w.duration || 0) >= 3).length === 0) && workouts.length === 0 && !isLoading && (
          <div className="border-t border-red-200/50 pt-2">
            <div className="text-center text-xs text-red-500/70">
              😴 Vilodag
            </div>
          </div>
        )}
      </div>
  );
}
