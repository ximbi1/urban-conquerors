import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SeasonInfoProps {
  season: {
    name: string;
    end_date: string;
  };
}

const SeasonInfo = ({ season }: SeasonInfoProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const end = new Date(season.end_date);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Temporada finalizada');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [season.end_date]);

  return (
    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{season.name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeLeft}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonInfo;