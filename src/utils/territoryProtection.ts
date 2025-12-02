// Sistema de protección de territorios

const PROTECTION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas
const STEAL_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 horas entre robos al mismo territorio

export interface TerritoryProtection {
  isProtected: boolean;
  remainingTime?: number;
  reason?: string;
}

export interface StealAttempt {
  territoryId: string;
  userId: string;
  timestamp: number;
}

// Verificar si un territorio está protegido
export const checkTerritoryProtection = (
  territoryUpdatedAt: string,
  currentTime: number = Date.now()
): TerritoryProtection => {
  const updatedTime = new Date(territoryUpdatedAt).getTime();
  const timeSinceUpdate = currentTime - updatedTime;

  if (timeSinceUpdate < PROTECTION_DURATION_MS) {
    return {
      isProtected: true,
      remainingTime: PROTECTION_DURATION_MS - timeSinceUpdate,
      reason: 'Territorio recientemente conquistado',
    };
  }

  return { isProtected: false };
};

// Formatear tiempo restante de protección
export const formatProtectionTime = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Verificar cooldown para robar el mismo territorio
export const checkStealCooldown = (
  lastStealAttempts: StealAttempt[],
  territoryId: string,
  userId: string,
  currentTime: number = Date.now()
): { canSteal: boolean; remainingTime?: number; reason?: string } => {
  const lastAttempt = lastStealAttempts.find(
    (attempt) =>
      attempt.territoryId === territoryId && attempt.userId === userId
  );

  if (!lastAttempt) {
    return { canSteal: true };
  }

  const timeSinceAttempt = currentTime - lastAttempt.timestamp;

  if (timeSinceAttempt < STEAL_COOLDOWN_MS) {
    return {
      canSteal: false,
      remainingTime: STEAL_COOLDOWN_MS - timeSinceAttempt,
      reason: 'Debes esperar antes de intentar robar este territorio nuevamente',
    };
  }

  return { canSteal: true };
};

// Sistema de escudos (implementación futura)
export interface Shield {
  userId: string;
  activatedAt: number;
  duration: number;
  type: 'weekly' | 'achievement' | 'purchase';
}

export const SHIELD_DURATION_MS = 48 * 60 * 60 * 1000; // 48 horas
export const MAX_WEEKLY_SHIELDS = 1; // 1 escudo gratis por semana

// Verificar si un usuario tiene escudo activo
export const checkActiveShield = (
  shields: Shield[],
  userId: string,
  currentTime: number = Date.now()
): { hasShield: boolean; remainingTime?: number } => {
  const activeShield = shields.find(
    (shield) =>
      shield.userId === userId &&
      currentTime - shield.activatedAt < shield.duration
  );

  if (activeShield) {
    const remainingTime =
      activeShield.duration - (currentTime - activeShield.activatedAt);
    return { hasShield: true, remainingTime };
  }

  return { hasShield: false };
};

// Calcular bonus de defensa por nivel
export const calculateDefenseBonus = (level: number): number => {
  // Los usuarios de mayor nivel tienen un pequeño bonus de defensa
  // Esto requiere un ritmo aún mejor para robarles
  if (level >= 20) return 0.05; // 5% mejor ritmo necesario
  if (level >= 17) return 0.04; // 4%
  if (level >= 14) return 0.03; // 3%
  if (level >= 11) return 0.02; // 2%
  if (level >= 8) return 0.01; // 1%
  return 0;
};

// Calcular ritmo necesario para robar considerando defensa
export const calculateRequiredPaceToSteal = (
  territoryPace: number,
  ownerLevel: number
): number => {
  const defenseBonus = calculateDefenseBonus(ownerLevel);
  return territoryPace * (1 - defenseBonus);
};
