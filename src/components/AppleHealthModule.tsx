import { Activity, Heart, Footprints, Clock, Flame, Scale, Moon, Droplets } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { DayData } from '../types';
import { createWithingsApiFromConfig, WithingsHealthDataAggregator } from '../services/withingsApi';

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
  const { metrics, workouts } = dayData;
  const [withingsData, setWithingsData] = useState<any>(null);
  const [healthConfig, setHealthConfig] = useState<HealthDataConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load health data configuration
    const savedHealthConfig = localStorage.getItem('health-data-config');
    if (savedHealthConfig) {
      setHealthConfig(JSON.parse(savedHealthConfig));
    }
  }, []);

  useEffect(() => {
    const fetchWithingsData = async () => {
      if (!healthConfig) return;

      const configStr = localStorage.getItem('withings-config');
      if (!configStr) return;
      
      const config = JSON.parse(configStr);
      
      // Check if we're in demo mode (localhost with demo token)
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isDemoMode = isLocalhost && config.accessToken === 'demo-token';
      
      if (isDemoMode) {
        // Use mock data for demo mode
        setIsLoading(true);
        setTimeout(() => {
          const enabledMetrics = Object.entries(healthConfig)
            .filter(([_, enabled]) => enabled)
            .map(([key, _]) => key);
          
          const mockData: any = {
            measurements: {},
            activity: null,
            sleep: null,
            workouts: []
          };
          
          // Generate mock measurements based on enabled metrics
          if (enabledMetrics.includes('weight')) mockData.measurements.Weight = 75.2;
          if (enabledMetrics.includes('fatMass')) mockData.measurements['Fat Mass'] = 12.5;
          if (enabledMetrics.includes('muscleMass')) mockData.measurements['Muscle Mass'] = 32.1;
          if (enabledMetrics.includes('restingHeartRate')) mockData.measurements['Heart Rate'] = 68;
          if (enabledMetrics.includes('systolicBP')) mockData.measurements['Systolic BP'] = 120;
          if (enabledMetrics.includes('diastolicBP')) mockData.measurements['Diastolic BP'] = 80;
          
          // Generate mock activity data
          if (enabledMetrics.some(m => ['steps', 'distance', 'calories', 'activeMinutes'].includes(m))) {
            mockData.activity = {
              steps: 8432,
              distance: 6200, // meters
              calories: 2180,
              moderate: 25,
              intense: 15
            };
          }
          
          // Generate mock sleep data
          if (enabledMetrics.some(m => m.startsWith('sleep'))) {
            mockData.sleep = {
              data: {
                lightsleepduration: 18000, // 5 hours in seconds
                deepsleepduration: 7200,   // 2 hours
                remsleepduration: 5400     // 1.5 hours
              }
            };
          }

          // Generate mock workout data
          if (enabledMetrics.includes('workouts')) {
            mockData.workouts = [
              {
                id: 'mock-workout-1',
                category: 'Löpning',
                duration: 30, // 30 minutes
                calories: 350,
                startdate: Math.floor(new Date(dayData.date).getTime() / 1000),
                enddate: Math.floor((new Date(dayData.date).getTime() + 30 * 60 * 1000) / 1000),
                source: 'activity'
              }
            ];
          }
          
          setWithingsData(mockData);
          setIsLoading(false);
        }, 1000);
        return;
      }

      const api = createWithingsApiFromConfig();
      if (!api) return;

      setIsLoading(true);
      try {
        const aggregator = new WithingsHealthDataAggregator(api);
        const enabledMetrics = Object.entries(healthConfig)
          .filter(([_, enabled]) => enabled)
          .map(([key, _]) => key);
        
        if (enabledMetrics.length > 0) {
          console.log('Fetching health data for date:', dayData.date, 'with enabled metrics:', enabledMetrics);
          const data = await aggregator.getHealthDataForDate(new Date(dayData.date), enabledMetrics);
          console.log('Received health data:', data);
          setWithingsData(data);
        }
      } catch (error) {
        console.error('Error fetching Withings data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithingsData();
  }, [dayData.date, healthConfig]);
  
  const getWorkoutBadge = (type: string) => {
    const workoutType = type.toLowerCase();
    if (workoutType.includes('cardio') || workoutType.includes('löp')) return 'badge-info';
    if (workoutType.includes('styrk') || workoutType.includes('gym')) return 'badge-success';
    if (workoutType.includes('yoga') || workoutType.includes('stretch')) return 'badge-accent';
    return 'badge-primary';
  };
  
  const renderMetricItem = (key: string, label: string, value: any, icon: any, unit: string = '') => {
    if (!healthConfig?.[key as keyof HealthDataConfig]) return null;
    
    return (
      <div key={key} className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-xs text-base-content/70">{label}</span>
        </div>
        <span className="text-xs font-semibold text-red-600">
          {value ? `${typeof value === 'number' ? value.toLocaleString() : value}${unit}` : '-'}
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
              {renderMetricItem('distance', 'Distans', (withingsData.activity.distance / 1000).toFixed(1), <Activity size={10} className="text-red-600" />, 'km')}
              {renderMetricItem('calories', 'Kalorier', Math.round(withingsData.activity.calories), <Flame size={10} className="text-red-600" />)}
              {renderMetricItem('activeMinutes', 'Aktiva min', withingsData.activity.moderate + withingsData.activity.intense, <Clock size={10} className="text-red-600" />, 'min')}
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
              {renderMetricItem('sleepDuration', 'Sömntid', Math.round((withingsData.sleep.data.lightsleepduration + withingsData.sleep.data.deepsleepduration + withingsData.sleep.data.remsleepduration) / 3600), <Moon size={10} className="text-red-600" />, 'h')}
              {renderMetricItem('deepSleep', 'Djupsömn', Math.round(withingsData.sleep.data.deepsleepduration / 3600), <Moon size={10} className="text-red-600" />, 'h')}
              {renderMetricItem('lightSleep', 'Lättsömn', Math.round(withingsData.sleep.data.lightsleepduration / 3600), <Moon size={10} className="text-red-600" />, 'h')}
              {renderMetricItem('remSleep', 'REM-sömn', Math.round(withingsData.sleep.data.remsleepduration / 3600), <Moon size={10} className="text-red-600" />, 'h')}
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
        {healthConfig?.workouts && ((withingsData?.workouts && withingsData.workouts.length > 0) || workouts.length > 0) && (
          <div className="border-t border-red-200/50 pt-1">
            <div className="space-y-0.5">
              {/* Withings Workouts */}
              {withingsData?.workouts?.map((workout: any) => (
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
                  </div>
                </div>
              ))}
              
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

        {healthConfig?.workouts && (!withingsData?.workouts || withingsData.workouts.length === 0) && workouts.length === 0 && !isLoading && (
          <div className="border-t border-red-200/50 pt-2">
            <div className="text-center text-xs text-red-500/70">
              😴 Vilodag
            </div>
          </div>
        )}
      </div>
  );
}