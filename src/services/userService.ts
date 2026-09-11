import { 
  ManagedUser, 
  AuthUser, 
  CreateUserDto, 
  UpdateUserDto, 
  StationKey, 
  UserStatus 
} from '../types';
export type { ManagedUser, CreateUserDto, UpdateUserDto, UserStatus };
import { STATION_DEFINITIONS, getStationDefinition } from '../utils/stationConstants';
import { appendAuditLog } from '../utils/storage';

export const USERS_STORAGE_KEY = 'coming_back_aniversario_users_v1';

export const INITIAL_PRESET_USERS: ManagedUser[] = [
  {
    username: 'juez_sala_a1',
    name: 'Samuel Jimenez',
    role: 'judge',
    passwordHash: '12345678',
    status: 'active',
    stationKey: 'sala_a1',
    stationName: 'Sala A - Oratoria y Retórica (Mesa 1)',
    stationType: 'oratoria',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Palabra Clave',
    challengeDescription: 'Verificar si el orador principal incorporó y defendió la palabra clave asignada en su discurso.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_a2',
    name: 'Javier Perez',
    role: 'judge',
    passwordHash: '12345678',
    status: 'active',
    stationKey: 'sala_a2',
    stationName: 'Sala A - Oratoria y Retórica (Mesa 2)',
    stationType: 'oratoria',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Palabra Clave',
    challengeDescription: 'Verificar si el orador principal incorporó y defendió la palabra clave asignada en su discurso.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_b',
    name: 'José Ramón',
    role: 'judge',
    passwordHash: '12345678',
    status: 'active',
    stationKey: 'sala_b',
    stationName: 'Sala B - Debate World Schools',
    stationType: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_c',
    name: 'Juan Luis',
    role: 'judge',
    passwordHash: '12345678',
    status: 'active',
    stationKey: 'sala_c',
    stationName: 'Sala C - Debate World Schools',
    stationType: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_d',
    name: 'José Tejera',
    role: 'judge',
    passwordHash: '12345678',
    status: 'active',
    stationKey: 'sala_d',
    stationName: 'Sala D - Debate World Schools',
    stationType: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_e',
    name: 'Manuel Koolman',
    role: 'judge',
    passwordHash: '12345678',
    status: 'active',
    stationKey: 'sala_e',
    stationName: 'Sala E - Debate World Schools',
    stationType: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_f1',
    name: 'Jesus Corona',
    role: 'judge',
    passwordHash: '12345678',
    status: 'active',
    stationKey: 'sala_f1',
    stationName: 'Sala F - Resolución de Crisis & Diplomacia (Mesa 1)',
    stationType: 'crisis',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Sello Físico Oficial',
    challengeDescription: 'Comprobar el sello físico consular obtenido mediante resolución pacífica de la crisis.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_f2',
    name: 'Luis Montoya',
    role: 'judge',
    passwordHash: '12345678',
    status: 'active',
    stationKey: 'sala_f2',
    stationName: 'Sala F - Resolución de Crisis & Diplomacia (Mesa 2)',
    stationType: 'crisis',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Sello Físico Oficial',
    challengeDescription: 'Comprobar el sello físico consular obtenido mediante resolución pacífica de la crisis.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'admin_tab',
    name: 'Admin Tabulación & Mesa Directiva',
    role: 'admin',
    passwordHash: '12345678',
    status: 'active',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

/**
 * Normalizes username to lowercase, trimmed, with underscores.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Normalizes a name by removing accents and extra whitespace.
 */
export function normalizeSearchString(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Loads all users from storage. Initializes from presets if empty.
 */
export function loadUsers(): ManagedUser[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...INITIAL_PRESET_USERS];
  }

  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      saveUsers(INITIAL_PRESET_USERS);
      return [...INITIAL_PRESET_USERS];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveUsers(INITIAL_PRESET_USERS);
      return [...INITIAL_PRESET_USERS];
    }

    // Ensure status defaults to 'active' for legacy records
    return parsed.map((u: ManagedUser) => ({
      ...u,
      status: u.status === 'inactive' ? 'inactive' : 'active',
    }));
  } catch (e) {
    console.error('Error loading users from storage:', e);
    return [...INITIAL_PRESET_USERS];
  }
}

/**
 * Saves users to storage and dispatches a storage event for cross-component sync.
 */
export function saveUsers(users: ManagedUser[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to storage:', e);
  }
}

