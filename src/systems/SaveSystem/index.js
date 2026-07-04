import { cloudRpc } from "../CloudSystem/index.js?v=city-stable-1";

export const SAVE_KEY = "projeto-190-save-v1";
export const VISUAL_KEY = "projeto-190-visual-v1";
export const WINDOW_LAYOUT_KEY = "projeto-190-window-layout-v1";
export const PROFILE_SAVE_PREFIX = "projeto-190-save-profile-v1:";

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Nao foi possivel carregar o jogo.", error);
    return null;
  }
}

export function saveGame(state) {
  try {
    const persisted = sanitizeStateForSave(state);
    localStorage.setItem(SAVE_KEY, JSON.stringify(persisted));
    return true;
  } catch (error) {
    console.warn("Nao foi possivel salvar o jogo.", error);
    return false;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function loadProfileGame(profileId) {
  try {
    const raw = localStorage.getItem(profileSaveKey(profileId));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Nao foi possivel carregar o jogo do perfil.", error);
    return null;
  }
}

export function saveProfileGame(profileId, state) {
  try {
    const persisted = sanitizeStateForSave(state);
    localStorage.setItem(profileSaveKey(profileId), JSON.stringify(persisted));
    return true;
  } catch (error) {
    console.warn("Nao foi possivel salvar o jogo do perfil.", error);
    return false;
  }
}

export async function loadCloudProfileGame(sessionToken) {
  if (!sessionToken) return null;
  const result = await cloudRpc("app_load_game", {
    p_session_token: sessionToken
  });
  if (!result?.ok) return null;
  return result.save || null;
}

export async function saveCloudProfileGame(sessionToken, state, options = {}) {
  if (!sessionToken || !state) return false;
  const persisted = sanitizeStateForSave(state);
  const result = await cloudRpc("app_save_game", {
    p_session_token: sessionToken,
    p_save_data: persisted
  }, {
    keepalive: Boolean(options.keepalive)
  });
  return Boolean(result?.ok);
}

export function clearProfileSave(profileId) {
  localStorage.removeItem(profileSaveKey(profileId));
}

function profileSaveKey(profileId) {
  return `${PROFILE_SAVE_PREFIX}${String(profileId || "local")}`;
}

export function sanitizeStateForSave(state) {
  const persisted = structuredClone(state);
  if (persisted.settings) persisted.settings.visualPreview = false;
  delete persisted.onlineCityPlayers;
  return persisted;
}

export function loadVisualCalibration() {
  try {
    const raw = localStorage.getItem(VISUAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Nao foi possivel carregar a calibracao visual.", error);
    return null;
  }
}

export function saveVisualCalibration(visual) {
  try {
    localStorage.setItem(VISUAL_KEY, JSON.stringify(visual));
    return true;
  } catch (error) {
    console.warn("Nao foi possivel salvar a calibracao visual.", error);
    return false;
  }
}

export function loadWindowLayout() {
  try {
    const raw = localStorage.getItem(WINDOW_LAYOUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Nao foi possivel carregar o layout das janelas.", error);
    return null;
  }
}

export function saveWindowLayout(layout) {
  try {
    localStorage.setItem(WINDOW_LAYOUT_KEY, JSON.stringify(layout));
    return true;
  } catch (error) {
    console.warn("Nao foi possivel salvar o layout das janelas.", error);
    return false;
  }
}

export function clearWindowLayout() {
  localStorage.removeItem(WINDOW_LAYOUT_KEY);
}
