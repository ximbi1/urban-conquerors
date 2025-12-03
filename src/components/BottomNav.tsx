import { Home, Target, Users, Activity, Trophy, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomNavProps {
  activeSection: 'home' | 'challenges' | 'friends' | 'feed' | 'leagues' | 'clans';
  onShowHome: () => void;
  onShowChallenges: () => void;
  onShowFriends: () => void;
  onShowFeed: () => void;
  onShowRanking: () => void;
  onShowClans: () => void;
}

const BottomNav = ({ 
  activeSection,
  onShowHome, 
  onShowChallenges, 
  onShowFriends, 
  onShowFeed, 
  onShowRanking,
  onShowClans
}: BottomNavProps) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-2 max-w-screen-sm mx-auto">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`flex-col h-12 w-12 hover:bg-primary/20 transition-colors ${
            activeSection === 'home' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={onShowHome}
        >
          <Home className="h-5 w-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className={`flex-col h-12 w-12 hover:bg-primary/20 transition-colors ${
            activeSection === 'leagues' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={onShowRanking}
        >
          <Trophy className="h-5 w-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className={`flex-col h-12 w-12 hover:bg-primary/20 transition-colors ${
            activeSection === 'challenges' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={onShowChallenges}
        >
          <Target className="h-5 w-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className={`flex-col h-12 w-12 hover:bg-primary/20 transition-colors ${
            activeSection === 'clans' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={onShowClans}
        >
          <Shield className="h-5 w-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className={`flex-col h-12 w-12 hover:bg-primary/20 transition-colors ${
            activeSection === 'friends' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={onShowFriends}
        >
          <Users className="h-5 w-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className={`flex-col h-12 w-12 hover:bg-primary/20 transition-colors ${
            activeSection === 'feed' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={onShowFeed}
        >
          <Activity className="h-5 w-5" />
        </Button>

      </div>
    </nav>
  );
};

export default BottomNav;
