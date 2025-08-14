import type { Supplement } from '../types';
import { SUPPLEMENT_LABELS } from '../types';

interface SupplementItemProps {
  supplementKey: string;
  isTaken: boolean;
  date: string;
  onToggle: (key: string) => void;
}

function SupplementItem({ supplementKey, isTaken, date, onToggle }: SupplementItemProps) {
  const supplement = SUPPLEMENT_LABELS[supplementKey as keyof typeof SUPPLEMENT_LABELS];

  return (
    <div
      className={`rounded p-1 flex items-center gap-1 cursor-pointer transition-all ${
        isTaken 
          ? 'bg-success/20 text-success' 
          : 'bg-base-200/30 hover:bg-base-200/50'
      }`}
      title={supplement.name}
      onClick={() => onToggle(supplementKey)}
    >
      <span className="text-[10px]">
        {supplement.icon}
      </span>
      
      <span className="text-[10px] font-medium flex-1 truncate">
        {supplement.name}
      </span>
      
      {isTaken && <span className="text-[10px]">✓</span>}
    </div>
  );
}

interface SupplementTrackerProps {
  supplements: Supplement[];
  date: string;
  onToggle: (key: string) => void;
}

export function SupplementTracker({ supplements, date, onToggle }: SupplementTrackerProps) {
  const supplementKeys = Object.keys(SUPPLEMENT_LABELS) as Array<keyof typeof SUPPLEMENT_LABELS>;
  
  const getSupplementStatus = (key: string) => {
    return supplements.find(s => s.key === key && s.date === date)?.taken || false;
  };

  const takenCount = supplementKeys.filter(key => getSupplementStatus(key)).length;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="badge badge-primary badge-xs">{takenCount}/{supplementKeys.length}</div>
        <div className="w-full ml-2">
          <progress 
            className="progress progress-success w-full h-1" 
            value={takenCount} 
            max={supplementKeys.length}
          ></progress>
        </div>
      </div>
      
      <div className="space-y-0.5">
        {supplementKeys.map((key) => (
          <SupplementItem
            key={key}
            supplementKey={key}
            isTaken={getSupplementStatus(key)}
            date={date}
            onToggle={onToggle}
          />
        ))}
      </div>
      
      {takenCount === supplementKeys.length && (
        <div className="text-center text-xs text-success mt-1">
          🎉 Alla tagna!
        </div>
      )}
    </div>
  );
}