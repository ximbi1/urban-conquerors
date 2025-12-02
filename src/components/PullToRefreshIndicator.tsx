import { Loader2 } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
}

const PullToRefreshIndicator = ({
  isRefreshing,
  pullDistance,
  progress,
}: PullToRefreshIndicatorProps) => {
  if (!pullDistance && !isRefreshing) return null;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
      style={{
        transform: `translateY(${Math.min(pullDistance, 80)}px)`,
        opacity: Math.min(pullDistance / 50, 1),
      }}
    >
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg">
        <Loader2
          className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${progress * 3.6}deg)`,
          }}
        />
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
