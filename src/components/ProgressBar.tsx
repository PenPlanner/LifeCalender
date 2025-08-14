import type { ProgressMetric } from '../types';

interface ProgressBarProps {
  metric: ProgressMetric;
}

export function ProgressBar({ metric }: ProgressBarProps) {
  const percentage = Math.min(metric.percentage, 100);
  
  const getProgressColor = () => {
    if (metric.label.includes('Steg')) return 'progress-success';
    if (metric.label.includes('Cardio')) return 'progress-info';
    if (metric.label.includes('Kalorier')) return 'progress-warning';
    if (metric.label.includes('Max puls')) return 'progress-error';
    return 'progress-accent';
  };
  
  const getIcon = () => {
    if (metric.label.includes('Steg')) return '👟';
    if (metric.label.includes('Cardio')) return '❤️';
    if (metric.label.includes('Kalorier')) return '🔥';
    if (metric.label.includes('Max puls')) return '💓';
    if (metric.label.includes('Sömn')) return '😴';
    return '📊';
  };

  const getBadgeColor = () => {
    if (percentage >= 100) return 'badge-success';
    if (percentage >= 75) return 'badge-info';
    if (percentage >= 50) return 'badge-warning';
    return 'badge-error';
  };
  
  return (
    <div className="bg-base-100/60 rounded border border-base-300/50 p-1.5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-xs">{getIcon()}</span>
          <span className="text-xs text-base-content/70">
            {metric.label.replace('Cardio minuter', 'min').replace('Kalorier ut', 'kcal')}
          </span>
        </div>
        
        <div className={`badge ${getBadgeColor()} badge-xs px-1`}>
          {percentage.toFixed(0)}%
        </div>
      </div>
      
      <div className="text-xs text-base-content/60 mb-1">
        {Math.round(metric.current).toLocaleString()} / {Math.round(metric.goal).toLocaleString()}
      </div>
      
      <progress 
        className={`progress ${getProgressColor()} w-full h-1.5`} 
        value={percentage} 
        max="100"
      ></progress>
      
    </div>
  );
}