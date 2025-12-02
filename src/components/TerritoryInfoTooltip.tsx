import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getMaxAreaForLevel } from '@/utils/runValidation';
import { calculateDefenseBonus } from '@/utils/territoryProtection';

interface TerritoryInfoTooltipProps {
  userLevel: number;
}

export const TerritoryInfoTooltip = ({ userLevel }: TerritoryInfoTooltipProps) => {
  const maxArea = getMaxAreaForLevel(userLevel);
  const defenseBonus = calculateDefenseBonus(userLevel);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-sm">Información de territorio</p>
            </div>
            <div className="text-xs space-y-1">
              {defenseBonus > 0 && (
                <p>
                  <span className="font-medium">Bonus defensa (Nivel {userLevel}):</span>{' '}
                  +{(defenseBonus * 100).toFixed(0)}%
                </p>
              )}
              <p className="text-muted-foreground mt-2">
                Los territorios están protegidos por 24h tras ser conquistados
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