/**
 * Finds user by exact username (case-insensitive).
 */
export function findUserByUsername(username: string, users?: ManagedUser[]): ManagedUser | undefined {
  const list = users || loadUsers();
  const clean = normalizeUsername(username);
  return list.find((u) => normalizeUsername(u.username) === clean);
}

/**
 * Finds user by login string (username or name, normalized).
 */
export function findUserByLoginIdentifier(identifier: string, users?: ManagedUser[]): ManagedUser | undefined {
  const list = users || loadUsers();
  const clean = normalizeSearchString(identifier);

  return list.find((u) => {
    const uName = normalizeSearchString(u.name);
    const uUser = normalizeSearchString(u.username);
    return uName === clean || uUser === clean;
  });
}

/**
 * Checks if a station is already assigned to another ACTIVE judge.
 */
export function isStationTakenByActiveJudge(
  stationKey: StationKey,
  excludeUsername?: string,
  users?: ManagedUser[]
): { taken: boolean; assignedJudge?: ManagedUser } {
  const list = users || loadUsers();
  const cleanExclude = excludeUsername ? normalizeUsername(excludeUsername) : null;

  const found = list.find(
    (u) =>
      u.role === 'judge' &&
      u.status === 'active' &&
      u.stationKey === stationKey &&
      (!cleanExclude || normalizeUsername(u.username) !== cleanExclude)
  );

  return {
    taken: !!found,
    assignedJudge: found,
  };
}

/**
 * Validates a user payload before creation or update.
 */
export function validateUserPayload(
  payload: {
    username?: string;
    name?: string;
    role?: string;
    password?: string;
    status?: UserStatus;
    stationKey?: StationKey;
  },
  isNew: boolean,
  existingUsers: ManagedUser[],
  currentUsername?: string
): { valid: boolean; error?: string } {
  // Username check (for new user)
  if (isNew) {
    if (!payload.username || !payload.username.trim()) {
      return { valid: false, error: 'El nombre de usuario es obligatorio.' };
    }
    const cleanUser = normalizeUsername(payload.username);
    if (cleanUser.length < 3) {
      return { valid: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      return {
        valid: false,
        error: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos.',
      };
    }
    const duplicate = existingUsers.some((u) => normalizeUsername(u.username) === cleanUser);
    if (duplicate) {
      return { valid: false, error: `El usuario "${cleanUser}" ya existe en el sistema.` };
    }
  }

  // Name check
  if (payload.name !== undefined) {
    if (!payload.name.trim() || payload.name.trim().length < 2) {
      return { valid: false, error: 'El nombre oficial debe tener al menos 2 caracteres.' };
    }
  }

  // Role check
  if (payload.role !== undefined && payload.role !== 'admin' && payload.role !== 'judge') {
    return { valid: false, error: 'El rol debe ser "admin" o "judge".' };
  }

  // Password check (for new user)
  if (isNew) {
    if (!payload.password || payload.password.trim().length < 4) {
      return { valid: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
    }
  }

  // Role-specific constraints
  const role = payload.role;
  const status = payload.status || 'active';

  if (role === 'judge') {
    if (!payload.stationKey) {
      return { valid: false, error: 'Los jueces deben tener una estación asignada obligatoriamente.' };
    }
    if (!STATION_DEFINITIONS[payload.stationKey]) {
      return { valid: false, error: `La estación "${payload.stationKey}" no es válida.` };
    }

    // Station uniqueness check (only if activating or active)
    if (status === 'active') {
      const stationCheck = isStationTakenByActiveJudge(
        payload.stationKey,
        currentUsername || payload.username,
        existingUsers
      );
      if (stationCheck.taken && stationCheck.assignedJudge) {
        return {
          valid: false,
          error: `La estación ${STATION_DEFINITIONS[payload.stationKey].label} ya está asignada al juez activo "${stationCheck.assignedJudge.name}" (@${stationCheck.assignedJudge.username}). Desactive o reasigne ese juez primero.`,
        };
      }
    }
  } else if (role === 'admin') {
    if (payload.stationKey) {
      return { valid: false, error: 'Los administradores de mesa directiva no deben tener estaciones asignadas.' };
    }
  }

  return { valid: true };
}

/**
 * Creates a new user in the system.
 */
export function createUser(
  dto: CreateUserDto,
  currentAdmin: AuthUser
): { success: boolean; error?: string; user?: ManagedUser } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden crear usuarios.' };
  }

  const users = loadUsers();
  const validation = validateUserPayload(dto, true, users);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const cleanUsername = normalizeUsername(dto.username);
  const stationDef = dto.role === 'judge' && dto.stationKey ? getStationDefinition(dto.stationKey) : undefined;

  const newUser: ManagedUser = {
    username: cleanUsername,
    name: dto.name.trim(),
    role: dto.role,
    passwordHash: dto.password.trim(),
    status: dto.status || 'active',
    stationKey: dto.role === 'judge' ? dto.stationKey : undefined,
    stationName: stationDef?.name,
    stationType: stationDef?.type,
    maxPoints: stationDef?.maxPoints,
    challengeName: stationDef?.challengeName,
    challengeDescription: stationDef?.challengeDescription,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);

  appendAuditLog({
    teamId: 0,
    room: 'Panel Administrativo',
    action: `Usuario creado [@${newUser.username} - ${newUser.name}] (Rol: ${newUser.role.toUpperCase()}${
      newUser.stationKey ? ` | Estación: ${newUser.stationKey.toUpperCase()}` : ''
    })`,
    judgeName: currentAdmin.name,
  });

  return { success: true, user: newUser };
}

