import { useState, useEffect } from 'react';
import { X, UserPlus, Check, XIcon, Users, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

interface FriendsProps {
  onClose: () => void;
  isMobileFullPage?: boolean;
  onViewUserProfile?: (userId: string) => void;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  friend_profile?: {
    username: string;
    avatar_url: string | null;
    color: string;
    total_points?: number;
    total_territories?: number;
  };
}

const Friends = ({ onClose, isMobileFullPage = false, onViewUserProfile }: FriendsProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: async () => {
      await loadFriends();
      await loadPendingRequests();
    },
    enabled: isMobileFullPage,
  });

  useEffect(() => {
    if (user) {
      loadFriends();
      loadPendingRequests();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        friend_profile:profiles!friendships_friend_id_fkey (username, avatar_url, color, total_points, total_territories)
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error cargando amigos:', error);
      return;
    }

    setFriends((data || []).map(f => ({ ...f, status: f.status as 'pending' | 'accepted' | 'rejected' })));
  };

  const loadPendingRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        friend_profile:profiles!friendships_user_id_fkey (username, avatar_url, color)
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cargando solicitudes:', error);
      return;
    }

    setPendingRequests((data || []).map(f => ({ ...f, status: f.status as 'pending' | 'accepted' | 'rejected' })));
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;

      // Filtrar usuarios que ya son amigos o tienen solicitudes pendientes
      const friendIds = friends.map(f => f.friend_id);
      const pendingIds = pendingRequests.map(r => r.user_id);
      
      const filtered = data?.filter(
        u => !friendIds.includes(u.id) && !pendingIds.includes(u.id)
      ) || [];

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya enviaste una solicitud a este usuario');
        } else {
          throw error;
        }
        return;
      }

      // Crear notificación para el usuario que recibe la solicitud
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      await supabase
        .from('notifications')
        .insert({
          user_id: friendId,
          type: 'friend_request',
          title: 'Nueva solicitud de amistad',
          message: `${senderProfile?.username || 'Un usuario'} te ha enviado una solicitud de amistad`,
          related_id: friendId
        });

      toast.success('Solicitud enviada');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      toast.error('Error al enviar solicitud');
    }
  };

  const acceptRequest = async (friendshipId: string, senderId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      // Crear notificación para el usuario que envió la solicitud
      const { data: accepterProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user?.id)
        .single();

      await supabase
        .from('notifications')
        .insert({
          user_id: senderId,
          type: 'friend_accepted',
          title: 'Solicitud aceptada',
          message: `${accepterProfile?.username || 'Un usuario'} ha aceptado tu solicitud de amistad`,
          related_id: user?.id
        });

      toast.success('¡Nuevo amigo añadido!');
      loadFriends();
      loadPendingRequests();
    } catch (error) {
      console.error('Error aceptando solicitud:', error);
      toast.error('Error al aceptar solicitud');
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      toast.error('Error rechazando solicitud');
      console.error(error);
    } else {
      toast.success('Solicitud rechazada');
      loadPendingRequests();
    }
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      toast.error('Error eliminando amigo');
      console.error(error);
    } else {
      toast.success('Amigo eliminado');
      loadFriends();
    }
  };

  if (isMobileFullPage) {
    // Mobile full page version without overlay
    return (
      <div className="w-full h-full flex flex-col bg-background">
        <div ref={containerRef} className="container mx-auto px-4 py-6 space-y-6 flex-1 overflow-y-auto pb-24 relative">
          <PullToRefreshIndicator
            isRefreshing={isRefreshing}
            pullDistance={pullDistance}
            progress={progress}
          />
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold glow-primary">Amigos</h2>
          </div>

          {/* Buscar usuarios */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Buscar usuarios</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  placeholder="Buscar por nombre de usuario..."
                  className="pl-10"
                />
              </div>
              <Button onClick={searchUsers} disabled={loading || !searchQuery.trim()}>
                Buscar
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-auto">
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback style={{ backgroundColor: profile.color }}>
                          {profile.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{profile.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.total_points} pts • {profile.total_territories} territorios
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(profile.id)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Añadir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitudes pendientes */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Solicitudes pendientes ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={request.friend_profile?.avatar_url || undefined} />
                        <AvatarFallback
                          style={{ backgroundColor: request.friend_profile?.color }}
                        >
                          {request.friend_profile?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold">{request.friend_profile?.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => acceptRequest(request.id, request.user_id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rejectRequest(request.id)}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de amigos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Mis amigos ({friends.length})
            </h3>
            {friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aún no tienes amigos</p>
                <p className="text-sm">Busca usuarios y añádelos como amigos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friendship) => (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onViewUserProfile?.(friendship.friend_id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={friendship.friend_profile?.avatar_url || undefined}
                        />
                        <AvatarFallback
                          style={{ backgroundColor: friendship.friend_profile?.color }}
                        >
                          {friendship.friend_profile?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{friendship.friend_profile?.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {friendship.friend_profile?.total_points} pts •{' '}
                          {friendship.friend_profile?.total_territories} territorios
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFriend(friendship.id);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop modal version
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 animate-fade-in">
      <Card className="w-full max-w-2xl bg-card border-glow p-4 md:p-6 space-y-4 md:space-y-6 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold glow-primary">Amigos</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className={isMobileFullPage ? 'hidden' : ''}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Buscar usuarios */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Buscar usuarios</h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                placeholder="Buscar por nombre de usuario..."
                className="pl-10"
              />
            </div>
            <Button onClick={searchUsers} disabled={loading || !searchQuery.trim()}>
              Buscar
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-auto">
              {searchResults.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback style={{ backgroundColor: profile.color }}>
                        {profile.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profile.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.total_points} pts • {profile.total_territories} territorios
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => sendFriendRequest(profile.id)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Añadir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Solicitudes pendientes */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Solicitudes pendientes ({pendingRequests.length})
            </h3>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={request.friend_profile?.avatar_url || undefined} />
                      <AvatarFallback
                        style={{ backgroundColor: request.friend_profile?.color }}
                      >
                        {request.friend_profile?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{request.friend_profile?.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => acceptRequest(request.id, request.user_id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => rejectRequest(request.id)}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de amigos */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Mis amigos ({friends.length})
          </h3>
          {friends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aún no tienes amigos</p>
              <p className="text-sm">Busca usuarios y añádelos como amigos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friendship) => (
                <div
                  key={friendship.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onViewUserProfile?.(friendship.friend_id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={friendship.friend_profile?.avatar_url || undefined}
                      />
                      <AvatarFallback
                        style={{ backgroundColor: friendship.friend_profile?.color }}
                      >
                        {friendship.friend_profile?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{friendship.friend_profile?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {friendship.friend_profile?.total_points} pts •{' '}
                        {friendship.friend_profile?.total_territories} territorios
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFriend(friendship.id);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Friends;