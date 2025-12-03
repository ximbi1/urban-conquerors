import { Home, Target, Users, Activity, User, Bell, Trophy, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface BottomNavProps {
  activeSection: 'home' | 'challenges' | 'friends' | 'feed' | 'notifications' | 'profile' | 'leagues' | 'clans';
  onShowHome: () => void;
  onShowChallenges: () => void;
  onShowFriends: () => void;
  onShowFeed: () => void;
  onShowProfile: () => void;
  onShowNotifications: () => void;
  onShowRanking: () => void;
  onShowClans: () => void;
}

const BottomNav = ({ 
  activeSection,
  onShowHome, 
  onShowChallenges, 
  onShowFriends, 
  onShowFeed, 
  onShowProfile,
  onShowNotifications,
  onShowRanking,
  onShowClans
}: BottomNavProps) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const cleanup = subscribeToNotifications();
      return cleanup;
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return () => {};
    
    const channel = supabase
      .channel('notifications-count-bottom')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

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

        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative flex-col h-12 w-12 hover:bg-primary/20 transition-colors ${
            activeSection === 'notifications' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={onShowNotifications}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className={`flex-col h-12 w-12 hover:bg-primary/20 transition-colors ${
            activeSection === 'profile' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={onShowProfile}
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
};

export default BottomNav;