/**
 * Updates an existing user in the system.
 */
export function updateUser(
  username: string,
  dto: UpdateUserDto,
  currentAdmin: AuthUser
): { success: boolean; error?: string; user?: ManagedUser } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden modificar usuarios.' };
  }

  const users = loadUsers();
  const user = findUserByUsername(username, users);
  if (!user) {
    return { success: false, error: `Usuario "${username}" no encontrado.` };
  }

  const newRole = dto.role || user.role;
  const newStatus = dto.status || user.status;
  const newStationKey = newRole === 'judge' ? (dto.stationKey !== undefined ? dto.stationKey : user.stationKey) : undefined;

  // Protect last admin from changing role or deactivating
  if (user.role === 'admin' && (newRole !== 'admin' || newStatus === 'inactive')) {
    const otherActiveAdmins = users.filter(
      (u) => u.role === 'admin' && u.status === 'active' && normalizeUsername(u.username) !== normalizeUsername(username)
    );
    if (otherActiveAdmins.length === 0) {
      return {
        success: false,
        error: 'Operación bloqueada: no es posible cambiar el rol o desactivar al único administrador activo del sistema.',
      };
    }
  }

  const validation = validateUserPayload(
    {
      name: dto.name,
      role: newRole,
      status: newStatus,
      stationKey: newStationKey,
    },
    false,
    users,
    username
  );

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const stationDef = newRole === 'judge' && newStationKey ? getStationDefinition(newStationKey) : undefined;

  const updatedUser: ManagedUser = {
    ...user,
    name: dto.name !== undefined ? dto.name.trim() : user.name,
    role: newRole,
    status: newStatus,
    stationKey: newStationKey,
    stationName: stationDef?.name,
    stationType: stationDef?.type,
    maxPoints: stationDef?.maxPoints,
    challengeName: stationDef?.challengeName,
    challengeDescription: stationDef?.challengeDescription,
    updatedAt: new Date().toISOString(),
  };

  const updatedUsers = users.map((u) => (normalizeUsername(u.username) === normalizeUsername(username) ? updatedUser : u));
  saveUsers(updatedUsers);

  appendAuditLog({
    teamId: 0,
    room: 'Panel Administrativo',
    action: `Usuario actualizado [@${updatedUser.username} - ${updatedUser.name}] (Rol: ${updatedUser.role.toUpperCase()} | Estado: ${updatedUser.status.toUpperCase()}${
      updatedUser.stationKey ? ` | Estación: ${updatedUser.stationKey.toUpperCase()}` : ''
    })`,
    judgeName: currentAdmin.name,
  });

  return { success: true, user: updatedUser };
}

/**
 * Changes a user's password without exposing it in logs.
 */
