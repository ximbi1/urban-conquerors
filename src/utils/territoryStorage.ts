import { Territory, Run, UserProfile } from '@/types/territory';

const TERRITORIES_KEY = 'urbanz_territories';
const RUNS_KEY = 'urbanz_runs';
const PROFILE_KEY = 'urbanz_profile';

export const getTerritories = (): Territory[] => {
  const stored = localStorage.getItem(TERRITORIES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveTerritories = (territories: Territory[]): void => {
  localStorage.setItem(TERRITORIES_KEY, JSON.stringify(territories));
};

export const addTerritory = (territory: Territory): void => {
  const territories = getTerritories();
  territories.push(territory);
  saveTerritories(territories);
};

export const updateTerritory = (territoryId: string, updates: Partial<Territory>): void => {
  const territories = getTerritories();
  const index = territories.findIndex(t => t.id === territoryId);
  if (index !== -1) {
    territories[index] = { ...territories[index], ...updates };
    saveTerritories(territories);
  }
};

export const getRuns = (): Run[] => {
  const stored = localStorage.getItem(RUNS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveRun = (run: Run): void => {
  const runs = getRuns();
  runs.push(run);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
};

// Colores predefinidos para usuarios
const USER_COLORS = [
  'hsl(280, 80%, 60%)', // Púrpura brillante
  'hsl(180, 70%, 50%)', // Cyan
  'hsl(40, 90%, 55%)',  // Naranja
  'hsl(140, 65%, 50%)', // Verde
  'hsl(320, 75%, 55%)', // Rosa
  'hsl(200, 80%, 55%)', // Azul
  'hsl(60, 70%, 50%)',  // Amarillo
  'hsl(0, 75%, 60%)',   // Rojo
];

// Obtener color para un usuario
export const getUserColor = (userId: string): string => {
  const stored = localStorage.getItem(`user_color_${userId}`);
  if (stored) return stored;
  
  // Asignar un color basado en el ID del usuario
  const colorIndex = parseInt(userId.split('-')[1] || '0') % USER_COLORS.length;
  const color = USER_COLORS[colorIndex];
  localStorage.setItem(`user_color_${userId}`, color);
  return color;
};

export const getUserProfile = (): UserProfile => {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) {
    const profile = JSON.parse(stored);
    // Asegurar que el perfil tenga color
    if (!profile.color) {
      profile.color = getUserColor(profile.id);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
    return profile;
  }
  
  // Perfil por defecto
  const defaultProfile: UserProfile = {
    id: 'user-1',
    name: 'Runner',
    color: getUserColor('user-1'),
    totalPoints: 0,
    totalTerritories: 0,
    totalDistance: 0,
    runs: []
  };
  
  localStorage.setItem(PROFILE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
};

export const updateUserProfile = (updates: Partial<UserProfile>): void => {
  const profile = getUserProfile();
  const updated = { ...profile, ...updates };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
};

export const deleteUserTerritories = (userId: string): void => {
  const territories = getTerritories();
  const filtered = territories.filter(t => t.owner !== userId);
  saveTerritories(filtered);
  
  // Actualizar el perfil del usuario
  const profile = getUserProfile();
  if (profile.id === userId) {
    updateUserProfile({
      totalTerritories: 0,
      totalPoints: 0,
    });
  }
};

export const generateMockRankingData = () => {
  return [
    { id: 'user-1', name: 'Runner', points: 0, territories: 0, color: getUserColor('user-1') },
    { id: 'user-2', name: 'SpeedRunner', points: 450, territories: 5, color: getUserColor('user-2') },
    { id: 'user-3', name: 'MarathonKing', points: 380, territories: 4, color: getUserColor('user-3') },
    { id: 'user-4', name: 'CityExplorer', points: 320, territories: 3, color: getUserColor('user-4') },
    { id: 'user-5', name: 'UrbanWarrior', points: 280, territories: 3, color: getUserColor('user-5') }
  ];
};
