const ACCOUNT_KEY = "projeto-190-accounts-v1";
const SESSION_KEY = "projeto-190-session-v1";

export async function createAccount({ username, password, confirmation }) {
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");
  const cleanConfirmation = String(confirmation || "");

  if (!cleanUsername) return { ok: false, reason: "Informe um usuario." };
  if (!cleanPassword) return { ok: false, reason: "Informe uma senha." };
  if (cleanPassword !== cleanConfirmation) return { ok: false, reason: "As senhas precisam ser iguais." };

  const store = readAccountStore();
  const exists = store.profiles.some((profile) => (
    !profile.isGuest && profile.username?.toLowerCase() === cleanUsername.toLowerCase()
  ));
  if (exists) return { ok: false, reason: "Esse usuario ja existe." };

  const now = Date.now();
  const salt = createId("salt");
  const profile = {
    id: createId("player"),
    username: cleanUsername,
    passwordHash: await hashPassword(cleanPassword, salt),
    passwordSalt: salt,
    isGuest: false,
    displayName: "",
    characterId: null,
    createdAt: now,
    lastLoginAt: now,
    lastSeenAt: now,
    lastMap: "city",
    lastPositionX: 120,
    lastPositionY: 0,
    factionId: null
  };

  store.profiles.push(profile);
  writeAccountStore(store);
  const session = activateSession(profile);
  return { ok: true, profile: publicProfile(profile), session };
}

export async function loginAccount({ username, password }) {
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");
  if (!cleanUsername) return { ok: false, reason: "Informe o usuario." };
  if (!cleanPassword) return { ok: false, reason: "Informe a senha." };

  const store = readAccountStore();
  const profile = store.profiles.find((candidate) => (
    !candidate.isGuest && candidate.username?.toLowerCase() === cleanUsername.toLowerCase()
  ));
  if (!profile) return { ok: false, reason: "Usuario ou senha invalido." };

  const expected = await hashPassword(cleanPassword, profile.passwordSalt || "");
  if (expected !== profile.passwordHash) return { ok: false, reason: "Usuario ou senha invalido." };

  profile.lastLoginAt = Date.now();
  profile.lastSeenAt = profile.lastLoginAt;
  writeAccountStore(store);
  const session = activateSession(profile);
  return { ok: true, profile: publicProfile(profile), session };
}

export function createGuestSession() {
  const store = readAccountStore();
  const now = Date.now();
  const profile = {
    id: createId("guest"),
    username: "",
    passwordHash: "",
    passwordSalt: "",
    isGuest: true,
    displayName: "",
    characterId: null,
    createdAt: now,
    lastLoginAt: now,
    lastSeenAt: now,
    lastMap: "city",
    lastPositionX: 120,
    lastPositionY: 0,
    factionId: null
  };

  store.profiles.push(profile);
  writeAccountStore(store);
  const session = activateSession(profile);
  return { ok: true, profile: publicProfile(profile), session };
}

export function getActiveProfile() {
  const session = readSession();
  if (!session?.playerId) return null;
  const profile = findProfile(session.playerId);
  return profile ? publicProfile(profile) : null;
}

export function clearActiveSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateProfile(profileId, changes) {
  const store = readAccountStore();
  const profile = store.profiles.find((candidate) => candidate.id === profileId);
  if (!profile) return null;

  Object.assign(profile, {
    ...changes,
    id: profile.id,
    username: profile.username,
    passwordHash: profile.passwordHash,
    passwordSalt: profile.passwordSalt,
    isGuest: profile.isGuest,
    lastSeenAt: Date.now()
  });
  writeAccountStore(store);
  return publicProfile(profile);
}

export function syncProfileFromState(profileId, state) {
  if (!profileId || !state?.player) return null;
  return updateProfile(profileId, {
    displayName: state.player.displayName || "",
    characterId: state.selectedPlayerId || state.player.characterId || null,
    lastMap: state.scene || "city",
    lastPositionX: Math.round(Number(state.run?.playerX || 120)),
    lastPositionY: 0,
    factionId: state.player.factionId || null
  });
}

export function applyProfileToState(state, profile) {
  if (!state?.player || !profile) return state;
  state.player.playerId = profile.id;
  state.player.username = profile.username || "";
  state.player.isGuest = Boolean(profile.isGuest);
  state.player.displayName = profile.displayName || "";
  state.player.characterId = profile.characterId || state.selectedPlayerId || null;
  state.player.factionId = profile.factionId || state.player.factionId || null;
  if (profile.characterId) state.selectedPlayerId = profile.characterId;
  return state;
}

export function validateDisplayName(name) {
  const value = String(name || "").trim().replace(/\s+/g, " ");
  const length = [...value].length;
  if (!value) return { ok: false, reason: "Informe um nome de jogador." };
  if (length < 3) return { ok: false, reason: "O nome precisa ter pelo menos 3 caracteres." };
  if (length > 16) return { ok: false, reason: "O nome pode ter no maximo 16 caracteres." };
  if (!/^[\p{L}\p{N} _.-]+$/u.test(value)) {
    return { ok: false, reason: "Use letras, numeros, espacos, ponto, traco ou sublinhado." };
  }
  return { ok: true, value };
}

function activateSession(profile) {
  const session = {
    playerId: profile.id,
    sessionToken: createId("session"),
    isGuest: Boolean(profile.isGuest),
    createdAt: Date.now()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function findProfile(profileId) {
  return readAccountStore().profiles.find((profile) => profile.id === profileId) || null;
}

function readAccountStore() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return normalizeStore(parsed);
  } catch {
    return normalizeStore(null);
  }
}

function writeAccountStore(store) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(normalizeStore(store)));
}

function normalizeStore(store) {
  const profiles = Array.isArray(store?.profiles) ? store.profiles : [];
  return {
    version: 1,
    profiles: profiles.map((profile) => ({
      id: String(profile.id || createId("player")),
      username: String(profile.username || ""),
      passwordHash: String(profile.passwordHash || ""),
      passwordSalt: String(profile.passwordSalt || ""),
      isGuest: Boolean(profile.isGuest),
      displayName: String(profile.displayName || ""),
      characterId: profile.characterId || null,
      createdAt: Number(profile.createdAt || Date.now()),
      lastLoginAt: Number(profile.lastLoginAt || Date.now()),
      lastSeenAt: Number(profile.lastSeenAt || Date.now()),
      lastMap: profile.lastMap || "city",
      lastPositionX: Number(profile.lastPositionX || 120),
      lastPositionY: Number(profile.lastPositionY || 0),
      factionId: profile.factionId || null
    }))
  };
}

function publicProfile(profile) {
  return {
    id: profile.id,
    username: profile.username,
    isGuest: Boolean(profile.isGuest),
    displayName: profile.displayName || "",
    characterId: profile.characterId || null,
    createdAt: profile.createdAt,
    lastLoginAt: profile.lastLoginAt,
    lastMap: profile.lastMap || "city",
    lastPositionX: Number(profile.lastPositionX || 120),
    lastPositionY: Number(profile.lastPositionY || 0),
    factionId: profile.factionId || null
  };
}

async function hashPassword(password, salt) {
  const value = `${salt}:${password}`;
  if (crypto?.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return `sha256$${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  return `fallback$${simpleHash(value)}`;
}

function simpleHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function createId(prefix) {
  if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