export function changeUserPassword(
  username: string,
  newPassword: string,
  currentAdmin: AuthUser
): { success: boolean; error?: string } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden cambiar contraseñas.' };
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, error: 'La nueva contraseña debe contener al menos 4 caracteres.' };
  }

  const users = loadUsers();
  const user = findUserByUsername(username, users);
  if (!user) {
    return { success: false, error: `Usuario "${username}" no encontrado.` };
  }

  const updatedUsers = users.map((u) =>
    normalizeUsername(u.username) === normalizeUsername(username)
      ? { ...u, passwordHash: newPassword.trim(), updatedAt: new Date().toISOString() }
      : u
  );

  saveUsers(updatedUsers);

  // Security requirement: Never write plaintext password into audit logs!
  appendAuditLog({
    teamId: 0,
    room: 'Panel Administrativo',
    action: `Contraseña restablecida exitosamente para el usuario [@${user.username} - ${user.name}]`,
    judgeName: currentAdmin.name,
  });

  return { success: true };
}

/**
 * Toggles a user's active/inactive status with security guards.
 */
export function toggleUserStatus(
  username: string,
  currentAdmin: AuthUser
): { success: boolean; error?: string; newStatus?: UserStatus } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden cambiar el estado de usuarios.' };
  }

  const users = loadUsers();
  const user = findUserByUsername(username, users);
  if (!user) {
    return { success: false, error: `Usuario "${username}" no encontrado.` };
  }

  const targetStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';

  // Guard: Cannot deactivate the only active admin
  if (user.role === 'admin' && targetStatus === 'inactive') {
    const otherActiveAdmins = users.filter(
      (u) => u.role === 'admin' && u.status === 'active' && normalizeUsername(u.username) !== normalizeUsername(username)
    );
    if (otherActiveAdmins.length === 0) {
      return {
        success: false,
        error: 'Operación denegada: no es posible desactivar al único administrador activo del sistema.',
      };
    }
  }

  // Guard: If activating a judge, check if station is already taken by another active judge
  if (user.role === 'judge' && targetStatus === 'active' && user.stationKey) {
    const stationCheck = isStationTakenByActiveJudge(user.stationKey, username, users);
    if (stationCheck.taken && stationCheck.assignedJudge) {
      return {
        success: false,
        error: `No se puede reactivar al juez: la estación ${STATION_DEFINITIONS[user.stationKey].label} ya está asignada al juez activo "${stationCheck.assignedJudge.name}". Reasigne primero la estación.`,
      };
    }
  }

  const updatedUsers = users.map((u) =>
    normalizeUsername(u.username) === normalizeUsername(username)
      ? { ...u, status: targetStatus, updatedAt: new Date().toISOString() }
      : u
  );

  saveUsers(updatedUsers);

  appendAuditLog({
    teamId: 0,
    room: 'Panel Administrativo',
    action: `Estado de usuario modificado: [@${user.username} - ${user.name}] marcado como ${targetStatus.toUpperCase()}`,
    judgeName: currentAdmin.name,
  });

  return { success: true, newStatus: targetStatus };
}

/**
 * Deletes a user with safeguards for administrators.
 */
export function deleteUser(
  username: string,
  currentAdmin: AuthUser
): { success: boolean; error?: string } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden eliminar usuarios.' };
  }

  const users = loadUsers();
  const user = findUserByUsername(username, users);
  if (!user) {
    return { success: false, error: `Usuario "${username}" no encontrado.` };
  }

  // Guard: Cannot delete the only administrator
  if (user.role === 'admin') {
    const totalAdmins = users.filter((u) => u.role === 'admin');
    if (totalAdmins.length <= 1) {
      return {
        success: false,
        error: 'Operación denegada: no es posible eliminar al único administrador del sistema.',
      };
    }
  }

  const updatedUsers = users.filter((u) => normalizeUsername(u.username) !== normalizeUsername(username));
  saveUsers(updatedUsers);

  appendAuditLog({
    teamId: 0,
    room: 'Panel Administrativo',
    action: `Usuario eliminado [@${user.username} - ${user.name}] (Rol: ${user.role.toUpperCase()})`,
    judgeName: currentAdmin.name,
  });

  return { success: true };
}

/**
 * Converts a ManagedUser to an AuthUser session object.
 */
export function toAuthUser(user: ManagedUser): AuthUser {
  if (user.role === 'admin') {
    return {
      username: user.username,
      name: user.name,
      role: 'admin',
      status: user.status,
    };
  }

  return {
    username: user.username,
    name: user.name,
    role: 'judge',
    status: user.status,
    stationKey: user.stationKey,
    stationName: user.stationName,
    stationType: user.stationType,
    maxPoints: user.maxPoints,
    challengeName: user.challengeName,
    challengeDescription: user.challengeDescription,
  };
}
