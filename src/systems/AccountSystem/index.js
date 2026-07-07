import { cloudEnabled, cloudRpc } from "../CloudSystem/index.js?v=city-stable-1";

const ACCOUNT_KEY = "projeto-190-accounts-v1";
const SESSION_KEY = "projeto-190-session-v1";

export async function createAccount({ username, password, confirmation }) {
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");
  const cleanConfirmation = String(confirmation || "");

  if (!cleanUsername) return { ok: false, reason: "Informe um usuario." };
  if (!cleanPassword) return { ok: false, reason: "Informe uma senha." };
  if (cleanPassword !== cleanConfirmation) return { ok: false, reason: "As senhas precisam ser iguais." };

  if (cloudEnabled()) {
    const result = await cloudRpc("app_create_account", {
      p_username: cleanUsername,
      p_password: cleanPassword
    });
    if (!result?.ok) return { ok: false, reason: result?.reason || "Nao foi possivel criar a conta." };
    const profile = normalizePublicProfile(result.profile);
    const session = activateSession(profile, {
      cloud: true,
      sessionToken: result.sessionToken
    });
    cacheProfile(profile);
    return { ok: true, profile, session };
  }

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
  const publicData = publicProfile(profile);
  const session = activateSession(publicData);
  return { ok: true, profile: publicData, session };
}

export async function loginAccount({ username, password }) {
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");
  if (!cleanUsername) return { ok: false, reason: "Informe o usuario." };
  if (!cleanPassword) return { ok: false, reason: "Informe a senha." };

  if (cloudEnabled()) {
    const result = await cloudRpc("app_login", {
      p_username: cleanUsername,
      p_password: cleanPassword
    });
    if (!result?.ok) return { ok: false, reason: result?.reason || "Usuario ou senha invalido." };
    const profile = normalizePublicProfile(result.profile);
    const session = activateSession(profile, {
      cloud: true,
      sessionToken: result.sessionToken
    });
    cacheProfile(profile);
    return { ok: true, profile, session };
  }

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
  const publicData = publicProfile(profile);
  const session = activateSession(publicData);
  return { ok: true, profile: publicData, session };
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
  const publicData = publicProfile(profile);
  const session = activateSession(publicData);
  return { ok: true, profile: publicData, session };
}

export function getActiveProfile() {
  const session = readSession();
  if (session?.profile) return normalizePublicProfile(session.profile);
  if (!session?.playerId) return null;
  const profile = findProfile(session.playerId);
  return profile ? publicProfile(profile) : null;
}

export function clearActiveSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateProfile(profileId, changes) {
  const session = readSession();
  if (session?.cloud && session.sessionToken && session.profile?.id === profileId) {
    const profile = normalizePublicProfile({ ...session.profile, ...changes });
    writeSession({ ...session, profile });
    cacheProfile(profile);
    updateCloudProfile(session.sessionToken, changes).catch(() => {});
    return profile;
  }

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

function activateSession(profile, options = {}) {
  const publicData = normalizePublicProfile(profile);
  const session = {
    playerId: publicData.id,
    sessionToken: optionsSessionToken(options) || createId("session"),
    cloud: Boolean(options.cloud),
    isGuest: Boolean(publicData.isGuest),
    profile: publicData,
    createdAt: Date.now()
  };
  writeSession(session);
  return session;
}

function optionsSessionToken(options) {
  return typeof options?.sessionToken === "string" && options.sessionToken ? options.sessionToken : "";
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

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function cacheProfile(profile) {
  const publicData = normalizePublicProfile(profile);
  const store = readAccountStore();
  const index = store.profiles.findIndex((candidate) => candidate.id === publicData.id);
  const cached = {
    ...publicData,
    passwordHash: "",
    passwordSalt: ""
  };
  if (index >= 0) store.profiles[index] = { ...store.profiles[index], ...cached };
  else store.profiles.push(cached);
  writeAccountStore(store);
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
  return normalizePublicProfile({
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
  });
}

function normalizePublicProfile(profile) {
  return {
    id: String(profile?.id || ""),
    username: String(profile?.username || ""),
    isGuest: Boolean(profile?.isGuest),
    displayName: String(profile?.displayName || profile?.display_name || ""),
    characterId: profile?.characterId || profile?.character_id || null,
    createdAt: Number(profile?.createdAt || profile?.created_at || Date.now()),
    lastLoginAt: Number(profile?.lastLoginAt || profile?.last_login_at || Date.now()),
    lastMap: profile?.lastMap || profile?.last_map || "city",
    lastPositionX: Number(profile?.lastPositionX || profile?.last_position_x || 120),
    lastPositionY: Number(profile?.lastPositionY || profile?.last_position_y || 0),
    factionId: profile?.factionId || profile?.faction_id || null
  };
}

export function activeSessionToken() {
  const session = readSession();
  return session?.cloud ? String(session.sessionToken || "") : "";
}

export function hasCloudSession() {
  return Boolean(activeSessionToken());
}

export async function validateActiveSession() {
  const session = readSession();
  if (!session?.cloud || !session.sessionToken) return { ok: true, profile: getActiveProfile() };
  const result = await cloudRpc("app_get_profile", {
    p_session_token: session.sessionToken
  });
  if (!result?.ok) {
    if (result?.code !== "other_device" && result?.code !== "session_invalid") {
      return { ok: true, profile: getActiveProfile(), transient: true };
    }
    clearActiveSession();
    return {
      ok: false,
      code: result?.code || "session_invalid",
      reason: result?.reason || "Conta acessada em outro dispositivo."
    };
  }
  const profile = normalizePublicProfile(result.profile);
  writeSession({ ...session, profile, playerId: profile.id, isGuest: Boolean(profile.isGuest) });
  cacheProfile(profile);
  return { ok: true, profile };
}

async function updateCloudProfile(sessionToken, changes) {
  await cloudRpc("app_update_profile", {
    p_session_token: sessionToken,
    p_profile: profileChangesForCloud(changes)
  });
}

function profileChangesForCloud(changes = {}) {
  return {
    displayName: changes.displayName,
    characterId: changes.characterId,
    factionId: changes.factionId,
    lastMap: changes.lastMap,
    lastPositionX: changes.lastPositionX,
    lastPositionY: changes.lastPositionY
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
