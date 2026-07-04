import { PLAYERS } from "./data/players/index.js?v=bruno-yellow-1";
import { HIDEOUTS, IDLE_MAPS, MAPS } from "./data/maps/index.js?v=spawn-height-1";
import { NPC_TYPES } from "./data/enemies/index.js?v=npc-crops-1";
import { CITY_NPCS } from "./data/cityNpcs/index.js?v=petshop-portal-1";
import { CITY_PORTALS, HIDEOUT_PORTALS, IDLE_PORTALS } from "./data/cityPortals/index.js?v=petshop-portal-1";
import { HIDEOUT_ITEM_TIERS, HIDEOUT_ITEM_TYPES, hideoutItemCost, hideoutItemHeight, hideoutItemPlacementDefault, hideoutItemType } from "./data/hideoutItems/index.js?v=hideout-items-7";
import { CombatSystem } from "./systems/CombatSystem/index.js?v=spawn-height-1";
import { calculateStats, itemPower } from "./systems/EquipmentSystem/index.js?v=equipment-2";
import {
  buyDrugItem,
  DRUG_ITEMS,
  drugEffectText,
  drugInventoryCount,
  HIDEOUT_STAMINA_RECOVERY_CONFIG,
  normalizeDrugInventoryItem,
  useDrugInventoryItem,
  normalizeDrugState
} from "./systems/DrugSystem/index.js?v=drugs-2";
import { applyHospitalFee } from "./systems/PenaltySystem/index.js?v=hospital-fee-1";
import {
  createItem,
  craftAllInventory,
  craftInventoryItem,
  equipBestAvailable,
  equipFromInventory,
  getCraftPreview,
  itemSellValue,
  moveItem,
  normalizeInventoryItem,
  organizeInventory,
  sortInventoryByTier,
  sellAllInventory,
  sellInventoryItem,
  sellInventoryItemsByRarity,
  sellInventoryItems,
  sellNonFavoriteInventoryItems,
  unequipToInventory
} from "./systems/InventorySystem/index.js?v=drugs-2";
import { createNewGame, addLog } from "./systems/PlayerSystem/index.js?v=phase1-1";
import {
  applyProfileToState,
  createAccount,
  createGuestSession,
  getActiveProfile,
  loginAccount,
  activeSessionToken,
  syncProfileFromState,
  updateProfile,
  validateActiveSession,
  validateDisplayName
} from "./systems/AccountSystem/index.js?v=city-stable-1";
import {
  createFaction,
  editFaction,
  factionSnapshot,
  joinFaction,
  kickFactionMember,
  leaveFaction
} from "./systems/FactionSystem/index.js";
import {
  clearProfileSave,
  clearSave,
  clearWindowLayout,
  loadCloudProfileGame,
  loadProfileGame,
  loadVisualCalibration,
  loadWindowLayout,
  saveCloudProfileGame,
  saveProfileGame,
  saveGame,
  saveVisualCalibration,
  saveWindowLayout
} from "./systems/SaveSystem/index.js?v=city-stable-1";
import { OnlineSystem } from "./systems/OnlineSystem/index.js?v=city-presence-1";
import {
  buyReceptadorOffer,
  ensureReceptadorStock,
  getReceptadorRefreshCost,
  getReceptadorRefreshSecondsLeft,
  refreshReceptadorStock
} from "./systems/ShopSystem/index.js?v=balance-1";
import {
  CHARACTER_SELECT_TUTORIAL,
  TutorialOverlay,
  advanceTutorialStep,
  completeTutorial,
  expectedTutorialAssetPurchase,
  handleTutorialEvent,
  isTutorialTargetAllowed,
  normalizeTutorialState,
  skipTutorial,
  tutorialNudgeLine,
  tutorialStep
} from "./systems/TutorialSystem/index.js?v=npc-crops-1";
import {
  activateCar,
  activateHouse,
  activateLand,
  applyOfflinePassiveIncome,
  assetRequirementText,
  buyCar,
  buyHouse,
  buyLand,
  canStartRaid,
  canUnlockAsset,
  carOptions,
  collectPassiveVault,
  getOfflineLimitHours,
  getPassiveIncomePerMinute,
  getStaminaRechargeCost,
  houseOptions,
  landOptions,
  normalizeProgressionSystems,
  restNow,
  staminaRaidBlockedMessage,
  staminaPercent,
  staminaState,
  updatePassiveIncome
} from "./systems/StaminaSystem/index.js?v=phase1-1";
import { getCarConfig, getHouseConfig, getItemConfigById, getLandConfig } from "./data/balance/index.js?v=phase1-1";
import { SpriteRenderer } from "./ui/SpriteRenderer.js?v=bruno-yellow-1";
import {
  renderCharacterSelect,
  renderConfigWindow,
  renderInventoryWindow,
  renderVaultWindow,
  renderPanel
} from "./ui/WindowSystem.js?v=petshop-portal-1";

const elements = {
  canvas: document.querySelector("#game-canvas"),
  money: document.querySelector("#money-label"),
  level: document.querySelector("#level-label"),
  xp: document.querySelector("#xp-label"),
  stamina: document.querySelector("#stamina-label"),
  scene: document.querySelector("#scene-label"),
  mode: document.querySelector("#mode-label"),
  action: document.querySelector("#action-label"),
  enemy: document.querySelector("#enemy-label"),
  raidTimer: document.querySelector("#raid-timer"),
  raidTimerLabel: document.querySelector("#raid-timer-label"),
  raidCountLabel: document.querySelector("#raid-count-label"),
  raidSummary: document.querySelector("#raid-summary"),
  raidSummaryTitle: document.querySelector("#raid-summary-title"),
  raidSummaryMoney: document.querySelector("#raid-summary-money"),
  raidSummaryXp: document.querySelector("#raid-summary-xp"),
  raidSummaryTargets: document.querySelector("#raid-summary-targets"),
  raidSummaryCountdown: document.querySelector("#raid-summary-countdown"),
  raidSummaryItems: document.querySelector("#raid-summary-items"),
  raidRepeatButton: document.querySelector("#raid-repeat-button"),
  raidReturnButton: document.querySelector("#raid-return-button"),
  autoRepeatToggle: document.querySelector("#auto-repeat-toggle"),
  playerHpFill: document.querySelector("#player-hp-fill"),
  playerHp: document.querySelector("#player-hp-label"),
  survivalWarning: document.querySelector("#survival-warning"),
  windowLayer: document.querySelector("#window-layer"),
  inventoryWindow: document.querySelector("#inventory-window"),
  leftWindow: document.querySelector("#left-window"),
  rightWindow: document.querySelector("#right-window"),
  configWindow: document.querySelector("#config-window"),
  characterModal: document.querySelector("#character-modal"),
  characterGrid: document.querySelector("#character-grid"),
  choiceModal: document.querySelector("#choice-modal"),
  choiceText: document.querySelector("#choice-text"),
  choiceWarning: document.querySelector("#choice-warning"),
  fleeButton: document.querySelector("#flee-button"),
  fightButton: document.querySelector("#fight-button"),
  hospitalModal: document.querySelector("#hospital-modal"),
  hospitalTitle: document.querySelector("#hospital-title"),
  hospitalText: document.querySelector("#hospital-text"),
  hospitalFee: document.querySelector("#hospital-fee"),
  hospitalClose: document.querySelector("#hospital-close"),
  deathFlash: document.querySelector("#death-flash"),
  saveButton: document.querySelector("#save-button"),
  masterToggle: document.querySelector("#master-toggle"),
  bottomDock: document.querySelector(".bottom-dock"),
  authModal: document.querySelector("#auth-modal"),
  authPanel: document.querySelector("#auth-panel"),
  nameModal: document.querySelector("#name-modal"),
  nameForm: document.querySelector("#name-form"),
  playerNameInput: document.querySelector("#player-name-input"),
  nameError: document.querySelector("#name-error"),
  tutorialPanel: document.querySelector("#tutorial-panel"),
  sceneTransition: document.querySelector("#scene-transition"),
  sceneTransitionText: document.querySelector("#scene-transition-text"),
  toastRegion: document.querySelector("#toast-region")
};

const renderer = new SpriteRenderer(elements.canvas);
let state = null;
let combat = null;
let online = null;
let activeCenter = false;
let activeLeft = null;
let activeRight = null;
let lastTime = performance.now();
let saveTimer = 0;
let editorMode = false;
let previewTool = "all";
let windowLayout = null;
let animationTestLoop = null;
let editorBarClosed = false;
let activeCityNpc = null;
let activeCityPortalId = null;
let shopMode = "talk";
let activeCityNpcGreeting = "";
let pendingSellIndexes = new Set();
let pendingCraftIndex = null;
let hideoutItemDrag = null;
let stageHoldMove = null;
let keyboardMoveKeys = new Set();
let toastTimer = null;
let activeProfile = null;
let bootOptions = null;
let characterSelectionMode = "new";
let tutorialOverlay = null;
let characterTutorialVisible = false;
let lastTutorialSideEffectStep = null;
let cloudSavePending = false;
let sessionCheckTimer = 0;
let sessionCheckInFlight = false;

const STAGE_HOLD_DELAY_MS = 180;
const STAGE_HOLD_MOVE_THRESHOLD = 7;
const HOLD_WALK_LEFT_WORLD_X = -100000;
const HOLD_WALK_RIGHT_WORLD_X = 100000;
const BACKPACK_PAGE_SIZE = 36;
const BACKPACK_PAGE_COUNT = 4;
const BACKPACK_TOTAL_SLOTS = BACKPACK_PAGE_SIZE * BACKPACK_PAGE_COUNT;
const PERSONAL_VAULT_SLOTS = 36;
const ICON_TEST_RARITIES = ["comum", "incomum", "raro", "epico", "lendario", "mestre"];
const KEYBOARD_MOVE_KEYS = new Map([
  ["a", "left"],
  ["arrowleft", "left"],
  ["d", "right"],
  ["arrowright", "right"]
]);
const KEYBOARD_INTERACT_KEYS = new Set([" "]);
const HIDEOUT_REST_DISTANCE = HIDEOUT_STAMINA_RECOVERY_CONFIG.restDistance;
const HIDEOUT_REST_FAST_HP_PER_SECOND = 0.1;
const HIDEOUT_REST_SLOW_HP_PER_SECOND = 0.006;
const HIDEOUT_REST_FAST_STAMINA_PER_SECOND = HIDEOUT_STAMINA_RECOVERY_CONFIG.nearHousePerMinute / 60;
const HIDEOUT_REST_SLOW_STAMINA_PER_SECOND = HIDEOUT_STAMINA_RECOVERY_CONFIG.awayPerMinute / 60;

await renderer.load();
await boot();
requestAnimationFrame(tick);

async function boot() {
  const params = new URLSearchParams(location.search);
  const weaponIconTestMode = params.get("weaponIcons") === "1" || params.get("weapon-icons") === "1";
  const armorIconTestMode = params.get("armorIcons") === "1" || params.get("armor-icons") === "1";
  const gloveIconTestMode = params.get("gloveIcons") === "1" || params.get("glove-icons") === "1" || params.get("glovesIcons") === "1" || params.get("gloves-icons") === "1";
  const previewMode = params.get("preview") === "1" || weaponIconTestMode || armorIconTestMode || gloveIconTestMode;
  const newCharacterMode = params.get("new") === "1" && !previewMode;
  editorMode = params.get("editor") === "1";
  previewTool = params.get("tool") || "all";
  windowLayout = normalizeWindowLayout(loadWindowLayout());
  document.body.classList.toggle("layout-editor-mode", editorMode);
  document.documentElement.classList.toggle("hideout-focus", previewMode && previewTool === "hideout");

  bootOptions = {
    params,
    previewMode,
    newCharacterMode,
    weaponIconTestMode,
    armorIconTestMode,
    gloveIconTestMode
  };

  if (previewMode) {
    state = createNewGame("iris");
    startLoadedGame({ previewMode: true });
    return;
  }

  activeProfile = getActiveProfile();
  if (activeProfile) {
    const sessionResult = await validateActiveSession();
    if (!sessionResult.ok) {
      activeProfile = null;
      showAuthScreen("home", sessionResult.reason || "Conta acessada em outro dispositivo.");
      return;
    }
    activeProfile = sessionResult.profile || activeProfile;
  }
  showAuthScreen("home");
}

async function continueAfterAuth(options = {}) {
  hideAuthScreen();
  const shouldStartNew = Boolean(options.newGame);

  if (shouldStartNew && activeProfile?.id) {
    clearProfileSave(activeProfile.id);
    activeProfile = updateProfile(activeProfile.id, { characterId: null }) || activeProfile;
    if (new URLSearchParams(location.search).get("new") === "1") {
      history.replaceState(null, "", location.pathname);
    }
  }

  state = !shouldStartNew && activeProfile?.id ? await loadSavedGameForActiveProfile() : null;

  if (state) hydrateProfileFromLoadedState();
  advanceStartupFlow();
}

async function loadSavedGameForActiveProfile() {
  const token = activeSessionToken();
  if (token) {
    const cloudState = await loadCloudProfileGame(token);
    if (cloudState) {
      saveProfileGame(activeProfile.id, cloudState);
      return cloudState;
    }
  }
  return loadProfileGame(activeProfile.id);
}

function hydrateProfileFromLoadedState() {
  if (!activeProfile?.id || !state?.player) return;
  const changes = {};
  if (!activeProfile.displayName && state.player.displayName) changes.displayName = state.player.displayName;
  if (!activeProfile.characterId && state.selectedPlayerId) changes.characterId = state.selectedPlayerId;
  if (!activeProfile.factionId && state.player.factionId) changes.factionId = state.player.factionId;
  if (Object.keys(changes).length) {
    activeProfile = updateProfile(activeProfile.id, changes) || activeProfile;
  }
}

function advanceStartupFlow() {
  if (!activeProfile?.displayName) {
    showNameModal();
    return;
  }

  if (!state && !activeProfile.characterId) {
    showCharacterSelection("new");
    return;
  }

  if (!state && activeProfile.characterId) {
    state = createNewGame(activeProfile.characterId);
  }

  if (!activeProfile.characterId) {
    showCharacterSelection("existing");
    return;
  }

  startLoadedGame();
}

function startLoadedGame(options = {}) {
  const previewMode = Boolean(options.previewMode || bootOptions?.previewMode);
  const params = bootOptions?.params || new URLSearchParams(location.search);
  applyProfileToState(state, activeProfile);
  normalizeState();
  applyProfileToState(state, activeProfile);
  applyVisualCalibration();
  state.settings.visualPreview = previewMode;
  if (previewMode) completeTutorial(state);
  if (previewMode) applyHideoutPreviewParams(params);
  if (previewMode && previewTool !== "hideout") ensureAnimationTestBar();
  setupCombat();

  if (previewMode) {
    if (params.get("scene") === "hideout") {
      combat.enterHideout(Number(params.get("hideoutTier") || params.get("tier") || state.player.hideoutTier || 1));
    } else {
      combat.enterCity();
    }
  }

  if (bootOptions?.weaponIconTestMode) applyEquipmentIconTestInventory("weapon");
  if (bootOptions?.armorIconTestMode) applyEquipmentIconTestInventory("body");
  if (bootOptions?.gloveIconTestMode) applyEquipmentIconTestInventory("hands");

  hideAuthScreen();
  hideNameModal();
  document.body.classList.remove("auth-pending");
  renderAll();
  if (!previewMode) {
    persistGame();
    online?.connect();
  }
}

function completeCharacterSelection(playerId) {
  hideCharacterSelectTutorial();
  if (activeProfile?.id) {
    activeProfile = updateProfile(activeProfile.id, { characterId: playerId }) || activeProfile;
  }

  if (state && characterSelectionMode === "existing") {
    state.selectedPlayerId = playerId;
    state.player.characterId = playerId;
  } else {
    state = createNewGame(playerId);
  }

  hideCharacterSelection();
  startLoadedGame();
}

function showCharacterSelection(mode = "new") {
  characterSelectionMode = mode;
  document.body.classList.add("character-selecting");
  elements.characterModal.classList.remove("hidden", "is-leaving");
  renderCharacterSelect(elements.characterGrid, renderer, completeCharacterSelection);
  renderer.draw(state || createNewGame("iris"), playerRowForState(state || createNewGame("iris")));
  if (mode === "new") showCharacterSelectTutorial();
  else hideCharacterSelectTutorial();
}

function hideCharacterSelection() {
  hideCharacterSelectTutorial();
  requestAnimationFrame(() => {
    elements.characterModal.classList.add("is-leaving");
    window.setTimeout(() => {
      elements.characterModal.classList.add("hidden");
      elements.characterModal.classList.remove("is-leaving");
      document.body.classList.remove("character-selecting");
    }, 380);
  });
}

function showAuthScreen(mode = "home", message = "") {
  document.body.classList.add("auth-pending");
  elements.authModal.classList.remove("hidden");
  elements.authPanel.innerHTML = authTemplate(mode, message);
  bindAuthScreen(mode);
}

function hideAuthScreen() {
  elements.authModal.classList.add("hidden");
}

function authTemplate(mode, message = "") {
  if (mode === "login") {
    return `
      <span class="eyebrow">Projeto 190 Online</span>
      <h1 id="auth-title">Entrar com usuario e senha</h1>
      <form class="auth-form" data-auth-login>
        <label><span>Usuario</span><input name="username" autocomplete="username"></label>
        <label><span>Senha</span><input name="password" type="password" autocomplete="current-password"></label>
        ${authError(message)}
        <div class="auth-actions">
          <button type="submit" class="primary-action">Entrar</button>
          <button type="button" class="secondary-action" data-auth-mode="home">Voltar</button>
        </div>
      </form>
    `;
  }

  if (mode === "create") {
    return `
      <span class="eyebrow">Projeto 190 Online</span>
      <h1 id="auth-title">Criar conta</h1>
      <form class="auth-form" data-auth-create>
        <label><span>Usuario</span><input name="username" autocomplete="username"></label>
        <label><span>Senha</span><input name="password" type="password" autocomplete="new-password"></label>
        <label><span>Confirmar senha</span><input name="confirmation" type="password" autocomplete="new-password"></label>
        ${authError(message)}
        <div class="auth-actions">
          <button type="submit" class="primary-action">Criar conta</button>
          <button type="button" class="secondary-action" data-auth-mode="home">Voltar</button>
        </div>
      </form>
    `;
  }

  if (mode === "guest") {
    return `
      <span class="eyebrow">Visitante</span>
      <h1 id="auth-title">Jogar sem login?</h1>
      <p class="auth-copy">Jogar sem login pode fazer voce perder seu progresso se trocar de aparelho, limpar o navegador ou reinstalar o jogo. Quer continuar mesmo assim?</p>
      ${authError(message)}
      <div class="auth-actions">
        <button type="button" class="primary-action" data-auth-guest-confirm>Continuar sem login</button>
        <button type="button" class="secondary-action" data-auth-mode="home">Voltar</button>
      </div>
    `;
  }

  return `
    <span class="eyebrow">Projeto 190 Online</span>
    <h1 id="auth-title">Entrar no jogo</h1>
    <p class="auth-copy">Use uma conta para manter seu progresso ou entre como visitante neste aparelho.</p>
    ${authError(message)}
    <div class="auth-choice-list">
      ${activeProfile ? `<button type="button" class="primary-action" data-auth-continue>Continuar como ${escapeHtml(activeProfile.displayName || activeProfile.username || "visitante")}</button>` : ""}
      <button type="button" class="primary-action" data-auth-mode="login">Entrar com usuario e senha</button>
      <button type="button" class="secondary-action" data-auth-mode="create">Criar conta</button>
      <button type="button" class="secondary-action" data-auth-mode="guest">Jogar sem login</button>
    </div>
  `;
}

function bindAuthScreen(mode) {
  elements.authPanel.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => showAuthScreen(button.dataset.authMode));
  });

  elements.authPanel.querySelector("[data-auth-continue]")?.addEventListener("click", async () => {
    activeProfile = getActiveProfile();
    if (!activeProfile) {
      showAuthScreen("home", "Sessao nao encontrada. Entre novamente.");
      return;
    }
    await continueAfterAuth({ newGame: bootOptions?.newCharacterMode });
  });

  elements.authPanel.querySelector("[data-auth-login]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await loginAccount(Object.fromEntries(new FormData(event.currentTarget).entries()));
    if (!result.ok) {
      showAuthScreen(mode, result.reason);
      return;
    }
    activeProfile = result.profile;
    await continueAfterAuth({ newGame: bootOptions?.newCharacterMode });
  });

  elements.authPanel.querySelector("[data-auth-create]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await createAccount(Object.fromEntries(new FormData(event.currentTarget).entries()));
    if (!result.ok) {
      showAuthScreen(mode, result.reason);
      return;
    }
    activeProfile = result.profile;
    await continueAfterAuth();
  });

  elements.authPanel.querySelector("[data-auth-guest-confirm]")?.addEventListener("click", async () => {
    const result = createGuestSession();
    if (!result.ok) {
      showAuthScreen(mode, result.reason);
      return;
    }
    activeProfile = result.profile;
    await continueAfterAuth();
  });
}

function authError(message) {
  return message ? `<p class="auth-error">${escapeHtml(message)}</p>` : `<p class="auth-error hidden"></p>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function showNameModal() {
  hideAuthScreen();
  elements.nameError.classList.add("hidden");
  elements.nameError.textContent = "";
  elements.playerNameInput.value = activeProfile?.displayName || "";
  elements.nameModal.classList.remove("hidden");
  window.setTimeout(() => elements.playerNameInput.focus(), 0);
}

function hideNameModal() {
  elements.nameModal.classList.add("hidden");
}

elements.nameForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = validateDisplayName(elements.playerNameInput.value);
  if (!result.ok) {
    elements.nameError.textContent = result.reason;
    elements.nameError.classList.remove("hidden");
    return;
  }
  if (activeProfile?.id) {
    activeProfile = updateProfile(activeProfile.id, { displayName: result.value }) || activeProfile;
  }
  if (state?.player) state.player.displayName = result.value;
  hideNameModal();
  advanceStartupFlow();
});

function setupCombat() {
  online?.disconnect();
  combat = new CombatSystem(state, {
    onChoice: (target) => showChoice(target),
    onPolice: (message) => {
      hideChoice();
      showToast(message);
    },
    onHospitalBill: (bill) => showHospitalBill(bill),
    onChoiceTimeout: () => hideChoice(),
    onToast: (message) => showToast(message),
    onChange: () => renderAll(),
    onRaidEnd: (message, finish) => fadeThen(message, finish),
    onRaidReturn: (summary) => dispatchTutorialEvent("raid_returned", { summary })
  });
  online = new OnlineSystem(state, {
    onToast: (message) => showToast(message),
    onChange: () => renderAll()
  });
}

function persistGame(options = {}) {
  if (!state) return false;
  let savedLocally = false;
  if (activeProfile?.id) {
    activeProfile = syncProfileFromState(activeProfile.id, state) || activeProfile;
    savedLocally = saveProfileGame(activeProfile.id, state);
  } else {
    savedLocally = saveGame(state);
  }
  const token = activeSessionToken();
  if (token && !state.settings?.visualPreview) {
    cloudSavePending = true;
    saveCloudProfileGame(token, state, { keepalive: Boolean(options.keepalive) })
      .catch(() => false)
      .finally(() => {
        cloudSavePending = false;
      });
  }
  return savedLocally;
}

function persistBeforeExit(event = null) {
  const started = persistGame({ keepalive: true });
  if (event && started && cloudSavePending) {
    event.preventDefault();
    event.returnValue = "Salvando progresso na nuvem.";
    return event.returnValue;
  }
  return undefined;
}

window.addEventListener("pagehide", () => persistGame({ keepalive: true }));
window.addEventListener("beforeunload", persistBeforeExit);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") persistGame({ keepalive: true });
});

function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (state && combat) {
    combat.update(dt);
    online?.update(dt);
    updatePassiveIncome(state, dt);
    updateHideoutRestRecovery(dt);
    updateTutorialCityNpcArrival();
    updatePendingCityNpcArrival();
    updatePendingCityPortalArrival();
    updatePendingHideoutPortalArrival();
    updatePendingIdlePortalArrival();
    updatePendingHideoutHouseArrival();
    renderer.draw(state, playerRow());
    syncHud();
    renderTutorial();
    saveTimer += dt;
    if (!state.settings.visualPreview && saveTimer > 8) {
      saveTimer = 0;
      persistGame();
    }
    if (!state.settings.visualPreview) updateSessionGuard(dt);
  }

  requestAnimationFrame(tick);
}

function updateSessionGuard(dt) {
  if (!activeSessionToken() || sessionCheckInFlight) return;
  sessionCheckTimer += dt;
  if (sessionCheckTimer < 4) return;
  sessionCheckTimer = 0;
  sessionCheckInFlight = true;
  validateActiveSession()
    .then((result) => {
      if (result?.ok) {
        activeProfile = result.profile || activeProfile;
        return;
      }
      handleRemoteSessionClosed(result?.reason || "Conta acessada em outro dispositivo.");
    })
    .finally(() => {
      sessionCheckInFlight = false;
    });
}

function handleRemoteSessionClosed(message) {
  persistGame({ keepalive: true });
  online?.disconnect();
  combat = null;
  online = null;
  state = null;
  activeProfile = null;
  activeCenter = false;
  activeLeft = null;
  activeRight = null;
  document.body.classList.add("auth-pending");
  elements.inventoryWindow.classList.add("hidden");
  elements.leftWindow.classList.add("hidden");
  elements.rightWindow.classList.add("hidden");
  elements.configWindow.classList.add("hidden");
  showAuthScreen("home", message);
}

function renderAll() {
  if (!state) return;
  applyTutorialSideEffects();
  syncHud();
  updateMasterToggle();
  updateWindowLayerState();
  renderer.draw(state, playerRow());

  elements.configWindow.classList.add("hidden");

  if (activeCenter) {
    renderInventory();
  } else {
    elements.inventoryWindow.classList.add("hidden");
  }

  if (activeLeft) {
    renderLeftPanel(activeLeft);
  } else {
    elements.leftWindow.classList.add("hidden");
  }

  if (activeRight) {
    renderRightPanel(activeRight);
  } else {
    elements.rightWindow.classList.add("hidden");
  }

  applyWindowLayout();
  if (editorMode) enableWindowEditor();
  if (state.settings.visualPreview) {
    if (previewTool === "hideout") {
      hideGeneralPreviewPanels();
    } else {
      ensureAnimationTestBar();
      ensureMapNpcTestPanel();
      updateAnimationTestBar();
      updateMapNpcTestPanel();
    }
    ensureHideoutItemEditorPanel();
  }
  updateHideoutItemEditorPanel();
  syncRaidSummary();
  renderCityShopPanel();
  renderTutorial();
}

function updateWindowLayerState() {
  elements.windowLayer.classList.toggle("has-center-window", activeCenter);
  elements.windowLayer.classList.toggle("has-left-window", Boolean(activeLeft));
  elements.windowLayer.classList.toggle("has-right-window", Boolean(activeRight));
}

function ensureTutorialOverlay() {
  if (tutorialOverlay) return tutorialOverlay;
  tutorialOverlay = new TutorialOverlay({
    root: document.body,
    resolveTargetRect: resolveTutorialTargetRect,
    resolveFrameRect: stageRect,
    onAdvance: (step) => {
      if (characterTutorialVisible && step?.id === CHARACTER_SELECT_TUTORIAL.id) {
        hideCharacterSelectTutorial();
        return;
      }
      advanceActiveTutorial();
    },
    onSkip: () => skipActiveTutorial(),
    onPassive: (step) => performTutorialPrimaryAction(step)
  });
  return tutorialOverlay;
}

function showCharacterSelectTutorial() {
  characterTutorialVisible = true;
  ensureTutorialOverlay().render(CHARACTER_SELECT_TUTORIAL);
}

function hideCharacterSelectTutorial() {
  characterTutorialVisible = false;
  if (!state) tutorialOverlay?.hide();
}

function renderTutorial() {
  if (characterTutorialVisible) {
    ensureTutorialOverlay().render(CHARACTER_SELECT_TUTORIAL);
    return;
  }
  if (state?.scene === "map") {
    tutorialOverlay?.hide();
    return;
  }
  ensureTutorialOverlay().render(tutorialStep(state));
}

function advanceActiveTutorial() {
  if (!state) return;
  commitTutorialChange(advanceTutorialStep(state));
}

function performTutorialPrimaryAction(step) {
  if (!state || !combat || !step?.actionRequired) {
    showToast(tutorialNudgeLine());
    return;
  }

  const action = step.actionRequired;
  if (action === "visit_npc_almeida") {
    moveToTutorialCityNpc("comerciante-itens");
    return;
  }
  if (action === "visit_npc_vendedor") {
    moveToTutorialCityNpc("npc-vendedor");
    return;
  }
  if (action === "click_npc_zeca") {
    moveToTutorialCityNpc("seu-zeca");
    return;
  }
  if (action === "buy_land_1") {
    buyTutorialAsset("land", 1);
    return;
  }
  if (action === "buy_house_1") {
    buyTutorialAsset("house", 1);
    return;
  }
  if (action === "buy_car_1") {
    buyTutorialAsset("car", 1);
    return;
  }
  if (action === "click_city_hideout_portal") {
    walkToTutorialCityPortal("hideout-door");
    return;
  }
  if (action === "click_hideout_house") {
    walkToTutorialHideoutHouse();
    return;
  }
  if (action === "click_hideout_return_portal") {
    walkToTutorialHideoutPortal("city-return");
    return;
  }
  if (action === "click_assault_portal") {
    walkToTutorialCityPortal("assaults");
    return;
  }
  if (action === "start_first_raid") {
    startRaid(MAPS[0]?.id);
    return;
  }

  showToast(tutorialNudgeLine());
}

function skipActiveTutorial() {
  if (!state) return;
  commitTutorialChange(skipTutorial(state));
}

function dispatchTutorialEvent(type, payload = {}, options = {}) {
  if (!state) return false;
  const result = handleTutorialEvent(state, { type, ...payload });
  return commitTutorialChange(result, options);
}

function commitTutorialChange(result, options = {}) {
  if (!result?.changed) return false;
  lastTutorialSideEffectStep = null;
  if (!state.settings?.visualPreview) persistGame();
  if (options.render !== false) renderAll();
  return true;
}

function applyTutorialSideEffects() {
  const step = tutorialStep(state);
  if (!step || state.settings?.visualPreview || lastTutorialSideEffectStep === step.id) return;
  lastTutorialSideEffectStep = step.id;

  if (step.id === "almeida_intro") {
    closeCityShopPanel({ render: false, force: true });
    closeMaster({ render: false, force: true });
    return;
  }

  if (step.id === "zeca_intro") {
    closeCityShopPanel({ render: false, force: true });
    closeMaster({ render: false, force: true });
    return;
  }

  if (step.id === "zeca_dialog_1") {
    if (state.scene === "city" && activeCityNpc?.id !== "seu-zeca") {
      openTutorialZecaShop("talk");
    }
    return;
  }

  if (step.id === "vendedor_intro") {
    closeCityShopPanel({ render: false, force: true });
    closeMaster({ render: false, force: true });
    return;
  }

  if (step.id === "zeca_buy_land") {
    openTutorialZecaShop("land");
    ensureTutorialAssetFunds("land", 1);
    return;
  }

  if (step.id === "zeca_buy_house") {
    openTutorialZecaShop("house");
    ensureTutorialAssetFunds("house", 1);
    return;
  }

  if (step.id === "zeca_buy_car") {
    openTutorialZecaShop("car");
    ensureTutorialAssetFunds("car", 1);
    return;
  }

  if (step.id === "hideout_portal_intro" || step.id === "hideout_portal_click") {
    closeCityShopPanel({ render: false, force: true });
    closeMaster({ render: false, force: true });
    return;
  }

  if (step.id === "hideout_storage_intro" || step.id === "hideout_house_click") {
    return;
  }

  if (step.id === "hideout_chest" || step.id === "hideout_vault") {
    activeCenter = true;
    activeRight = "vault";
    return;
  }

  if (step.id === "hideout_return_click") {
    closeMaster({ render: false, force: true });
    return;
  }

  if (step.id === "city_back_intro" || step.id === "assault_portal_click") {
    closeCityInteractions({ render: false, force: true });
    closeMaster({ render: false, force: true });
    return;
  }

  if (step.id === "assault_menu" || step.id === "assault_start_click") {
    activeCenter = true;
    activeLeft = "assaults";
  }
}

function ensureTutorialAssetFunds(type, tier) {
  const asset = type === "house"
    ? getHouseConfig(tier)
    : type === "car"
      ? getCarConfig(tier)
      : getLandConfig(tier);
  if (!asset || asset.price <= 0) return;
  const ownsAsset = type === "house"
    ? state.player.ownedHouses.includes(tier)
    : type === "car"
      ? state.player.ownedCars.includes(tier)
      : state.player.terrenosComprados.includes(tier);
  if (ownsAsset || state.player.money >= asset.price) return;

  const missing = asset.price - state.player.money;
  state.player.money += missing;
  state.tutorial.funding ||= {};
  state.tutorial.funding[`${type}:${tier}`] = (state.tutorial.funding[`${type}:${tier}`] || 0) + missing;
  addLog(state, `Seu Zeca adiantou ${formatMoney(missing)} para o tutorial.`);
  showToast(`Seu Zeca adiantou ${formatMoney(missing)} para o basico.`);
}

function moveToTutorialCityNpc(npcId, options = {}) {
  if (!state || !combat || state.scene !== "city" || state.run.mode !== "city") {
    showToast("Volte para a cidade para seguir o tutorial.");
    return;
  }
  const npc = CITY_NPCS.find((candidate) => candidate.id === npcId);
  if (!npc) return;
  closeCityInteractions({ render: false, force: true });
  closeMaster({ render: false, force: true });
  const approachOffset = (state.run.playerX || 0) <= npc.x ? -48 : 48;
  state.run.pendingCityNpcId = npc.id;
  state.run.pendingCityPortalId = null;
  combat.moveCityTo(npc.x + approachOffset);
  if (!options.silent) showToast(`Indo ate ${npc.name}.`);
}

function walkToTutorialCityPortal(portalId) {
  if (!state || !combat || state.scene !== "city" || state.run.mode !== "city") {
    showToast("Volte para a cidade para seguir o tutorial.");
    return;
  }
  const portal = CITY_PORTALS.find((candidate) => candidate.id === portalId);
  if (!portal) return;
  if (blockWrongTutorialTarget("city_portal", portal.id)) return;
  walkToCityPortal(portal);
}

function walkToTutorialHideoutPortal(portalId) {
  if (!state || !combat || state.scene !== "hideout" || state.run.mode !== "hideout") {
    showToast("Entre no esconderijo para seguir o tutorial.");
    return;
  }
  const portal = HIDEOUT_PORTALS.find((candidate) => candidate.id === portalId);
  if (!portal) return;
  if (blockWrongTutorialTarget("hideout_portal", portal.id)) return;
  walkToHideoutPortal(portal);
}

function walkToTutorialHideoutHouse() {
  if (!state || !combat || state.scene !== "hideout" || state.run.mode !== "hideout") {
    showToast("Entre no esconderijo para seguir o tutorial.");
    return;
  }
  if (blockWrongTutorialTarget("hideout_item", "house")) return;
  const placement = getHideoutItemPlacement("house");
  state.run.pendingHideoutPortalId = null;
  state.run.pendingHideoutItemId = "house";
  closeMaster({ render: false, force: true });
  combat.moveHideoutTo(placement.x);
  showToast("Indo ate a casa.");
}

function openTutorialZecaShop(mode = "talk") {
  const zeca = CITY_NPCS.find((candidate) => candidate.id === "seu-zeca");
  if (!zeca) return;
  closeCityPortalPanel({ render: false, force: true });
  closeMaster({ render: false, force: true });
  activeCityNpc = zeca;
  shopMode = mode;
  pendingSellIndexes.clear();
  pendingCraftIndex = null;
  if (state?.run) {
    state.run.pendingCityNpcId = null;
    state.run.pendingCityPortalId = null;
  }
}

function buyTutorialAsset(type, tier) {
  if (!state?.player) return;
  if (blockWrongTutorialTarget("asset", `${type}:${tier}`)) return;
  openTutorialZecaShop(type);
  ensureTutorialAssetFunds(type, tier);
  const result = type === "house"
    ? buyHouse(state.player, tier)
    : type === "car"
      ? buyCar(state.player, tier)
      : buyLand(state.player, tier);
  handleAssetBuy(result, type, tier);
}

function blockWrongTutorialTarget(targetType, targetId) {
  const step = tutorialStep(state);
  if (!step) return false;
  if (isTutorialRecoveryTargetAllowed(targetType, targetId)) return false;
  if (!step.actionRequired) {
    showToast(tutorialNudgeLine());
    return true;
  }
  if (isTutorialTargetAllowed(state, targetType, targetId)) return false;
  showToast(tutorialNudgeLine());
  return true;
}

function blockTutorialAmbientAction() {
  if (!tutorialStep(state)) return false;
  showToast(tutorialNudgeLine());
  return true;
}

function isTutorialRecoveryTargetAllowed(targetType, targetId) {
  if (targetType !== "city_npc" || targetId !== "seu-zeca") return false;
  return tutorialNeedsCityShopOpen();
}

function tutorialNeedsCityShopOpen() {
  const action = tutorialStep(state)?.actionRequired;
  return action === "open_land_shop" ||
    action === "buy_land_1" ||
    action === "buy_house_1" ||
    action === "buy_car_1";
}

function tutorialNeedsAssaultPanelOpen() {
  return tutorialStep(state)?.actionRequired === "start_first_raid";
}

function resolveTutorialTargetRect(target) {
  const fallback = stageTutorialRect();
  if (!target) return fallback;

  const selectorTargets = {
    character_grid: "#character-grid",
    character_modal: "#character-modal .character-stage-panel",
    city_shop_panel: "#city-shop-panel",
    shop_sell_all: '#city-shop-panel [data-shop-mode="sell-all-confirm"], #city-shop-panel [data-shop-confirm-all]',
    shop_craft: '#city-shop-panel [data-shop-mode="craft"], #city-shop-panel [data-craft-selected]',
    shop_buy: '#city-shop-panel [data-shop-mode="buy"], #city-shop-panel [data-buy-offer]',
    shop_land_mode: '#city-shop-panel [data-shop-mode="land"]',
    land_t1: '#city-shop-panel [data-buy-land="1"]',
    house_t1: '#city-shop-panel [data-buy-house="1"]',
    car_t1: '#city-shop-panel [data-buy-car="1"]',
    hideout_chest: "#right-window .vault-grid, #right-window .vault-cell",
    hideout_vault: "#right-window .vault-money-panel, #vault-money-input",
    first_assault: "#left-window .map-row, #left-window [data-enter-map]",
    first_assault_start: "#left-window [data-enter-map]"
  };

  if (target === "stage") return fallback;
  if (target === "npc_almeida") return cityNpcTutorialRect("comerciante-itens") || fallback;
  if (target === "npc_zeca") return cityNpcTutorialRect("seu-zeca") || fallback;
  if (target === "npc_vendedor") return cityNpcTutorialRect("npc-vendedor") || fallback;
  if (target === "city_shop_panel") return cityShopPanelTutorialRect(selectorTargets.city_shop_panel) || fallback;
  if (target === "portal_hideout") return cityPortalTargetRect("hideout-door") || fallback;
  if (target === "portal_assaults") return cityPortalTargetRect("assaults") || fallback;
  if (target === "portal_city_return") return hideoutPortalTargetRect("city-return") || fallback;
  if (target === "hideout_house") return hideoutItemTargetRect("house") || fallback;

  return domTargetRect(selectorTargets[target]) || fallback;
}

function cityShopPanelTutorialRect(selector) {
  const rect = domTargetRect(selector);
  if (!rect) return null;
  rect.hideTutorialMark = Boolean(activeCityNpc);
  return rect;
}

function cityNpcTutorialRect(npcId) {
  const rect = cityNpcTargetRect(npcId);
  if (!rect) return null;
  return {
    ...rect,
    hideTutorialMark: activeCityNpc?.id === npcId
  };
}

function domTargetRect(selector) {
  if (!selector) return null;
  const node = document.querySelector(selector);
  if (!node || node.closest(".hidden")) return null;
  const rect = node.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

function stageRect() {
  return elements.canvas?.getBoundingClientRect() || {
    left: window.innerWidth / 2 - 120,
    top: window.innerHeight / 2 - 80,
    width: 240,
    height: 160
  };
}

function stageTutorialRect() {
  const rect = stageRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    hideTutorialMark: true
  };
}

function cityNpcTargetRect(npcId) {
  if (!state || state.scene !== "city") return null;
  const npc = CITY_NPCS.find((candidate) => candidate.id === npcId);
  if (!npc) return null;
  const height = cityNpcHeight();
  return canvasWorldTargetRect(npc.x, cityGroundY() - height - 8, 68, height + 20);
}

function cityPortalTargetRect(portalId) {
  if (!state || state.scene !== "city") return null;
  const portal = CITY_PORTALS.find((candidate) => candidate.id === portalId);
  if (!portal) return null;
  const feetY = cityGroundY() + Number(portal.yOffset || 0);
  return canvasWorldTargetRect(portal.x, feetY - portal.height - 8, portal.width + 16, portal.height + 26);
}

function hideoutPortalTargetRect(portalId) {
  if (!state || state.scene !== "hideout") return null;
  const portal = HIDEOUT_PORTALS.find((candidate) => candidate.id === portalId);
  if (!portal) return null;
  const feetY = hideoutGroundY() + Number(portal.yOffset || 0);
  return canvasWorldTargetRect(portal.x, feetY - portal.height - 8, portal.width + 16, portal.height + 26);
}

function hideoutItemTargetRect(typeId) {
  if (!state || state.scene !== "hideout") return null;
  const bounds = renderer.lastHideoutItemBounds?.find((item) => item.typeId === typeId);
  if (bounds) return canvasRectToViewport(bounds.x, bounds.y, bounds.width, bounds.height);

  const placement = getHideoutItemPlacement(typeId);
  return canvasWorldTargetRect(placement.x, placement.y - placement.height, placement.height, placement.height);
}

function canvasWorldTargetRect(worldX, canvasTop, canvasWidth, canvasHeight) {
  const cameraWorld = renderer.cameraWorld(state);
  const screenX = renderer.worldToScreen(worldX, cameraWorld);
  return canvasRectToViewport(screenX - canvasWidth / 2, canvasTop, canvasWidth, canvasHeight);
}

function canvasRectToViewport(canvasX, canvasY, canvasWidth, canvasHeight) {
  const rect = stageRect();
  const scaleX = rect.width / elements.canvas.width;
  const scaleY = rect.height / elements.canvas.height;
  return {
    left: rect.left + canvasX * scaleX,
    top: rect.top + canvasY * scaleY,
    width: canvasWidth * scaleX,
    height: canvasHeight * scaleY
  };
}

function updateHideoutRestRecovery(dt) {
  if (!state?.player || !state?.run) return;
  if (state.scene !== "hideout" || state.run.mode !== "hideout") {
    state.run.hideoutRestHint = null;
    return;
  }

  normalizeProgressionSystems(state.player);
  const stats = calculateStats(state.player);
  const player = state.player;
  const currentHp = Math.max(0, Number(player.hp || 0));
  const hpPercent = stats.maxHp ? currentHp / stats.maxHp : 1;
  const staminaPercent = player.staminaMax ? Number(player.staminaAtual || 0) / player.staminaMax : 1;
  const placement = getHideoutItemPlacement("house", state.player.hideoutTier || 1);
  const distance = Math.abs((state.run.playerX || 0) - placement.x);
  const nearHouse = distance <= HIDEOUT_REST_DISTANCE;
  const shouldShowHouseHint = hpPercent < 0.6 || staminaPercent < 0.6 || Boolean(player.needsHideoutRest);

  state.run.nearHideoutHouse = nearHouse;
  state.run.hideoutRestHint = shouldShowHouseHint
    ? {
        near: nearHouse,
        text: nearHouse ? "Repousando..." : "Aproxime-se para repousar"
      }
    : null;

  const hpRate = stats.maxHp * (nearHouse ? HIDEOUT_REST_FAST_HP_PER_SECOND : HIDEOUT_REST_SLOW_HP_PER_SECOND);
  const staminaRate = nearHouse ? HIDEOUT_REST_FAST_STAMINA_PER_SECOND : HIDEOUT_REST_SLOW_STAMINA_PER_SECOND;
  const previousNeedsRest = Boolean(player.needsHideoutRest);

  if (currentHp < stats.maxHp) {
    player.hp = Math.min(stats.maxHp, Math.ceil(currentHp + hpRate * dt));
  }

  if (Number(player.staminaAtual || 0) < player.staminaMax) {
    player.staminaAtual = Math.min(player.staminaMax, Number(player.staminaAtual || 0) + staminaRate * dt);
  }

  if (player.needsHideoutRest && player.hp >= stats.maxHp * 0.6) {
    player.needsHideoutRest = false;
    if (previousNeedsRest) {
      addLog(state, "Voce ja consegue sair do repouso.");
      showToast("Voce ja consegue sair do repouso.");
    }
  }
}

function syncHud() {
  if (!state) return;
  const stats = calculateStats(state.player);
  const map = combat?.currentMap();
  const temporaryStay = state.run?.temporaryStay;
  normalizeProgressionSystems(state.player);
  const hpPercent = stats.maxHp ? Math.max(0, state.player.hp / stats.maxHp) : 0;

  elements.money.textContent = formatHudMoney(state.player.money);
  elements.level.textContent = String(state.player.level);
  elements.xp.textContent = `${formatHudNumber(state.player.xp)}/${formatHudNumber(state.player.nextXp)}`;
  if (elements.stamina) {
    elements.stamina.textContent = `${formatHudNumber(Math.floor(state.player.staminaAtual))}/${formatHudNumber(state.player.staminaMax)}`;
  }
  syncSurvivalWarning(stats, hpPercent);
  elements.scene.textContent = state.scene === "map" && map
    ? map.name
    : state.scene === "idle" && map
      ? map.name
    : state.scene === "hideout"
      ? "Esconderijo"
      : "Cidade";
  elements.mode.textContent = modeLabel(state.run.mode);
  elements.action.textContent = actionLabel(state.run.mode, map);
  elements.enemy.textContent = state.run.enemy
    ? `${state.run.enemy.name} NV ${state.run.enemy.level} | ${state.run.enemyHp}/${state.run.enemyMaxHp}`
    : "Sem alvo em combate";
  const isRaid = state.scene === "map" && state.run.raidTimeLeft > 0 && state.run.mode !== "returning" && !state.run.animationTest;
  const isTemporary = state.run.mode === "temporary" && temporaryStay;
  elements.raidTimer.classList.toggle("hidden", !isRaid && !isTemporary);
  if (isTemporary) {
    elements.raidTimerLabel.textContent = `${temporaryStay.label}: ${formatTime(temporaryStay.remaining)}`;
    elements.raidCountLabel.textContent = "Saida bloqueada";
  } else if (isRaid) {
    elements.raidTimerLabel.textContent = formatTime(state.run.raidTimeLeft);
    elements.raidCountLabel.textContent = `${remainingTargets(state)} / ${totalTargets(state)} alvos`;
  }
  elements.playerHpFill.style.width = `${Math.round(hpPercent * 100)}%`;
  elements.playerHp.textContent = `HP ${state.player.hp} / ${stats.maxHp}`;
  syncRaidSummary();
}

function syncSurvivalWarning(stats, hpPercent) {
  if (!elements.survivalWarning) return;
  const staminaPercentValue = state.player.staminaMax
    ? Number(state.player.staminaAtual || 0) / state.player.staminaMax
    : 1;
  const danger = hpPercent < 0.3 || staminaPercentValue < 0.3 || Boolean(state.player.needsHideoutRest);
  elements.survivalWarning.classList.toggle("hidden", !danger);
  if (!danger) return;

  if (state.scene === "idle" && state.run?.mode === "temporary") {
    elements.survivalWarning.textContent = temporaryStayText();
    return;
  }

  if (state.scene === "hideout") {
    elements.survivalWarning.textContent = state.run?.nearHideoutHouse
      ? "Repousando: vida e stamina recuperando rapidamente."
      : "Vida ou stamina baixa: aproxime-se da casa para repousar.";
    return;
  }

  if (state.player.needsHideoutRest || state.player.hp <= 0) {
    elements.survivalWarning.textContent = "Sem vida: volte ao esconderijo e repouse perto da casa.";
    return;
  }

  elements.survivalWarning.textContent = "Vida ou stamina baixa: repouse no esconderijo.";
}

function handleStagePointer(event) {
  if (!state || !combat) return;
  if (event.button !== undefined && event.button !== 0) return;
  if (state.scene === "hideout" && state.run.mode === "hideout") {
    const point = canvasPoint(event);
    if (handleHideoutHouseClick(point)) return;
    if (handleHideoutItemPointerDown(event)) return;
    const portal = findClickedHideoutPortal(point.x, point.y);
    if (portal) {
      if (blockWrongTutorialTarget("hideout_portal", portal.id)) return;
      walkToHideoutPortal(portal);
      return;
    }
    if (blockTutorialAmbientAction()) return;
    state.run.pendingHideoutPortalId = null;
    state.run.pendingHideoutItemId = null;
    combat.moveHideoutTo(renderer.screenToWorld(point.x, state));
    return;
  }
  if (state.scene === "idle" && ["idle", "temporary"].includes(state.run.mode)) {
    const point = canvasPoint(event);
    const portal = findClickedIdlePortal(point.x, point.y);
    if (portal) {
      walkToIdlePortal(portal);
      return;
    }
    state.run.pendingIdlePortalId = null;
    combat.moveIdleTo(renderer.screenToWorld(point.x, state));
    return;
  }
  if (state.scene !== "city" || state.run.mode !== "city") return;

  const point = canvasPoint(event);
  beginCityStageGesture(event, point);
}

function beginCityStageGesture(event, point) {
  clearCityStageGesture();
  event.preventDefault();

  stageHoldMove = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    latestPoint: point,
    pendingPortal: findClickedCityPortal(point.x, point.y),
    pendingNpc: findClickedCityNpc(point.x, point.y),
    isHoldWalking: false,
    timerId: window.setTimeout(activateCityHoldWalk, STAGE_HOLD_DELAY_MS)
  };

  elements.canvas.setPointerCapture?.(event.pointerId);
  document.addEventListener("pointermove", updateCityStageGesture, { passive: false });
  document.addEventListener("pointerup", finishCityStageGesture);
  document.addEventListener("pointercancel", cancelCityStageGesture);
}

function updateCityStageGesture(event) {
  if (!stageHoldMove || event.pointerId !== stageHoldMove.pointerId) return;
  stageHoldMove.latestPoint = canvasPoint(event);

  if (!stageHoldMove.isHoldWalking && cityStageGestureDistance(event) > STAGE_HOLD_MOVE_THRESHOLD) {
    activateCityHoldWalk();
  }

  if (stageHoldMove.isHoldWalking) {
    event.preventDefault();
    applyCityHoldWalk();
  }
}

function finishCityStageGesture(event) {
  if (!stageHoldMove || event.pointerId !== stageHoldMove.pointerId) return;
  stageHoldMove.latestPoint = canvasPoint(event);

  const gesture = stageHoldMove;
  clearCityStageGesture();

  if (gesture.isHoldWalking) {
    event.preventDefault();
    stopCityHoldWalk();
    return;
  }

  if (gesture.pendingPortal && cityStageGestureDistance(event, gesture) <= STAGE_HOLD_MOVE_THRESHOLD) {
    if (blockWrongTutorialTarget("city_portal", gesture.pendingPortal.id)) return;
    if (activeCityPortalId === gesture.pendingPortal.id) {
      closeCityPortalPanel();
      return;
    }
    walkToCityPortal(gesture.pendingPortal);
    return;
  }

  if (gesture.pendingNpc && cityStageGestureDistance(event, gesture) <= STAGE_HOLD_MOVE_THRESHOLD) {
    if (blockWrongTutorialTarget("city_npc", gesture.pendingNpc.id)) return;
    if (activeCityNpc?.id === gesture.pendingNpc.id) {
      closeCityShopPanel();
      return;
    }
    walkToCityNpc(gesture.pendingNpc);
    return;
  }

  if (blockTutorialAmbientAction()) return;
  closeCityInteractions();
  combat.moveCityTo(renderer.screenToWorld(gesture.latestPoint.x, state));
}

function cancelCityStageGesture(event) {
  if (stageHoldMove && event.pointerId === stageHoldMove.pointerId) {
    const wasWalking = stageHoldMove.isHoldWalking;
    clearCityStageGesture();
    if (wasWalking) stopCityHoldWalk();
  }
}

function clearCityStageGesture() {
  if (!stageHoldMove) return;
  window.clearTimeout(stageHoldMove.timerId);
  if (elements.canvas.hasPointerCapture?.(stageHoldMove.pointerId)) {
    elements.canvas.releasePointerCapture(stageHoldMove.pointerId);
  }
  document.removeEventListener("pointermove", updateCityStageGesture);
  document.removeEventListener("pointerup", finishCityStageGesture);
  document.removeEventListener("pointercancel", cancelCityStageGesture);
  stageHoldMove = null;
}

function cityStageGestureDistance(event, gesture = stageHoldMove) {
  if (!gesture) return 0;
  return Math.hypot(event.clientX - gesture.startClientX, event.clientY - gesture.startClientY);
}

function activateCityHoldWalk() {
  if (!stageHoldMove || stageHoldMove.isHoldWalking) return;
  if (blockTutorialAmbientAction()) {
    clearCityStageGesture();
    return;
  }
  stageHoldMove.isHoldWalking = true;
  window.clearTimeout(stageHoldMove.timerId);
  stageHoldMove.timerId = null;
  closeCityInteractions({ render: false });
  applyCityHoldWalk();
}

function applyCityHoldWalk() {
  if (!stageHoldMove || !stageHoldMove.isHoldWalking) return;
  if (!state || !combat || state.scene !== "city" || state.run.mode !== "city") return;

  const pointerWorldX = renderer.screenToWorld(stageHoldMove.latestPoint.x, state);
  const targetX = pointerWorldX >= (state.run.playerX || 0)
    ? HOLD_WALK_RIGHT_WORLD_X
    : HOLD_WALK_LEFT_WORLD_X;
  combat.moveCityTo(targetX);
}

function stopCityHoldWalk() {
  if (!state?.run) return;
  state.run.cityTargetX = null;
  state.run.pendingCityNpcId = null;
  state.run.pendingCityPortalId = null;
  state.run.playerAction = null;
  renderAll();
}

function handleGameKeyDown(event) {
  if (!state || isTypingTarget(event.target)) return;
  const key = event.key.toLowerCase();

  if (key === "escape") {
    if (closeCityInteractions()) {
      event.preventDefault();
    }
    return;
  }

  if (key === "i") {
    event.preventDefault();
    toggleMaster();
    return;
  }

  if (KEYBOARD_INTERACT_KEYS.has(key)) {
    event.preventDefault();
    interactWithNearestCityNpc();
    return;
  }

  if (!KEYBOARD_MOVE_KEYS.has(key)) return;
  event.preventDefault();
  keyboardMoveKeys.delete(key);
  keyboardMoveKeys.add(key);
  applyKeyboardMovement();
}

function handleGameKeyUp(event) {
  const key = event.key.toLowerCase();
  if (!KEYBOARD_MOVE_KEYS.has(key)) return;
  keyboardMoveKeys.delete(key);
  event.preventDefault();
  if (keyboardMoveKeys.size) {
    applyKeyboardMovement();
    return;
  }
  stopKeyboardMovement();
}

function applyKeyboardMovement() {
  if (!state || !combat || !keyboardMoveKeys.size) return;
  const lastKey = [...keyboardMoveKeys][keyboardMoveKeys.size - 1];
  const direction = KEYBOARD_MOVE_KEYS.get(lastKey);
  const targetX = direction === "left" ? HOLD_WALK_LEFT_WORLD_X : HOLD_WALK_RIGHT_WORLD_X;
  if (state.scene === "city" && state.run.mode === "city") {
    if (blockTutorialAmbientAction()) {
      keyboardMoveKeys.clear();
      return;
    }
    closeCityInteractions({ render: false });
    combat.moveCityTo(targetX);
  } else if (state.scene === "hideout" && state.run.mode === "hideout") {
    if (blockTutorialAmbientAction()) {
      keyboardMoveKeys.clear();
      return;
    }
    state.run.pendingHideoutPortalId = null;
    state.run.pendingHideoutItemId = null;
    combat.moveHideoutTo(targetX);
  } else if (state.scene === "idle" && ["idle", "temporary"].includes(state.run.mode)) {
    state.run.pendingIdlePortalId = null;
    combat.moveIdleTo(targetX);
  }
}

function stopKeyboardMovement() {
  if (!state?.run) return;
  if (state.scene !== "city" && state.scene !== "hideout" && state.scene !== "idle") return;
  state.run.cityTargetX = null;
  state.run.pendingHideoutPortalId = null;
  state.run.pendingIdlePortalId = null;
  state.run.pendingHideoutItemId = null;
  state.run.playerAction = null;
  renderAll();
}

function clearKeyboardMovement() {
  keyboardMoveKeys.clear();
  stopKeyboardMovement();
}

function isTypingTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

function renderInventory() {
  elements.inventoryWindow.classList.remove("hidden");
  renderInventoryWindow(elements.inventoryWindow, state, renderer, {
    close: closeMaster,
    openTab: openMasterTab,
    openConfig,
    activeLeft,
    activeRight,
    selectInventory: (index) => {
      state.selectedInventoryIndex = index;
      renderAll();
    },
    toggleInventoryLock: (index) => {
      const item = state.player.inventory[index];
      if (!item) return;
      item.favorite = !item.favorite;
      state.selectedInventoryIndex = index;
      if (item.favorite) pendingSellIndexes.delete(index);
      const message = item.favorite
        ? `${item.name} bloqueado para venda.`
        : `${item.name} desbloqueado para venda.`;
      addLog(state, message);
      showToast(message);
      renderAll();
    },
    moveInventory: (from, to) => {
      moveItem(state.player.inventory, from, to);
      state.selectedInventoryIndex = to;
      renderAll();
    },
    storeInventoryItem: (index, targetIndex = null) => {
      const result = moveInventoryItemToVault(index, targetIndex);
      handleResult(result);
      renderAll();
    },
    equipFromInventory: (index) => {
      const result = equipFromInventory(state.player, index);
      handleResult(result);
      combat.syncHpToStats();
      renderAll();
    },
    useInventoryDrug: (index) => {
      handleInventoryDrugUse(index);
    },
    equipSelected: () => {
      const result = equipFromInventory(state.player, state.selectedInventoryIndex);
      handleResult(result);
      combat.syncHpToStats();
      renderAll();
    },
    equipBest: () => {
      const result = equipBestAvailable(state.player);
      handleResult(result);
      combat.syncHpToStats();
      renderAll();
    },
    filterInventory: () => {
      sortInventoryByTier(state.player);
      state.selectedInventoryIndex = null;
      addLog(state, "Mochila filtrada por tier.");
      renderAll();
    },
    selectBackpackPage: (page) => {
      state.backpackPage = Math.min(BACKPACK_PAGE_COUNT, Math.max(1, Number(page) || 1));
      const pageStart = (state.backpackPage - 1) * BACKPACK_PAGE_SIZE;
      const pageEnd = pageStart + BACKPACK_PAGE_SIZE;
      if (state.selectedInventoryIndex < pageStart || state.selectedInventoryIndex >= pageEnd) {
        state.selectedInventoryIndex = null;
      }
      renderAll();
    },
    sellSelected: () => {
      if (!confirmSellItems([state.player.inventory[state.selectedInventoryIndex]])) return;
      const result = sellInventoryItem(state.player, state.selectedInventoryIndex);
      handleResult(result);
      if (result.ok) state.selectedInventoryIndex = null;
      renderAll();
    },
    sellRarity: (rarity) => {
      const items = state.player.inventory.filter((item) => item?.rarity === rarity);
      if (!confirmSellItems(items)) return;
      const result = sellInventoryItemsByRarity(state.player, rarity);
      handleResult(result);
      renderAll();
    },
    sellNonFavorite: () => {
      const items = state.player.inventory.filter((item) => item && !item.favorite);
      if (!confirmSellItems(items)) return;
      const result = sellNonFavoriteInventoryItems(state.player);
      handleResult(result);
      renderAll();
    },
    craftSelected: () => {
      const result = craftInventoryItem(state.player, state.selectedInventoryIndex);
      handleResult(result);
      combat.syncHpToStats();
      renderAll();
    },
    craftAll: () => {
      const result = craftAllInventory(state.player);
      handleResult(result);
      combat.syncHpToStats();
      renderAll();
    },
    craftPreview: () => getCraftPreview(state.player, state.selectedInventoryIndex),
    organize: () => {
      organizeInventory(state.player);
      state.selectedInventoryIndex = null;
      addLog(state, "Inventario organizado.");
      renderAll();
    },
    unequip: (slot, accessoryIndex) => {
      const result = unequipToInventory(state.player, slot, accessoryIndex);
      handleResult(result);
      combat.syncHpToStats();
      renderAll();
    }
  });
}

function applyEquipmentIconTestInventory(slot) {
  const items = ICON_TEST_RARITIES.flatMap((rarity) => (
    [1, 2, 3, 4].map((tier) => createItem(`${slot}-${rarity}-t${tier}`))
  ));
  state.player.inventory = [
    ...items,
    ...Array.from({ length: Math.max(0, BACKPACK_TOTAL_SLOTS - items.length) }, () => null)
  ].slice(0, BACKPACK_TOTAL_SLOTS);
  state.backpackPage = 1;
  state.selectedInventoryIndex = 0;
  activeCenter = true;
  activeLeft = null;
  activeRight = null;
}

function renderLeftPanel(type) {
  elements.leftWindow.classList.remove("hidden");
  renderPanel(elements.leftWindow, type, state, renderer, panelCallbacks(closeLeft));
}

function renderRightPanel(type) {
  elements.rightWindow.classList.remove("hidden");
  if (type === "configs") {
    renderConfigPanel(elements.rightWindow);
    return;
  }
  if (type === "vault") {
    renderVault();
    return;
  }

  renderPanel(elements.rightWindow, type, state, renderer, panelCallbacks(closeRight));
}

function renderVault() {
  renderVaultWindow(elements.rightWindow, state, {
    close: closeRight,
    selectVaultItem: (index) => {
      state.selectedVaultIndex = index;
      renderAll();
    },
    storeInventoryItem: (index, targetIndex = null) => {
      const result = moveInventoryItemToVault(index, targetIndex);
      handleResult(result);
      renderAll();
    },
    withdrawVaultItem: (index) => {
      const result = moveVaultItemToInventory(index);
      handleResult(result);
      renderAll();
    },
    moveVaultItem: (from, to) => {
      const result = moveVaultItemWithinVault(from, to);
      handleResult(result);
      renderAll();
    },
    depositVaultMoney: (amount) => {
      const result = depositPersonalVaultMoney(amount);
      handleResult(result);
      renderAll();
    },
    withdrawVaultMoney: (amount) => {
      const result = withdrawPersonalVaultMoney(amount);
      handleResult(result);
      renderAll();
    }
  });
}

function ensurePersonalVault() {
  state.player.personalVault ||= { money: 0, items: [] };
  state.player.personalVault.money = Math.max(0, Math.floor(Number(state.player.personalVault.money || 0)));
  state.player.personalVault.items ||= [];
  if (state.player.personalVault.items.length < PERSONAL_VAULT_SLOTS) {
    state.player.personalVault.items.push(...Array.from({ length: PERSONAL_VAULT_SLOTS - state.player.personalVault.items.length }, () => null));
  }
  if (state.player.personalVault.items.length > PERSONAL_VAULT_SLOTS) {
    state.player.personalVault.items = state.player.personalVault.items.slice(0, PERSONAL_VAULT_SLOTS);
  }
  state.player.personalVault.items = state.player.personalVault.items.map((item) => normalizeDrugInventoryItem(normalizeInventoryItem(item)));
  return state.player.personalVault;
}

function moveInventoryItemToVault(index, targetIndex = null) {
  const vault = ensurePersonalVault();
  const item = state.player.inventory[index];
  if (!item) return { ok: false, reason: "Selecione um item da mochila." };

  const target = Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < vault.items.length && !vault.items[targetIndex]
    ? targetIndex
    : vault.items.findIndex((cell) => !cell);
  if (target === -1) return { ok: false, reason: "Cofre cheio." };

  vault.items[target] = item;
  state.player.inventory[index] = null;
  state.selectedInventoryIndex = null;
  state.selectedVaultIndex = target;
  return { ok: true, message: `${item.name} guardado no cofre.` };
}

function moveVaultItemToInventory(index, targetIndex = null) {
  const vault = ensurePersonalVault();
  const item = vault.items[index];
  if (!item) return { ok: false, reason: "Selecione um item do cofre." };

  const target = Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < state.player.inventory.length && !state.player.inventory[targetIndex]
    ? targetIndex
    : state.player.inventory.findIndex((cell) => !cell);
  if (target === -1) return { ok: false, reason: "Mochila cheia." };

  state.player.inventory[target] = item;
  vault.items[index] = null;
  state.selectedVaultIndex = null;
  state.selectedInventoryIndex = target;
  return { ok: true, message: `${item.name} voltou para a mochila.` };
}

function moveVaultItemWithinVault(from, to) {
  const vault = ensurePersonalVault();
  if (from === to) return null;
  if (!vault.items[from]) return { ok: false, reason: "Selecione um item do cofre." };
  const next = vault.items[to] || null;
  vault.items[to] = vault.items[from];
  vault.items[from] = next;
  state.selectedVaultIndex = to;
  return { ok: true, message: "Cofre organizado." };
}

function depositPersonalVaultMoney(amount) {
  const vault = ensurePersonalVault();
  const value = clampMoneyTransfer(amount, state.player.money);
  if (value <= 0) return { ok: false, reason: "Dinheiro insuficiente." };
  state.player.money -= value;
  vault.money += value;
  return { ok: true, message: `${formatMoney(value)} depositado no cofre.` };
}

function withdrawPersonalVaultMoney(amount) {
  const vault = ensurePersonalVault();
  const value = clampMoneyTransfer(amount, vault.money);
  if (value <= 0) return { ok: false, reason: "Cofre sem dinheiro." };
  vault.money -= value;
  state.player.money += value;
  return { ok: true, message: `${formatMoney(value)} sacado do cofre.` };
}

function clampMoneyTransfer(amount, max) {
  const limit = Math.max(0, Math.floor(Number(max || 0)));
  const requested = Math.floor(Number(amount || 0));
  if (!Number.isFinite(requested) || requested <= 0) return 0;
  return Math.min(limit, requested);
}

function panelCallbacks(close) {
  return {
    close,
    onlineSnapshot: () => online?.snapshot(),
    factionSnapshot: () => factionSnapshot(state.player),
    onlineConnect: () => online?.connect(),
    onlineDisconnect: () => online?.disconnect(),
    sendChat: (text) => online?.sendChat(text),
    visitShop: (shopId) => {
      online?.visitShop(shopId);
      showToast("Visita registrada na cidade.");
    },
    selectAssaultTier: (tier) => {
      state.activeAssaultTier = tier;
      renderAll();
    },
    enterMap: (mapId) => startRaid(mapId),
    enterIdleMap: (mapId) => {
      if (state.run?.mode === "temporary") {
        showToast(temporaryStayText());
        return;
      }
      closeCityShopPanel({ render: false });
      closeCityPortalPanel({ render: false });
      closeMaster({ render: false, force: true });
      combat.enterIdleMap(mapId, { logMessage: `Voce entrou em ${idleMapName(mapId)}.` });
      renderAll();
    },
    enterCity: () => {
      if (state.run?.mode === "temporary") {
        showToast(temporaryStayText());
        return;
      }
      combat.enterCity();
      online?.sayHello();
      renderAll();
    },
    enterHideout: () => {
      if (state.run?.mode === "temporary") {
        showToast(temporaryStayText());
        return;
      }
      if (!canUseHideout()) return;
      closeCityShopPanel({ render: false });
      combat.enterHideout();
      renderAll();
    },
    buyHideoutItem,
    restNow: () => {
      const result = restNow(state.player);
      handleResult(result);
      renderAll();
    },
    collectVault: () => {
      const result = collectPassiveVault(state.player);
      handleResult(result);
      renderAll();
    },
    refreshFactions: () => renderAll(),
    createFaction: (fields) => handleFactionResult(createFaction(state.player, fields)),
    joinFaction: (factionId) => handleFactionResult(joinFaction(state.player, factionId)),
    leaveFaction: () => handleFactionResult(leaveFaction(state.player)),
    editFaction: (fields) => handleFactionResult(editFaction(state.player, fields)),
    kickFactionMember: (playerId) => handleFactionResult(kickFactionMember(state.player, playerId))
  };
}

function handleFactionResult(result) {
  if (!result) return;
  handleResult(result);
  if (Object.prototype.hasOwnProperty.call(result, "factionId")) {
    state.player.factionId = result.factionId;
    if (activeProfile?.id) activeProfile = updateProfile(activeProfile.id, { factionId: result.factionId }) || activeProfile;
  }
  persistGame();
  renderAll();
}

function renderConfigPanel(container) {
  renderConfigWindow(container, state, {
    close: closeRight,
    save: () => {
      if (state.settings.visualPreview) {
        saveVisualCalibration(state.settings.visual);
        showToast("Calibracao visual salva para o jogo.");
        return;
      }
      persistGame();
      showToast("Jogo salvo.");
    },
    toggleSound: () => {
      state.settings.sound = !state.settings.sound;
      renderAll();
    },
    toggleMusic: () => {
      state.settings.music = !state.settings.music;
      renderAll();
    },
    reset: () => {
      if (activeProfile?.id) {
        clearProfileSave(activeProfile.id);
        activeProfile = updateProfile(activeProfile.id, { characterId: null }) || activeProfile;
      } else {
        clearSave();
      }
      state = null;
      closeMaster({ render: false });
      showToast("Novo jogo: escolha seu personagem.");
      showCharacterSelection("new");
    },
    updateOnlineProvider: (provider) => {
      state.settings.onlineProvider = provider === "local" ? "local" : "supabase";
      online?.disconnect();
      persistGame();
      renderAll();
    },
    updateOnlineSetting: (key, value) => {
      if (!["supabaseUrl", "supabaseKey", "onlineUrl"].includes(key)) return;
      state.settings[key] = String(value || "").trim();
      persistGame();
    },
    updateVisual: (key, value) => {
      updateVisualSetting(key, value);
      const input = container.querySelector(`[data-visual-control="${key}"]`);
      input?.closest(".range-control")?.querySelector("strong").replaceChildren(String(value));
      renderer.draw(state, playerRow());
    },
    previewMap: (mapId) => {
      activeRight = "configs";
      startRaid(mapId, { keepMenus: true });
    },
    previewPlayer: (playerId) => {
      state.selectedPlayerId = playerId;
      renderAll();
    }
  });
}

function openMaster() {
  activeCenter = true;
  renderAll();
}

function toggleMaster() {
  if (activeCenter) {
    closeMaster();
    return;
  }
  openMaster();
}

function openMasterTab(type) {
  if (!activeCenter) activeCenter = true;
  if (state.run?.mode === "temporary" && (type === "city" || type === "hideout" || type === "assaults")) {
    showToast(temporaryStayText());
    renderAll();
    return;
  }
  if (type === "city") {
    hideChoice();
    closeCityShopPanel({ render: false });
    combat?.enterCity();
    activeLeft = null;
    activeRight = activeRight === "city" ? null : activeRight;
    showToast("Cidade inicial.");
    renderAll();
    return;
  }
  if (type === "hideout") {
    if (!canUseHideout()) {
      renderAll();
      return;
    }
    closeCityShopPanel({ render: false });
    combat?.enterHideout();
  }
  const side = type === "assaults" || type === "city" ? "left" : "right";

  if (side === "left") {
    activeLeft = activeLeft === type ? null : type;
  } else {
    activeRight = activeRight === type ? null : type;
  }

  renderAll();
}

function openPanel(type) {
  openMaster();
  openMasterTab(type);
}

function openHideoutVault() {
  activeCenter = true;
  activeLeft = "hideout";
  activeRight = "vault";
  ensurePersonalVault();
  dispatchTutorialEvent("hideout_house_opened", {}, { render: false });
  showToast("Cofre aberto.");
  renderAll();
}

function canUseHideout() {
  if (playerHasOwnedLand()) return true;
  const message = "Compre um terreno com Seu Zeca para liberar o esconderijo.";
  showToast(message);
  addLog(state, message);
  return false;
}

function openConfig() {
  activeCenter = true;
  activeRight = "configs";
  renderAll();
}

function closeMaster(options = {}) {
  const shouldRender = options.render !== false;
  activeCenter = false;
  activeLeft = null;
  activeRight = null;
  activeCityPortalId = null;
  elements.inventoryWindow.classList.add("hidden");
  elements.leftWindow.classList.add("hidden");
  elements.rightWindow.classList.add("hidden");
  elements.configWindow.classList.add("hidden");
  updateMasterToggle();
  if (shouldRender) renderAll();
}

function closeCenter() {
  closeMaster();
}

function closeLeft(options = {}) {
  const shouldRender = options.render !== false;
  if (activeLeft === "assaults") activeCityPortalId = null;
  activeLeft = null;
  elements.leftWindow.classList.add("hidden");
  updateMasterToggle();
  if (shouldRender) renderAll();
}

function closeRight(options = {}) {
  const shouldRender = options.render !== false;
  activeRight = null;
  elements.rightWindow.classList.add("hidden");
  elements.configWindow.classList.add("hidden");
  updateMasterToggle();
  if (shouldRender) renderAll();
}

function closeSide() {
  activeLeft = null;
  activeRight = null;
  elements.leftWindow.classList.add("hidden");
  elements.rightWindow.classList.add("hidden");
  updateMasterToggle();
  renderAll();
}

function closeConfig() {
  if (activeRight === "configs") {
    closeRight();
    return;
  }
  elements.configWindow.classList.add("hidden");
}

function applyWindowLayout() {
  const hasSavedLayout = Boolean(loadWindowLayout());
  const shouldApply = editorMode || hasSavedLayout;
  elements.windowLayer.classList.toggle("custom-window-layout", shouldApply);
  if (!shouldApply) return;

  const layout = normalizeWindowLayout(windowLayout);
  document.documentElement.style.setProperty("--window-ui-scale", String(layout.uiScale || 1));
  elements.windowLayer.style.height = `${layout.layerHeight || 310}px`;
  elements.windowLayer.style.minHeight = `${layout.layerHeight || 310}px`;

  Object.entries(layout.windows || {}).forEach(([id, metrics]) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.style.left = `${metrics.xPct}%`;
    node.style.top = `${metrics.y || 0}px`;
    node.style.width = `${metrics.wPct}%`;
    node.style.height = `${metrics.h || 280}px`;
      node.style.maxHeight = `${metrics.h || 280}px`;
  });

  if (layout.dock && elements.bottomDock) {
    elements.bottomDock.classList.add("custom-dock-position");
    elements.bottomDock.style.left = `${layout.dock.xPct}%`;
    elements.bottomDock.style.top = `${layout.dock.y}px`;
    elements.bottomDock.style.width = `${layout.dock.wPct}%`;
    elements.bottomDock.style.height = `${layout.dock.h}px`;
  }
}

function enableWindowEditor() {
  ensureEditorBar();
  document.querySelectorAll(".game-window").forEach((node) => {
    if (!node.querySelector(".layout-resize-handle")) {
      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "layout-resize-handle";
      handle.setAttribute("aria-label", "Redimensionar janela");
      handle.textContent = "+";
      node.append(handle);
    }

    if (node.dataset.editorReady) return;
    node.dataset.editorReady = "true";
    node.addEventListener("pointerdown", startWindowEdit);
  });
  enableDockEditor();
}

function ensureEditorBar() {
  if (editorBarClosed) return;
  if (document.querySelector("#layout-editor-bar")) return;
  const bar = document.createElement("div");
  bar.id = "layout-editor-bar";
  bar.className = "layout-editor-bar";
  bar.innerHTML = `
    <strong>Editor de janelas</strong>
    <span>Arraste o titulo das janelas e redimensione pelo canto.</span>
    <button type="button" id="layout-scale-down">Menor</button>
    <button type="button" id="layout-scale-up">Maior</button>
    <button type="button" id="layout-save">Salvar layout</button>
    <button type="button" id="layout-reset">Resetar</button>
    <button type="button" id="layout-close" aria-label="Fechar editor de janelas">X</button>
  `;
  document.querySelector(".topbar").after(bar);
  bar.querySelector("#layout-save").addEventListener("click", () => {
    windowLayout = readCurrentWindowLayout();
    saveWindowLayout(windowLayout);
    showToast("Layout das janelas salvo.");
  });
  bar.querySelector("#layout-scale-down").addEventListener("click", () => {
    const layout = windowLayout || defaultWindowLayout();
    layout.uiScale = Math.max(0.72, round((layout.uiScale || 1) - 0.08));
    windowLayout = layout;
    applyWindowLayout();
    showToast("Conteudo interno menor.");
  });
  bar.querySelector("#layout-scale-up").addEventListener("click", () => {
    const layout = windowLayout || defaultWindowLayout();
    layout.uiScale = Math.min(1.16, round((layout.uiScale || 1) + 0.08));
    windowLayout = layout;
    applyWindowLayout();
    showToast("Conteudo interno maior.");
  });
  bar.querySelector("#layout-reset").addEventListener("click", () => {
    clearWindowLayout();
    windowLayout = defaultWindowLayout();
    applyWindowLayout();
    showToast("Layout resetado.");
  });
  bar.querySelector("#layout-close").addEventListener("click", () => {
    editorBarClosed = true;
    bar.remove();
    showToast("Editor de janelas fechado.");
  });
}

function ensureAnimationTestBar() {
  let bar = document.querySelector("#animation-test-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "animation-test-bar";
    bar.className = "animation-test-bar";
    bar.innerHTML = `
      <strong>Teste combate</strong>
      <button type="button" data-test-player="iris">Iris</button>
      <button type="button" data-test-player="bruno">Bruno</button>
      <button type="button" data-test-action="attack">Atacar</button>
      <button type="button" data-test-action="hurt">Dano</button>
      <button type="button" data-test-action="loop">Loop</button>
      <button type="button" data-test-action="city">Cidade</button>
    `;
    document.body.append(bar);
  }

  bar.classList.remove("hidden");
  if (bar.dataset.testReady) return;
  bar.dataset.testReady = "true";
  bar.addEventListener("click", handleAnimationTestClick);
}

function handleAnimationTestClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.testPlayer) {
    startAnimationCombatTest(button.dataset.testPlayer);
    return;
  }

  if (button.dataset.testAction === "attack" || button.dataset.testAction === "hurt") {
    triggerAnimationTestAction(button.dataset.testAction);
    return;
  }

  if (button.dataset.testAction === "loop") {
    toggleAnimationTestLoop();
    return;
  }

  if (button.dataset.testAction === "city") {
    stopAnimationTestLoop();
    combat.enterCity();
    renderAll();
  }
}

function startAnimationCombatTest(playerId = state.selectedPlayerId) {
  stopAnimationTestLoop();
  closeMaster({ render: false });
  state.selectedPlayerId = playerId;
  const map = MAPS[0];
  const stats = calculateStats(state.player);
  state.player.hp = stats.maxHp;
  state.scene = "map";
  state.currentMapId = map.id;
  state.run = {
    mode: "combat",
    playerX: 260,
    playerDirection: "right",
    npcs: [
      {
        id: "animation-test-target",
        name: "Alvo de teste",
        row: 0,
        x: 392,
        direction: "left",
        alerted: true,
        done: false,
        walkPhase: 0
      }
    ],
    targetId: "animation-test-target",
    timer: 0,
    raidDuration: 999,
    raidTimeLeft: 999,
    enemy: {
      name: "Alvo de teste",
      level: 1,
      hp: 999,
      attack: 0,
      speed: 0,
      block: 0
    },
    enemyHp: 999,
    enemyMaxHp: 999,
    playerAttackTimer: 9999,
    enemyAttackTimer: 9999,
    playerAction: null,
    playerActionTimer: 0,
    playerActionDuration: 0,
    cityTargetX: null,
    attempts: 0,
    animationTest: true
  };
  showToast(`Teste de combate: ${PLAYERS.find((player) => player.id === playerId)?.name || "Personagem"}`);
  renderAll();
}

function triggerAnimationTestAction(action) {
  if (!state.run.animationTest) startAnimationCombatTest(state.selectedPlayerId);
  combat.triggerPlayerAction(action, action === "attack" ? 0.7 : 0.62);
  renderer.draw(state, playerRow());
  syncHud();
}

function toggleAnimationTestLoop() {
  if (animationTestLoop) {
    stopAnimationTestLoop();
    updateAnimationTestBar();
    return;
  }

  if (!state.run.animationTest) startAnimationCombatTest(state.selectedPlayerId);
  let nextAction = "attack";
  triggerAnimationTestAction(nextAction);
  animationTestLoop = setInterval(() => {
    nextAction = nextAction === "attack" ? "hurt" : "attack";
    triggerAnimationTestAction(nextAction);
    updateAnimationTestBar();
  }, 860);
  updateAnimationTestBar();
}

function stopAnimationTestLoop() {
  if (!animationTestLoop) return;
  clearInterval(animationTestLoop);
  animationTestLoop = null;
}

function updateAnimationTestBar() {
  const bar = document.querySelector("#animation-test-bar");
  if (!bar || !state) return;
  bar.querySelectorAll("[data-test-player]").forEach((button) => {
    button.classList.toggle("active", button.dataset.testPlayer === state.selectedPlayerId);
  });
  bar.querySelector('[data-test-action="loop"]')?.classList.toggle("active", Boolean(animationTestLoop));
}

function ensureMapNpcTestPanel() {
  let panel = document.querySelector("#map-npc-test-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "map-npc-test-panel";
    panel.className = "map-npc-test-panel";
    document.body.append(panel);
  }

  panel.innerHTML = `
    <strong>Teste mapas/NPCs</strong>
    <select id="map-npc-target" aria-label="Cena de teste"></select>
    <button type="button" data-map-npc-step="-1">Anterior</button>
    <button type="button" data-map-npc-step="1">Proximo</button>
    <button type="button" data-map-npc-fill>Todos NPCs</button>
    <div class="map-npc-directions">
      ${testDirectionButton("right", "Direita")}
      ${testDirectionButton("front", "Frente")}
      ${testDirectionButton("back", "Costas")}
      ${testDirectionButton("left", "Esquerda")}
    </div>
  `;

  panel.querySelector("#map-npc-target").addEventListener("change", (event) => {
    showMapNpcTestScene(event.target.value);
  });
  panel.querySelectorAll("[data-map-npc-step]").forEach((button) => {
    button.addEventListener("click", () => stepMapNpcTestScene(Number(button.dataset.mapNpcStep)));
  });
  panel.querySelector("[data-map-npc-fill]").addEventListener("click", () => {
    showMapNpcTestScene(currentMapNpcTestTarget(), { keepTarget: true });
  });
  panel.querySelectorAll("[data-map-npc-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.npcTestDirection = button.dataset.mapNpcDirection;
      showMapNpcTestScene(currentMapNpcTestTarget(), { keepTarget: true });
    });
  });

  updateMapNpcTestPanel();
}

function updateMapNpcTestPanel() {
  const panel = document.querySelector("#map-npc-test-panel");
  if (!panel || !state?.settings?.visualPreview) return;
  const select = panel.querySelector("#map-npc-target");
  const value = currentMapNpcTestTarget();
  select.innerHTML = mapNpcTestOptions().map((option) => `
    <option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>
  `).join("");
  panel.querySelectorAll("[data-map-npc-direction]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mapNpcDirection === (state.settings.npcTestDirection || "right"));
  });
}

function showMapNpcTestScene(targetValue, options = {}) {
  stopAnimationTestLoop();
  hideChoice();
  closeMaster({ render: false });
  const target = targetValue || "city";
  state.settings.npcTestTarget = target;

  if (target.startsWith("map:")) {
    const mapId = target.slice(4);
    const map = MAPS.find((candidate) => candidate.id === mapId) || MAPS[0];
    state.scene = "map";
    state.currentMapId = map.id;
  } else if (target.startsWith("hideout:")) {
    const hideoutId = target.slice(8);
    const hideout = HIDEOUTS.find((candidate) => candidate.id === hideoutId) || HIDEOUTS[0];
    state.scene = "hideout";
    state.currentMapId = null;
    state.player.hideoutTier = hideout.tier;
  } else {
    state.scene = "city";
    state.currentMapId = null;
  }

  state.run = createNpcTestRun(state.settings.npcTestDirection || "right");
  if (!options.keepTarget) showToast("Teste de mapas e NPCs aberto.");
  renderAll();
}

function stepMapNpcTestScene(step) {
  const options = mapNpcTestOptions();
  const current = currentMapNpcTestTarget();
  const index = Math.max(0, options.findIndex((option) => option.value === current));
  const next = options[(index + step + options.length) % options.length];
  showMapNpcTestScene(next.value);
}

function currentMapNpcTestTarget() {
  if (state?.settings?.npcTestTarget) return state.settings.npcTestTarget;
  if (state?.scene === "map" && state.currentMapId) return `map:${state.currentMapId}`;
  if (state?.scene === "hideout") return `hideout:esconderijo-${state.player?.hideoutTier || 1}`;
  return "city";
}

function mapNpcTestOptions() {
  return [
    { value: "city", label: "Cidade" },
    ...MAPS.map((map) => ({ value: `map:${map.id}`, label: `Mapa ${map.code} - ${map.name}` })),
    ...HIDEOUTS.map((hideout) => ({ value: `hideout:${hideout.id}`, label: `Esconderijo ${hideout.tier}` }))
  ];
}

function createNpcTestRun(direction) {
  return {
    mode: "npc-test",
    playerX: 20,
    playerDirection: "right",
    npcs: NPC_TYPES.map((type, index) => ({
      id: `npc-test-${type.id}`,
      typeId: type.id,
      name: type.name,
      sheet: type.sheet || "enemies",
      row: type.row,
      columnOffset: Number(type.columnOffset || 0),
      x: 112 + index * 78,
      y: 235,
      direction: type.fixedFrame ? type.direction : direction,
      fixedFrame: Boolean(type.fixedFrame),
      heightScale: Number(type.heightScale || 1),
      walkPhase: 0,
      done: false,
      alerted: false,
      baseHp: type.baseHp,
      baseAttack: type.baseAttack
    })),
    targetId: null,
    timer: 0,
    raidDuration: 0,
    raidTimeLeft: 0,
    enemy: null,
    enemyHp: 0,
    enemyMaxHp: 0,
    playerAttackTimer: 0,
    enemyAttackTimer: 0,
    playerAction: null,
    playerActionTimer: 0,
    playerActionDuration: 0,
    cityTargetX: null,
    attempts: 0,
    summary: null,
    summaryTimer: 0,
    npcTest: true
  };
}

function testDirectionButton(direction, label) {
  return `<button type="button" data-map-npc-direction="${direction}">${label}</button>`;
}

function ensureHideoutItemEditorPanel() {
  let panel = document.querySelector("#hideout-item-editor-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "hideout-item-editor-panel";
    panel.className = "hideout-item-editor-panel";
    document.body.append(panel);
  }

  if (!panel.dataset.editorReady) {
    panel.dataset.editorReady = "true";
    panel.addEventListener("change", handleHideoutEditorChange);
    panel.addEventListener("input", handleHideoutEditorInput);
    panel.addEventListener("click", handleHideoutEditorClick);
  }

  updateHideoutItemEditorPanel();
}

function updateHideoutItemEditorPanel() {
  const panel = document.querySelector("#hideout-item-editor-panel");
  if (!panel || !state?.settings?.visualPreview) return;
  const editor = ensureHideoutEditorState();
  const selectedType = hideoutItemType(editor.selectedType);
  const selectedTier = selectedHideoutItemTier(selectedType.id);
  const placement = getHideoutItemPlacement(selectedType.id, state.player.hideoutTier || 1, selectedTier);
  const hideoutTier = state.scene === "hideout" ? state.player.hideoutTier || 1 : 1;

  panel.innerHTML = `
    <strong>Editor esconderijo</strong>
    <select id="hideout-editor-map" aria-label="Mapa do esconderijo">
      ${HIDEOUTS.map((hideout) => `
        <option value="${hideout.tier}" ${hideout.tier === hideoutTier ? "selected" : ""}>Esconderijo ${hideout.tier}</option>
      `).join("")}
    </select>
    <select id="hideout-editor-type" aria-label="Item do esconderijo">
      ${HIDEOUT_ITEM_TYPES.map((item) => `
        <option value="${item.id}" ${item.id === selectedType.id ? "selected" : ""}>${item.name}</option>
      `).join("")}
    </select>
    <select id="hideout-editor-tier" aria-label="Tier do item">
      ${HIDEOUT_ITEM_TIERS.map((tier) => `
        <option value="${tier}" ${tier === selectedTier ? "selected" : ""}>Tier ${tier}</option>
      `).join("")}
    </select>
    <label>
      Tam.
      <input id="hideout-editor-height" type="range" min="34" max="220" value="${Math.round(placement.height)}">
      <span>${Math.round(placement.height)}</span>
    </label>
    <button type="button" data-hideout-item-step="-1">Anterior</button>
    <button type="button" data-hideout-item-step="1">Proximo</button>
    <button type="button" data-hideout-item-center>Centralizar</button>
    <button type="button" data-hideout-item-save>Salvar ancoras</button>
  `;
}

function handleHideoutEditorChange(event) {
  if (!state?.settings?.visualPreview) return;
  const target = event.target;
  if (target.id === "hideout-editor-map") {
    showHideoutEditorScene(Number(target.value));
    return;
  }
  if (target.id === "hideout-editor-type") {
    ensureHideoutEditorState().selectedType = target.value;
    renderAll();
    return;
  }
  if (target.id === "hideout-editor-tier") {
    const editor = ensureHideoutEditorState();
    editor.previewTiers[editor.selectedType] = Number(target.value);
    renderAll();
  }
}

function handleHideoutEditorInput(event) {
  if (!state?.settings?.visualPreview) return;
  if (event.target.id !== "hideout-editor-height") return;
  const editor = ensureHideoutEditorState();
  setHideoutItemPlacement(editor.selectedType, { height: Number(event.target.value) }, state.player.hideoutTier || 1, selectedHideoutItemTier(editor.selectedType));
  renderer.draw(state, playerRow());
  event.target.nextElementSibling?.replaceChildren(String(event.target.value));
}

function handleHideoutEditorClick(event) {
  const button = event.target.closest("button");
  if (!button || !state?.settings?.visualPreview) return;

  if (button.dataset.hideoutItemStep) {
    stepHideoutEditorScene(Number(button.dataset.hideoutItemStep));
    return;
  }

  if (button.dataset.hideoutItemCenter !== undefined) {
    const editor = ensureHideoutEditorState();
    const type = hideoutItemType(editor.selectedType);
    setHideoutItemPlacement(type.id, hideoutItemPlacementDefault(type.id, state.player.hideoutTier || 1));
    renderAll();
    return;
  }

  if (button.dataset.hideoutItemSave !== undefined) {
    saveVisualCalibration(state.settings.visual);
    showToast("Ancoras do esconderijo salvas.");
  }
}

function showHideoutEditorScene(tier = 1) {
  stopAnimationTestLoop();
  hideChoice();
  closeMaster({ render: false });
  closeCityShopPanel({ render: false });
  combat.enterHideout(Math.max(1, Math.min(HIDEOUTS.length, tier)));
  renderAll();
}

function stepHideoutEditorScene(step) {
  const current = state.scene === "hideout" ? state.player.hideoutTier || 1 : 1;
  const next = ((current - 1 + step + HIDEOUTS.length) % HIDEOUTS.length) + 1;
  showHideoutEditorScene(next);
}

function handleHideoutHouseClick(point) {
  if (state?.settings?.visualPreview || state.scene !== "hideout") return false;
  const hit = renderer.hitTestHideoutItem(point.x, point.y);
  if (hit?.typeId !== "house") return false;
  if (blockWrongTutorialTarget("hideout_item", "house")) return true;

  const placement = getHideoutItemPlacement("house");
  state.run.pendingHideoutPortalId = null;
  state.run.pendingHideoutItemId = "house";
  closeMaster({ render: false, force: true });
  combat.moveHideoutTo(placement.x);
  showToast("Indo ate a casa.");
  return true;
}

function handleHideoutItemPointerDown(event) {
  if (!state?.settings?.visualPreview || state.scene !== "hideout") return false;
  const point = canvasPoint(event);
  const hit = renderer.hitTestHideoutItem(point.x, point.y);
  if (!hit) return false;

  event.preventDefault();
  const editor = ensureHideoutEditorState();
  editor.selectedType = hit.typeId;
  editor.previewTiers[hit.typeId] = hit.tier;
  const placement = getHideoutItemPlacement(hit.typeId);
  hideoutItemDrag = {
    typeId: hit.typeId,
    offsetX: placement.x - renderer.screenToWorld(point.x, state),
    offsetY: placement.y - point.y
  };
  document.addEventListener("pointermove", moveHideoutItem);
  document.addEventListener("pointerup", stopHideoutItemDrag);
  updateHideoutItemEditorPanel();
  return true;
}

function moveHideoutItem(event) {
  if (!hideoutItemDrag) return;
  const point = canvasPoint(event);
  const worldX = renderer.screenToWorld(point.x, state);
  setHideoutItemPlacement(hideoutItemDrag.typeId, {
    x: Math.round(worldX + hideoutItemDrag.offsetX),
    y: Math.round(Math.max(40, Math.min(elements.canvas.height + 40, point.y + hideoutItemDrag.offsetY)))
  });
  renderer.draw(state, playerRow());
}

function stopHideoutItemDrag() {
  if (!hideoutItemDrag) return;
  document.removeEventListener("pointermove", moveHideoutItem);
  document.removeEventListener("pointerup", stopHideoutItemDrag);
  hideoutItemDrag = null;
  saveVisualCalibration(state.settings.visual);
  showToast("Ancora salva.");
  renderAll();
}

function canvasPoint(event) {
  const rect = elements.canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * elements.canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * elements.canvas.height
  };
}

function ensureHideoutEditorState() {
  state.settings.hideoutEditor ||= {};
  state.settings.hideoutEditor.selectedType ||= "house";
  state.settings.hideoutEditor.previewTiers ||= {};
  HIDEOUT_ITEM_TYPES.forEach((item) => {
    state.settings.hideoutEditor.previewTiers[item.id] ||= state.player.hideoutItems?.[item.id] || 1;
  });
  return state.settings.hideoutEditor;
}

function applyHideoutPreviewParams(params) {
  if (previewTool !== "hideout") return;
  const editor = ensureHideoutEditorState();
  const houseTier = Number(params.get("houseTier"));
  const vehicleTier = Number(params.get("vehicleTier"));
  if (Number.isFinite(houseTier) && houseTier >= 1) editor.previewTiers.house = Math.min(9, houseTier);
  if (Number.isFinite(vehicleTier) && vehicleTier >= 1) editor.previewTiers.vehicle = Math.min(9, vehicleTier);
  const selectedType = params.get("item");
  if (HIDEOUT_ITEM_TYPES.some((item) => item.id === selectedType)) editor.selectedType = selectedType;
}

function hideGeneralPreviewPanels() {
  document.querySelector("#animation-test-bar")?.classList.add("hidden");
  document.querySelector("#map-npc-test-panel")?.remove();
}

function getHideoutItemPlacement(typeId, tier = state.player.hideoutTier || 1, itemTier = selectedHideoutItemTier(typeId)) {
  const type = hideoutItemType(typeId);
  const mapKey = `esconderijo-${tier}`;
  state.settings.visual.hideoutItems ||= {};
  state.settings.visual.hideoutItems[mapKey] ||= {};
  state.settings.visual.hideoutItems[mapKey][type.id] ||= hideoutItemPlacementDefault(type.id, tier);
  const placement = state.settings.visual.hideoutItems[mapKey][type.id];
  placement.heights ||= {};
  return {
    ...placement,
    height: placement.heights[itemTier] || hideoutItemHeight(type.id, itemTier)
  };
}

function setHideoutItemPlacement(typeId, patch, tier = state.player.hideoutTier || 1, itemTier = selectedHideoutItemTier(typeId)) {
  const type = hideoutItemType(typeId);
  const mapKey = `esconderijo-${tier}`;
  state.settings.visual.hideoutItems ||= {};
  state.settings.visual.hideoutItems[mapKey] ||= {};
  state.settings.visual.hideoutItems[mapKey][type.id] ||= hideoutItemPlacementDefault(type.id, tier);
  const placement = state.settings.visual.hideoutItems[mapKey][type.id];
  placement.heights ||= {};
  const next = { ...patch };
  if (Number.isFinite(next.height)) {
    placement.heights[itemTier] = next.height;
    delete next.height;
  }
  Object.assign(placement, next);
}

function selectedHideoutItemTier(typeId) {
  const editor = ensureHideoutEditorState();
  return Math.max(1, Math.min(9, Number(editor.previewTiers?.[typeId] || state.player.hideoutItems?.[typeId] || 1)));
}

function buyHideoutItem(typeId) {
  const type = hideoutItemType(typeId);
  const currentTier = state.player.hideoutItems?.[type.id] || 0;
  if (currentTier >= 9) {
    showToast(`${type.name} ja esta no tier maximo.`);
    return;
  }
  const nextTier = currentTier + 1;
  const price = hideoutItemCost(type.id, nextTier);
  if (state.player.money < price) {
    showToast(`Dinheiro insuficiente para ${type.name} T${nextTier}.`);
    return;
  }
  state.player.money -= price;
  state.player.hideoutItems[type.id] = nextTier;
  ensureHideoutEditorState().previewTiers[type.id] = nextTier;
  addLog(state, `${type.name} do esconderijo evoluiu para T${nextTier}.`);
  showToast(`${type.name} T${nextTier} comprado.`);
  renderAll();
}

function enableDockEditor() {
  const dock = elements.bottomDock;
  if (!dock) return;
  dock.classList.add("dock-editor-ready");
  if (!dock.querySelector(".layout-resize-handle")) {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "layout-resize-handle";
    handle.setAttribute("aria-label", "Redimensionar menu inferior");
    handle.textContent = "+";
    dock.append(handle);
  }
  if (dock.dataset.editorReady) return;
  dock.dataset.editorReady = "true";
  dock.addEventListener("pointerdown", startDockEdit);
}

function startWindowEdit(event) {
  if (!editorMode) return;
  const target = event.target;
  if (target.closest("button:not(.layout-resize-handle), input, .inventory-cell, .slot")) return;
  const windowNode = event.currentTarget;
  const isResize = Boolean(target.closest(".layout-resize-handle"));
  const isDrag = Boolean(target.closest(".window-header"));
  if (!isResize && !isDrag) return;

  event.preventDefault();
  const layerRect = elements.windowLayer.getBoundingClientRect();
  const rect = windowNode.getBoundingClientRect();
  const start = {
    x: event.clientX,
    y: event.clientY,
    left: rect.left - layerRect.left,
    top: rect.top - layerRect.top,
    width: rect.width,
    height: rect.height
  };

  const move = (moveEvent) => {
    const dx = moveEvent.clientX - start.x;
    const dy = moveEvent.clientY - start.y;
    if (isResize) {
      const width = Math.max(220, Math.min(layerRect.width - start.left, start.width + dx));
      const height = Math.max(170, Math.min(520, start.height + dy));
      windowNode.style.width = `${width}px`;
      windowNode.style.height = `${height}px`;
      windowNode.style.maxHeight = `${height}px`;
      elements.windowLayer.style.height = `${Math.max(layerRect.height, start.top + height + 8)}px`;
      elements.windowLayer.style.minHeight = elements.windowLayer.style.height;
    } else {
      const left = Math.max(0, Math.min(layerRect.width - rect.width, start.left + dx));
      const top = Math.max(0, Math.min(520, start.top + dy));
      windowNode.style.left = `${left}px`;
      windowNode.style.top = `${top}px`;
      elements.windowLayer.style.height = `${Math.max(layerRect.height, top + rect.height + 8)}px`;
      elements.windowLayer.style.minHeight = elements.windowLayer.style.height;
    }
  };

  const stop = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", stop);
    windowLayout = readCurrentWindowLayout();
  };

  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", stop);
}

function startDockEdit(event) {
  if (!editorMode) return;
  if (!elements.bottomDock) return;
  if (event.target.closest("button:not(.layout-resize-handle)") && !event.target.closest(".layout-resize-handle")) return;
  const dock = elements.bottomDock;
  const isResize = Boolean(event.target.closest(".layout-resize-handle"));
  event.preventDefault();
  const rect = dock.getBoundingClientRect();
  const start = {
    x: event.clientX,
    y: event.clientY,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };

  const move = (moveEvent) => {
    const dx = moveEvent.clientX - start.x;
    const dy = moveEvent.clientY - start.y;
    if (isResize) {
      dock.style.width = `${Math.max(320, Math.min(window.innerWidth - start.left - 8, start.width + dx))}px`;
      dock.style.height = `${Math.max(48, Math.min(130, start.height + dy))}px`;
    } else {
      dock.classList.add("custom-dock-position");
      dock.style.left = `${Math.max(0, Math.min(window.innerWidth - start.width, start.left + dx))}px`;
      dock.style.top = `${Math.max(0, Math.min(window.innerHeight - start.height, start.top + dy))}px`;
      dock.style.width = `${start.width}px`;
      dock.style.height = `${start.height}px`;
    }
  };

  const stop = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", stop);
    windowLayout = readCurrentWindowLayout();
  };

  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", stop);
}

function readCurrentWindowLayout() {
  const layerRect = elements.windowLayer.getBoundingClientRect();
  const base = windowLayout || defaultWindowLayout();
  const windows = structuredClone(base.windows || {});
  document.querySelectorAll(".game-window").forEach((node) => {
    if (node.classList.contains("hidden")) return;
    const rect = node.getBoundingClientRect();
    const left = rect.left - layerRect.left;
    windows[node.id] = {
      xPct: round((left / layerRect.width) * 100),
      y: Math.round(rect.top - layerRect.top),
      wPct: round((rect.width / layerRect.width) * 100),
      h: Math.round(rect.height)
    };
  });
  const layout = {
    version: 2,
    layerHeight: Math.round(layerRect.height),
    uiScale: base.uiScale || 1,
    windows
  };

  if (elements.bottomDock) {
    const dockRect = elements.bottomDock.getBoundingClientRect();
    layout.dock = {
      xPct: round((dockRect.left / window.innerWidth) * 100),
      y: Math.round(dockRect.top),
      wPct: round((dockRect.width / window.innerWidth) * 100),
      h: Math.round(dockRect.height)
    };
  }

  return layout;
}

function normalizeWindowLayout(layout) {
  const fallback = defaultWindowLayout();
  if (!layout || layout.version !== 2) return fallback;
  return {
    ...fallback,
    ...layout,
    windows: {
      ...fallback.windows,
      ...(layout.windows || {})
    }
  };
}

function defaultWindowLayout() {
  return {
    version: 2,
    layerHeight: 310,
    uiScale: 0.9,
    windows: {
      "left-window": { xPct: 0.5, y: 0, wPct: 27.5, h: 300 },
      "inventory-window": { xPct: 30, y: 0, wPct: 40, h: 300 },
      "right-window": { xPct: 72, y: 0, wPct: 27.5, h: 300 },
      "config-window": { xPct: 72, y: 0, wPct: 27.5, h: 300 }
    }
  };
}

function startRaid(mapId, options = {}) {
  const map = MAPS.find((candidate) => candidate.id === mapId);
  if (state.run?.mode === "temporary") {
    showToast(temporaryStayText());
    renderAll();
    return;
  }
  if (map && blockWrongTutorialTarget("assault", `map-${map.index}`)) return;
  if (!canStartRaid(state.player, map)) {
    const message = staminaRaidBlockedMessage(state.player, map);
    showToast(message);
    addLog(state, message);
    renderAll();
    return;
  }
  if (playerNeedsHideoutRest()) {
    const message = "Voce precisa repousar no esconderijo antes de sair.";
    showToast(message);
    addLog(state, message);
    renderAll();
    return;
  }
  if (!options.keepMenus) closeMaster({ render: false, force: true });
  closeCityShopPanel({ force: true });
  tutorialOverlay?.hide();
  fadeThen("Roube o maximo que conseguir!", () => {
    combat.enterMap(mapId);
    dispatchTutorialEvent("raid_started", { mapId, mapIndex: map?.index || 1 }, { render: false });
    online?.sayHello();
    if (options.keepMenus) {
      activeCenter = true;
      activeRight = activeRight || "configs";
    }
  });
}

function playerNeedsHideoutRest() {
  const stats = calculateStats(state.player);
  return Boolean(state.player.needsHideoutRest && Number(state.player.hp || 0) < stats.maxHp * 0.6);
}

function findClickedCityNpc(screenX, screenY) {
  const worldX = renderer.screenToWorld(screenX, state);
  const groundY = cityGroundY();
  const npcHeight = cityNpcHeight();
  if (screenY < groundY - npcHeight - 24 || screenY > groundY + 18) return null;
  return CITY_NPCS
    .map((npc) => ({ npc, distance: Math.abs(worldX - npc.x) }))
    .filter((entry) => entry.distance <= 58)
    .sort((a, b) => a.distance - b.distance)[0]?.npc || null;
}

function findClickedCityPortal(screenX, screenY) {
  const worldX = renderer.screenToWorld(screenX, state);
  const groundY = cityGroundY();
  return CITY_PORTALS.find((portal) => (
    (portal.action !== "hideout" || playerHasOwnedLand()) &&
    worldX >= portal.x - portal.width / 2 &&
    worldX <= portal.x + portal.width / 2 &&
    screenY >= groundY + Number(portal.yOffset || 0) - portal.height - 18 &&
    screenY <= groundY + Number(portal.yOffset || 0) + 18
  )) || null;
}

function hideoutGroundY() {
  const visual = state.settings.visual || {};
  const mapKey = `esconderijo-${state.player.hideoutTier || 1}`;
  return Number(visual.maps?.[mapKey]?.groundY ?? visual.groundY ?? 274) + Number(visual.npcYOffset ?? 0);
}

function idleGroundY() {
  const visual = state.settings.visual || {};
  const mapKey = state.currentMapId || "idle";
  return Number(visual.maps?.[mapKey]?.groundY ?? visual.groundY ?? 274) + Number(visual.npcYOffset ?? 0);
}

function findClickedHideoutPortal(screenX, screenY) {
  const worldX = renderer.screenToWorld(screenX, state);
  const groundY = hideoutGroundY();
  return HIDEOUT_PORTALS.find((portal) => (
    worldX >= portal.x - portal.width / 2 &&
    worldX <= portal.x + portal.width / 2 &&
    screenY >= groundY + Number(portal.yOffset || 0) - portal.height - 18 &&
    screenY <= groundY + Number(portal.yOffset || 0) + 18
  )) || null;
}

function findClickedIdlePortal(screenX, screenY) {
  if (state.scene !== "idle") return null;
  const worldX = renderer.screenToWorld(screenX, state);
  const groundY = idleGroundY();
  return IDLE_PORTALS.find((portal) => (
    portal.mapId === state.currentMapId &&
    worldX >= portal.x - portal.width / 2 &&
    worldX <= portal.x + portal.width / 2 &&
    screenY >= groundY + Number(portal.yOffset || 0) - portal.height - 18 &&
    screenY <= groundY + Number(portal.yOffset || 0) + 18
  )) || null;
}

function walkToCityPortal(portal) {
  if (portal.action === "hideout" && !canUseHideout()) return;
  closeCityInteractions({ render: false });
  state.run.pendingCityPortalId = portal.id;
  state.run.pendingCityNpcId = null;
  const defaultOffset = portal.x < 90 ? portal.width / 2 + 8 : -portal.width / 2 - 12;
  const approachX = Math.max(64, Math.round(portal.x + Number(portal.approachOffset ?? defaultOffset)));
  combat.moveCityTo(approachX);
  showToast(portal.action === "hideout" ? "Indo até o esconderijo." : "Indo pra pista");
}

function walkToHideoutPortal(portal) {
  state.run.pendingHideoutPortalId = portal.id;
  state.run.pendingHideoutItemId = null;
  const defaultOffset = portal.x < 90 ? portal.width / 2 + 8 : -portal.width / 2 - 12;
  const approachX = Math.max(64, Math.round(portal.x + Number(portal.approachOffset ?? defaultOffset)));
  combat.moveHideoutTo(approachX);
  showToast("Indo até a cidade.");
}

function walkToIdlePortal(portal) {
  if (!state?.run || state.scene !== "idle") return;
  state.run.pendingIdlePortalId = portal.id;
  state.run.pendingHideoutPortalId = null;
  state.run.pendingHideoutItemId = null;
  const defaultOffset = portal.x < 90 ? portal.width / 2 + 8 : -portal.width / 2 - 12;
  const approachX = Math.max(64, Math.round(portal.x + Number(portal.approachOffset ?? defaultOffset)));
  combat.moveIdleTo(approachX);
  showToast("Indo até a cidade.");
}

function openCityPortalPanel(portal) {
  if (portal.action === "hideout") {
    if (!canUseHideout()) return;
    closeCityInteractions({ render: false });
    closeMaster({ render: false, force: true });
    state.run.pendingCityNpcId = null;
    state.run.pendingCityPortalId = null;
    state.run.cityTargetX = null;
    fadeThen("Entrando no esconderijo.", () => {
      combat.enterHideout();
      dispatchTutorialEvent("scene_entered", { scene: "hideout", from: "city" }, { render: false });
    });
    return;
  }
  if (portal.action !== "assaults") return;
  closeCityShopPanel({ render: false });
  activeCityPortalId = portal.id;
  state.run.pendingCityNpcId = null;
  state.run.pendingCityPortalId = null;
  state.run.cityTargetX = null;
  activeCenter = true;
  activeLeft = "assaults";
  showToast("Portal de assaltos aberto.");
  dispatchTutorialEvent("assaults_opened", {}, { render: false });
  renderAll();
}

function updatePendingCityPortalArrival() {
  if (state.scene !== "city" || state.run.mode !== "city" || !state.run.pendingCityPortalId) return;
  if (Number.isFinite(state.run.cityTargetX)) return;
  const portal = CITY_PORTALS.find((candidate) => candidate.id === state.run.pendingCityPortalId);
  state.run.pendingCityPortalId = null;
  if (!portal) return;
  openCityPortalPanel(portal);
}

function updatePendingHideoutPortalArrival() {
  if (state.scene !== "hideout" || state.run.mode !== "hideout" || !state.run.pendingHideoutPortalId) return;
  if (Number.isFinite(state.run.cityTargetX)) return;
  const portal = HIDEOUT_PORTALS.find((candidate) => candidate.id === state.run.pendingHideoutPortalId);
  state.run.pendingHideoutPortalId = null;
  if (!portal || portal.action !== "city") return;
  closeMaster({ render: false, force: true });
  state.run.cityTargetX = null;
  fadeThen("Voltando para a cidade.", () => {
    combat.enterCity();
    dispatchTutorialEvent("scene_entered", { scene: "city", from: "hideout" }, { render: false });
  });
}

function updatePendingIdlePortalArrival() {
  if (state.scene !== "idle" || !["idle", "temporary"].includes(state.run.mode) || !state.run.pendingIdlePortalId) return;
  if (Number.isFinite(state.run.cityTargetX)) return;
  const portal = IDLE_PORTALS.find((candidate) => (
    candidate.id === state.run.pendingIdlePortalId &&
    candidate.mapId === state.currentMapId
  ));
  state.run.pendingIdlePortalId = null;
  if (!portal || portal.action !== "city") return;
  closeMaster({ render: false, force: true });
  state.run.cityTargetX = null;
  const fromMap = state.currentMapId || "idle";
  fadeThen("Voltando para a cidade.", () => {
    combat.enterCity();
    online?.sayHello();
    dispatchTutorialEvent("scene_entered", { scene: "city", from: fromMap }, { render: false });
  });
}

function updatePendingHideoutHouseArrival() {
  if (state.scene !== "hideout" || state.run.mode !== "hideout" || state.run.pendingHideoutItemId !== "house") return;
  if (Number.isFinite(state.run.cityTargetX)) return;
  state.run.pendingHideoutItemId = null;
  state.run.pendingHideoutPortalId = null;
  openHideoutVault();
}

function closeCityPortalPanel(options = {}) {
  const shouldRender = options.render !== false;
  const hadPortal = Boolean(activeCityPortalId || activeLeft === "assaults");
  activeCityPortalId = null;
  state.run.pendingCityPortalId = null;
  if (activeLeft === "assaults") activeLeft = null;
  if (!activeLeft && !activeRight) activeCenter = false;
  elements.leftWindow.classList.add("hidden");
  if (!activeCenter) elements.inventoryWindow.classList.add("hidden");
  updateMasterToggle();
  if (shouldRender && hadPortal) renderAll();
  return hadPortal;
}

function closeCityInteractions(options = {}) {
  const shouldRender = options.render !== false;
  const closedShop = closeCityShopPanel({ render: false, force: options.force });
  const closedPortal = closeCityPortalPanel({ render: false, force: options.force });
  const closed = Boolean(closedShop || closedPortal);
  if (closed && shouldRender) renderAll();
  return closed;
}

function interactWithNearestCityNpc() {
  if (!state || state.scene !== "city" || state.run.mode !== "city") return;
  const nearest = CITY_NPCS
    .map((npc) => ({ npc, distance: Math.abs((state.run.playerX || 0) - npc.x) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (!nearest) return;
  if (blockWrongTutorialTarget("city_npc", nearest.npc.id)) return;

  if (nearest.distance > 86) {
    walkToCityNpc(nearest.npc);
    return;
  }

  state.run.cityTargetX = null;
  state.run.pendingCityNpcId = null;
  state.run.pendingCityPortalId = null;
  openCityNpcPanel(nearest.npc);
}

function walkToCityNpc(npc) {
  closeCityInteractions({ render: false });
  const approachOffset = (state.run.playerX || 0) <= npc.x ? -48 : 48;
  state.run.pendingCityNpcId = npc.id;
  state.run.pendingCityPortalId = null;
  combat.moveCityTo(npc.x + approachOffset);
  showToast(`Indo ate ${npc.name}.`);
}

function updateTutorialCityNpcArrival() {
  if (state.scene !== "city" || state.run.mode !== "city") return;
  if (Number.isFinite(state.run.cityTargetX)) return;
  const step = tutorialStep(state);
  const visitNpcId = tutorialVisitNpcId(step);
  const openNpcId = tutorialAutoOpenNpcId(step);
  const npcId = visitNpcId || openNpcId;
  if (!npcId) return;
  const npc = CITY_NPCS.find((candidate) => candidate.id === npcId);
  if (!npc) return;
  if (Math.abs((state.run.playerX || 0) - npc.x) > 90) return;

  state.run.pendingCityNpcId = null;
  state.run.pendingCityPortalId = null;
  if (visitNpcId) {
    dispatchTutorialEvent("npc_visited", { npcId }, { render: false });
    renderAll();
    return;
  }
  openCityNpcPanel(npc);
}

function tutorialVisitNpcId(step = tutorialStep(state)) {
  const visits = {
    visit_npc_almeida: "comerciante-itens",
    visit_npc_vendedor: "npc-vendedor"
  };
  return visits[step?.actionRequired] || null;
}

function tutorialAutoOpenNpcId(step = tutorialStep(state)) {
  return step?.actionRequired === "click_npc_zeca" ? "seu-zeca" : null;
}

function updatePendingCityNpcArrival() {
  if (state.scene !== "city" || state.run.mode !== "city" || !state.run.pendingCityNpcId) return;
  if (Number.isFinite(state.run.cityTargetX)) return;
  const npc = CITY_NPCS.find((candidate) => candidate.id === state.run.pendingCityNpcId);
  state.run.pendingCityNpcId = null;
  if (!npc) return;
  openCityNpcPanel(npc);
}

function openCityNpcPanel(npc) {
  if (tutorialVisitNpcId() === npc?.id) {
    state.run.pendingCityNpcId = null;
    state.run.pendingCityPortalId = null;
    dispatchTutorialEvent("npc_visited", { npcId: npc.id }, { render: false });
    renderAll();
    return;
  }
  closeCityPortalPanel({ render: false });
  activeCityNpc = npc;
  shopMode = npc?.role === "drugs" ? "drugs" : "talk";
  activeCityNpcGreeting = cityNpcGreeting(npc);
  restoreTutorialNpcShopMode(npc);
  pendingSellIndexes.clear();
  pendingCraftIndex = null;
  dispatchTutorialEvent("npc_opened", { npcId: npc.id }, { render: false });
  renderAll();
}

function renderCityShopPanel() {
  const panel = ensureCityShopPanel();
  if (!activeCityNpc) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  if (shopMode === "drugs") {
    renderDrugPanel(panel, activeCityNpc);
    return;
  }
  if (shopMode === "buy") {
    renderBuyPanel(panel, activeCityNpc);
    return;
  }
  if (shopMode === "house") {
    renderAssetPanel(panel, activeCityNpc, "house");
    return;
  }
  if (shopMode === "car") {
    renderAssetPanel(panel, activeCityNpc, "car");
    return;
  }
  if (shopMode === "land") {
    renderAssetPanel(panel, activeCityNpc, "land");
    return;
  }
  if (shopMode === "sell") {
    renderSellPanel(panel, activeCityNpc);
    return;
  }
  if (shopMode === "craft") {
    renderCraftPanel(panel, activeCityNpc);
    return;
  }
  if (shopMode === "sell-all-confirm") {
    renderSellAllConfirm(panel, activeCityNpc);
    return;
  }

  panel.innerHTML = `
    <header>
      <span class="eyebrow">${activeCityNpc.name}</span>
      <h2>${activeCityNpc.shopName}</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <p>${activeCityNpc.greeting}</p>
    <div class="city-shop-actions">
      ${activeCityNpc.role === "oldman" ? `
        <button type="button" class="secondary-action" data-shop-mode="land">Comprar Terreno</button>
        <button type="button" class="secondary-action" data-shop-mode="house">Comprar Casa</button>
        <button type="button" class="secondary-action" data-shop-mode="car">Comprar Carro</button>
        <button type="button" class="primary-action" data-shop-mode="sell">Vender</button>
      ` : ""}
      ${activeCityNpc.role === "vendor" ? `
        <button type="button" class="primary-action" data-shop-mode="buy">Itens Aleatorios</button>
        <button type="button" class="primary-action" data-shop-mode="craft">Fundir</button>
      ` : ""}
      ${activeCityNpc.role === "buyer" ? `
        <button type="button" class="primary-action" data-shop-mode="sell">Vender</button>
        <button type="button" class="secondary-action" data-shop-mode="sell-all-confirm">Vender Tudo</button>
      ` : ""}
      ${activeCityNpc.role === "drugs" ? `
        <button type="button" class="primary-action" data-shop-mode="drugs">Comprar</button>
      ` : ""}
      ${activeCityNpc.role === "petshop" ? `
        <button type="button" class="primary-action" data-enter-petshop>Entrar no Petshop</button>
        <button type="button" class="secondary-action" data-shop-close>Agora não</button>
      ` : ""}
      ${activeCityNpc.role !== "oldman" && activeCityNpc.role !== "vendor" && activeCityNpc.role !== "buyer" && activeCityNpc.role !== "drugs" && activeCityNpc.role !== "petshop" ? `<button type="button" class="secondary-action" disabled>Em breve</button>` : ""}
    </div>
  `;
  bindShopPanel(panel);
}

function renderDrugPanel(panel, npc) {
  const stats = calculateStats(state.player);
  const now = Date.now();
  const greeting = activeCityNpcGreeting || cityNpcGreeting(npc);
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${npc.name}</span>
      <h2>${npc.shopName}</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <p>${greeting}</p>
    <div class="drug-shop-list">
      ${DRUG_ITEMS.map((drug) => drugShopRow(drug, stats, now)).join("")}
    </div>
  `;
  bindShopPanel(panel);
  panel.querySelectorAll("[data-buy-drug]").forEach((button) => {
    button.addEventListener("click", () => handleDrugPurchase(button.dataset.buyDrug));
  });
}

function drugShopRow(drug, stats, now) {
  const effect = drugEffectText(drug, state.player, stats);
  const carried = drugInventoryCount(state.player, drug.id);
  return `
    <article class="drug-shop-row">
      <div>
        <h3>${drug.name}</h3>
        <p>${formatMoney(drug.price)} | ${effect}</p>
        <small>Limite ${carried}/5 | Risco ${drug.risk}</small>
      </div>
      <button type="button" class="panel-action" data-buy-drug="${drug.id}">
        Comprar
      </button>
    </article>
  `;
}

function cityNpcGreeting(npc) {
  const greetings = Array.isArray(npc?.greetings) && npc.greetings.length ? npc.greetings : [npc?.greeting || ""];
  return greetings[Math.floor(Math.random() * greetings.length)] || "";
}

function handleDrugPurchase(drugId) {
  if (!state?.player) return;
  const result = buyDrugItem(state.player, drugId);
  if (!result.ok) {
    showToast(result.reason);
    renderCityShopPanel();
    return;
  }

  addLog(state, result.message);
  showToast(result.message);
  persistGame();
  renderAll();
}

function handleInventoryDrugUse(index) {
  if (!state?.player) return;
  const stats = calculateStats(state.player);
  const result = useDrugInventoryItem(state.player, index, stats);
  if (!result.ok) {
    showToast(result.reason);
    renderAll();
    return;
  }

  state.selectedInventoryIndex = null;
  addLog(state, result.message);
  showToast(result.message);
  if (result.died) {
    handleDrugDeath(result);
    return;
  }

  normalizeProgressionSystems(state.player);
  persistGame();
  renderAll();
}

function handleDrugDeath(result) {
  const bill = applyHospitalFee(state.player);
  state.player.hp = 0;
  state.player.needsHideoutRest = true;
  addLog(state, `${result.drug.name}: voce apagou e foi levado para o hospital.`);
  addLog(state, `Taxa hospitalar: ${formatMoney(bill.charged || 0)}.`);
  closeCityShopPanel({ render: false });
  closeMaster({ render: false, force: true });
  combat.enterHospital();
  showHospitalBill(bill);
  persistGame();
  renderAll();
}

function renderBuyPanel(panel, npc) {
  const shop = ensureReceptadorStock(state);
  const refreshCost = getReceptadorRefreshCost(state);
  const secondsLeft = getReceptadorRefreshSecondsLeft();
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${npc.shopName}</span>
      <h2>Itens Aleatorios</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <p>Estoque troca em ${formatTime(secondsLeft)}. Cada oferta tem 1 unidade.</p>
    <div class="shop-sell-grid shop-buy-grid">
      ${shop.stock.map((offer, index) => shopBuyCell(offer, index)).join("")}
    </div>
    <div class="shop-sell-footer">
      <button type="button" class="secondary-action" data-shop-mode="talk">Voltar</button>
      <button type="button" class="secondary-action" data-refresh-shop ${state.player.money >= refreshCost ? "" : "disabled"}>
        Renovar ${formatMoney(refreshCost)}
      </button>
    </div>
  `;
  bindShopPanel(panel);
  panel.querySelectorAll("[data-buy-offer]").forEach((button) => {
    button.addEventListener("click", () => {
      const result = buyReceptadorOffer(state, Number(button.dataset.buyOffer));
      handleResult(result);
      renderAll();
    });
  });
  panel.querySelector("[data-refresh-shop]")?.addEventListener("click", () => {
    const result = refreshReceptadorStock(state, true);
    handleResult(result);
    renderAll();
  });
}

function renderAssetPanel(panel, npc, type) {
  const options = type === "house" ? houseOptions() : type === "car" ? carOptions() : landOptions();
  const title = type === "house" ? "Comprar Casa" : type === "car" ? "Comprar Carro" : "Comprar Terreno";
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${npc.shopName}</span>
      <h2>${title}</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <div class="asset-shop-list">
      ${options.map((asset) => assetShopRow(asset, type)).join("")}
    </div>
    <div class="shop-sell-footer">
      <button type="button" class="secondary-action" data-shop-mode="talk">Voltar</button>
    </div>
  `;
  bindShopPanel(panel);
  panel.querySelectorAll("[data-buy-house]").forEach((button) => {
    button.addEventListener("click", () => {
      const tier = Number(button.dataset.buyHouse);
      if (blockWrongTutorialTarget("asset", `house:${tier}`)) return;
      handleAssetBuy(buyHouse(state.player, tier), "house", tier);
    });
  });
  panel.querySelectorAll("[data-buy-car]").forEach((button) => {
    button.addEventListener("click", () => {
      const tier = Number(button.dataset.buyCar);
      if (blockWrongTutorialTarget("asset", `car:${tier}`)) return;
      handleAssetBuy(buyCar(state.player, tier), "car", tier);
    });
  });
  panel.querySelectorAll("[data-buy-land]").forEach((button) => {
    button.addEventListener("click", () => {
      const tier = Number(button.dataset.buyLand);
      if (blockWrongTutorialTarget("asset", `land:${tier}`)) return;
      handleAssetBuy(buyLand(state.player, tier), "land", tier);
    });
  });
}

function handleAssetBuy(result, assetType, tier) {
  handleResult(result);
  if (result.ok) normalizeProgressionSystems(state.player);
  if (result.ok) dispatchTutorialEvent("asset_bought", { assetType, tier }, { render: false });
  renderAll();
}

function renderCraftPanel(panel, npc) {
  const entries = shopCraftEntries();
  if (!entries.some((entry) => entry.index === pendingCraftIndex)) {
    pendingCraftIndex = entries[0]?.index ?? null;
  }
  const preview = Number.isInteger(pendingCraftIndex) ? getCraftPreview(state.player, pendingCraftIndex) : null;
  const canCraftAny = entries.some((entry) => entry.preview.canCraft);
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${npc.shopName}</span>
      <h2>Fundir equipamentos</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <p>4 itens iguais viram 1 item superior. Para Raro ou acima: 50% de chance de sucesso e 50% de chance de falha. Em caso de falha, voce recupera 1 dos itens gastos.</p>
    <div class="shop-sell-grid shop-craft-grid">
      ${entries.length
        ? entries.map((entry) => shopCraftCell(entry, entry.index === pendingCraftIndex)).join("")
        : `<button type="button" class="shop-sell-cell empty" disabled><span>Nada para fundir</span><small>Junte 4 itens iguais</small></button>`}
    </div>
    <div class="shop-craft-preview">
      ${craftPreviewText(preview)}
    </div>
    <div class="shop-sell-footer">
      <button type="button" class="secondary-action" data-shop-mode="talk">Voltar</button>
      <button type="button" class="primary-action" data-craft-selected ${preview?.canCraft ? "" : "disabled"}>Fundir</button>
      <button type="button" class="primary-action" data-craft-all ${canCraftAny ? "" : "disabled"}>Fundir Tudo</button>
    </div>
  `;
  bindShopPanel(panel);
  panel.querySelectorAll("[data-craft-index]").forEach((cell) => {
    cell.addEventListener("click", () => {
      pendingCraftIndex = Number(cell.dataset.craftIndex);
      renderCityShopPanel();
    });
  });
  panel.querySelector("[data-craft-selected]")?.addEventListener("click", () => {
    const currentPreview = getCraftPreview(state.player, pendingCraftIndex);
    if (!currentPreview?.canCraft) return;
    if (!confirmCraftRisk(currentPreview)) return;
    const result = craftInventoryItem(state.player, pendingCraftIndex);
    handleResult(result);
    renderAll();
  });
  panel.querySelector("[data-craft-all]")?.addEventListener("click", () => {
    const currentEntries = shopCraftEntries();
    if (!confirmCraftAllRisk(currentEntries)) return;
    const result = craftAllInventory(state.player);
    handleResult(result);
    renderAll();
  });
}

function renderSellPanel(panel, npc) {
  const selected = [...pendingSellIndexes].filter((index) => {
    const item = state.player.inventory[index];
    return item && !item.favorite && item.slot !== "drug";
  });
  const total = selected.reduce((sum, index) => sum + itemSellValue(state.player.inventory[index]), 0);
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${npc.shopName}</span>
      <h2>Venda de itens</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <p>Clique nos itens para marcar ou desmarcar. Confirme no final.</p>
    <div class="shop-sell-grid">
      ${state.player.inventory.map((item, index) => shopSellCell(item, index, pendingSellIndexes.has(index))).join("")}
    </div>
    <div class="shop-sell-footer">
      <strong>${selected.length} item(ns) | ${formatMoney(total)}</strong>
      <button type="button" class="secondary-action" data-shop-mode="talk">Voltar</button>
      <button type="button" class="secondary-action" data-shop-mode="sell-all-confirm">Vender Tudo</button>
      <button type="button" class="primary-action" data-shop-confirm-sell ${selected.length ? "" : "disabled"}>Confirmar</button>
    </div>
  `;
  bindShopPanel(panel);
  panel.querySelectorAll("[data-sell-index]").forEach((cell) => {
    cell.addEventListener("click", (event) => {
      event.preventDefault();
      const index = Number(cell.dataset.sellIndex);
      const item = state.player.inventory[index];
      if (!item || item.favorite || item.slot === "drug") return;
      if (pendingSellIndexes.has(index)) pendingSellIndexes.delete(index);
      else pendingSellIndexes.add(index);
      renderCityShopPanel();
    });
  });
  panel.querySelector("[data-shop-confirm-sell]")?.addEventListener("click", () => {
    const items = [...pendingSellIndexes].map((index) => state.player.inventory[index]).filter((item) => item && !item.favorite && item.slot !== "drug");
    if (!confirmSellItems(items)) return;
    const result = sellInventoryItems(state.player, [...pendingSellIndexes]);
    pendingSellIndexes.clear();
    handleResult(result);
    shopMode = "talk";
    renderAll();
  });
}

function renderSellAllConfirm(panel, npc) {
  const items = state.player.inventory.filter((item) => item && !item.favorite && item.slot !== "drug");
  const total = items.reduce((sum, item) => sum + itemSellValue(item), 0);
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${npc.shopName}</span>
      <h2>Vender tudo?</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <p>Deseja vender ${items.length} item(ns) por ${formatMoney(total)}?</p>
    <div class="city-shop-actions">
      <button type="button" class="secondary-action" data-shop-mode="talk">Cancelar</button>
      <button type="button" class="primary-action" data-shop-confirm-all ${items.length ? "" : "disabled"}>Confirmar</button>
    </div>
  `;
  bindShopPanel(panel);
  panel.querySelector("[data-shop-confirm-all]")?.addEventListener("click", () => {
    if (!confirmSellItems(items)) return;
    const result = sellAllInventory(state.player);
    handleResult(result);
    shopMode = "talk";
    renderAll();
  });
}

function bindShopPanel(panel) {
  panel.querySelectorAll("[data-shop-close]").forEach((button) => {
    button.addEventListener("click", () => closeCityShopPanel());
  });
  panel.querySelectorAll("[data-shop-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      if (blockWrongTutorialTarget("shop_mode", button.dataset.shopMode)) return;
      shopMode = button.dataset.shopMode;
      if (shopMode !== "sell") pendingSellIndexes.clear();
      if (shopMode !== "craft") pendingCraftIndex = null;
      dispatchTutorialEvent("shop_mode", { mode: shopMode }, { render: false });
      renderCityShopPanel();
      renderTutorial();
    });
  });
  panel.querySelector("[data-enter-petshop]")?.addEventListener("click", () => {
    if (state.run?.mode === "temporary") {
      showToast(temporaryStayText());
      return;
    }
    closeCityShopPanel({ render: false });
    closeCityPortalPanel({ render: false });
    closeMaster({ render: false, force: true });
    combat.enterIdleMap("petshop", { playerX: 620, logMessage: `Voce entrou em ${idleMapName("petshop")}.` });
    renderAll();
  });
}

function restoreTutorialNpcShopMode(npc) {
  if (npc?.id !== "seu-zeca") return;
  const action = tutorialStep(state)?.actionRequired;
  if (action === "buy_land_1") shopMode = "land";
  if (action === "buy_house_1") shopMode = "house";
  if (action === "buy_car_1") shopMode = "car";
}

function closeCityShopPanel(options = {}) {
  const panel = document.querySelector("#city-shop-panel");
  const hadShop = Boolean(activeCityNpc || (panel && !panel.classList.contains("hidden")));
  if (hadShop && (tutorialStep(state)?.target === "city_shop_panel" || tutorialNeedsCityShopOpen())) {
    lastTutorialSideEffectStep = null;
  }
  activeCityNpc = null;
  activeCityNpcGreeting = "";
  shopMode = "talk";
  pendingSellIndexes.clear();
  pendingCraftIndex = null;
  if (state?.run) state.run.pendingCityNpcId = null;
  panel?.classList.add("hidden");
  if (options.render !== false && hadShop) renderAll();
  return hadShop;
}

function ensureCityShopPanel() {
  let panel = document.querySelector("#city-shop-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "city-shop-panel";
    panel.className = "city-shop-panel hidden";
    document.querySelector(".stage-shell").append(panel);
  }
  return panel;
}

function shopCraftEntries() {
  const seen = new Set();
  return state.player.inventory
    .map((item, index) => {
      if (!item || item.favorite) return null;
      const key = `${item.slot}:${item.rarity}:${item.tier}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const preview = getCraftPreview(state.player, index);
      if (!preview) return null;
      return { index, item, preview };
    })
    .filter(Boolean);
}

function shopCraftCell(entry, selected) {
  const preview = entry.preview;
  const status = preview.result ? `${preview.count}/${preview.needed} -> ${preview.result.name}` : "Item no maximo";
  const risk = preview.failureChance ? " | risco 50%" : "";
  return `
    <button type="button" class="shop-sell-cell shop-craft-cell ${selected ? "selected" : ""} ${preview.canCraft ? "ready" : ""}" data-craft-index="${entry.index}" title="${entry.item.name}">
      <span>${entry.item.name}</span>
      <small>${status}${risk}</small>
    </button>
  `;
}

function craftPreviewText(preview) {
  if (!preview) return `<strong>Selecione um grupo</strong><small>Junte 4 itens iguais para fundir.</small>`;
  if (!preview.result) {
    return `<strong>${preview.item.name}</strong><small>Este item ja esta no maximo.</small>`;
  }
  const risk = preview.failureChance
    ? `<em class="shop-craft-warning">${craftRiskText(preview)}</em>`
    : `<em>Sem chance de falha.</em>`;
  return `
    <strong>${preview.item.name} ${preview.count}/${preview.needed}</strong>
    <small>Resultado: ${preview.result.name} | Custo ${formatMoney(preview.cost)}</small>
    ${risk}
  `;
}

function craftRiskText(preview) {
  const failure = Math.round(Number(preview?.failureChance || 0) * 100);
  const success = Math.max(0, 100 - failure);
  return `${success}% de chance de sucesso e ${failure}% de chance de falha. Em caso de falha, voce recupera 1 dos itens gastos.`;
}

function confirmCraftRisk(preview) {
  if (!preview?.failureChance) return true;
  return window.confirm(`${craftRiskText(preview)} Continuar?`);
}

function confirmCraftAllRisk(entries) {
  const risky = entries.some((entry) => entry.preview.canCraft && entry.preview.failureChance);
  if (!risky) return true;
  return window.confirm("Algumas fusoes tentam criar Raro ou superior. 50% de chance de sucesso e 50% de chance de falha. Em caso de falha, voce recupera 1 dos itens gastos. Continuar?");
}

function shopSellCell(item, index, selected) {
  if (!item) return `<button type="button" class="shop-sell-cell empty" data-sell-index="${index}" disabled></button>`;
  if (item.slot === "drug") {
    return `
      <button type="button" class="shop-sell-cell locked" data-sell-index="${index}" title="${item.name} | Item de uso" disabled>
        <span>${item.name}</span>
        <small>Item de uso</small>
      </button>
    `;
  }
  if (item.favorite) {
    return `
      <button type="button" class="shop-sell-cell locked" data-sell-index="${index}" title="${item.name} | Bloqueado para venda" disabled>
        <i class="item-lock-badge" aria-hidden="true"></i>
        <span>${item.name}</span>
        <small>Bloqueado para venda</small>
      </button>
    `;
  }
  return `
    <button type="button" class="shop-sell-cell ${selected ? "selected" : ""}" data-sell-index="${index}" title="${item.name}">
      <span>${item.name}</span>
      <small>Poder ${itemPower(item)} | ${formatMoney(itemSellValue(item))}</small>
    </button>
  `;
}

function shopBuyCell(offer, index) {
  const item = getItemConfigById(offer.baseId);
  if (!item) return `<button type="button" class="shop-sell-cell empty" disabled></button>`;
  return `
    <button type="button" class="shop-sell-cell ${offer.sold ? "empty" : ""}" data-buy-offer="${index}" title="${item.name}" ${offer.sold ? "disabled" : ""}>
      <span>${offer.sold ? "Vendido" : item.name}</span>
      <small>${item.rarityLabel} T${item.tier} | ${formatMoney(item.precoNPCVende)}</small>
    </button>
  `;
}

function assetShopRow(asset, type) {
  const owned = type === "house"
    ? state.player.ownedHouses.includes(asset.tier)
    : type === "car"
      ? state.player.ownedCars.includes(asset.tier)
      : state.player.terrenosComprados.includes(asset.tier);
  const active = type === "house"
    ? state.player.casaAtual === asset.tier
    : type === "car"
      ? state.player.carroAtual === asset.tier
      : state.player.terrenoAtual === asset.tier;
  const unlocked = canUnlockAsset(state.player, asset);
  const missingLand = (type === "house" || type === "car") && !playerHasOwnedLand();
  const action = type === "house" ? "data-buy-house" : type === "car" ? "data-buy-car" : "data-buy-land";
  const expected = expectedTutorialAssetPurchase(state);
  const isTutorialTarget = expected?.type === type && expected?.tier === asset.tier;
  const blockedByTutorial = Boolean(expected && !isTutorialTarget);
  const disabled = blockedByTutorial || (!isTutorialTarget && (active || !unlocked || (!owned && state.player.money < asset.price)));
  return `
    <article class="asset-shop-row">
      <div>
        <h3>T${asset.tier} ${asset.name}</h3>
        <p>${assetStatsText(asset, type)}</p>
        <small>${missingLand ? "Voce precisa de um terreno mocado antes." : unlocked ? "Disponivel" : assetRequirementText(asset)}</small>
      </div>
      <button type="button" class="panel-action" ${action}="${asset.tier}" ${disabled ? "disabled" : ""}>
        ${active && isTutorialTarget ? "Confirmar" : active ? "Ativo" : owned ? "Ativar" : formatMoney(asset.price)}
      </button>
    </article>
  `;
}

function assetStatsText(asset, type) {
  if (type === "house") {
    return `Renda ${formatMoney(asset.passiveIncomePerMinute)}/min | Stamina +${asset.staminaMaxBonus} | Regen +${asset.staminaRegenBonus}/min`;
  }
  if (type === "car") {
    return `Renda ${formatMoney(asset.passiveIncomePerMinute)}/min | Furto +${asset.furtoBonus}%`;
  }
  return `Espaco ${asset.visualSpace} | Renda +${asset.passiveIncomeBonusPercent}% | Offline +${asset.offlineHoursBonus}h`;
}

function playerHasOwnedLand() {
  return Array.isArray(state.player.terrenosComprados) && state.player.terrenosComprados.length > 0;
}

function cityGroundY() {
  const visual = state.settings.visual || {};
  return Number(visual.maps?.cidade?.groundY ?? visual.groundY ?? 274) + Number(visual.npcYOffset ?? 0);
}

function cityNpcHeight() {
  return Number(state.settings.visual?.npcHeight || 82);
}

function showChoice(target) {
  elements.choiceText.textContent = `${target.name}: "${target.alertLine || "O que pensa que esta fazendo?"}" Se nao escolher em 5s, voce briga automaticamente.`;
  const nextFightNumber = (state.run?.battlesStarted || 0) + 1;
  elements.choiceWarning?.classList.toggle("hidden", nextFightNumber < 2);
  elements.choiceModal.classList.remove("hidden");
}

function hideChoice() {
  elements.choiceWarning?.classList.add("hidden");
  elements.choiceModal.classList.add("hidden");
}

function handleResult(result) {
  if (!result) return;
  if (result.ok) {
    addLog(state, result.message);
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
}

function confirmSellItems(items) {
  const valuable = items.filter((item) => ["epico", "lendario", "mestre"].includes(item?.rarity));
  if (!valuable.length) return true;
  const hasLegendaryOrMaster = valuable.some((item) => item.rarity === "lendario" || item.rarity === "mestre");
  const firstMessage = "Voce esta prestes a vender um item valioso. Essa acao nao pode ser desfeita.";
  if (!window.confirm(firstMessage)) return false;
  if (hasLegendaryOrMaster) {
    return window.confirm("Atencao: este item e extremamente raro e so pode ser obtido por craft avancado. Tem certeza que deseja vender?");
  }
  return true;
}

function showToast(message) {
  if (!elements.toastRegion || !message) return;
  let toast = elements.toastRegion.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
  }
  toast.textContent = message;
  elements.toastRegion.replaceChildren(toast);
  toast.classList.remove("toast-enter");
  void toast.offsetWidth;
  toast.classList.add("toast-enter");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.remove();
    toastTimer = null;
  }, 2800);
}

function showHospitalBill(bill) {
  if (!bill || !elements.hospitalModal) return;
  triggerDeathFlash();
  elements.hospitalTitle.textContent = bill.title || "Você foi apagado!";
  elements.hospitalText.textContent = bill.message || "Atendimento feito. Conta cobrada.";
  elements.hospitalFee.textContent = `Taxa hospitalar: ${formatMoney(bill.charged || 0)}`;
  elements.hospitalModal.classList.remove("hidden");
}

function triggerDeathFlash() {
  if (!elements.deathFlash) return;
  elements.deathFlash.classList.remove("hidden", "active");
  void elements.deathFlash.offsetWidth;
  elements.deathFlash.classList.add("active");
  window.setTimeout(() => {
    elements.deathFlash?.classList.remove("active");
    elements.deathFlash?.classList.add("hidden");
  }, 780);
}

function hideHospitalBill() {
  elements.hospitalModal?.classList.add("hidden");
}

function showSceneMessage(message, duration = 1200) {
  elements.sceneTransitionText.textContent = message;
  elements.sceneTransition.classList.remove("hidden");
  requestAnimationFrame(() => elements.sceneTransition.classList.add("visible"));
  setTimeout(() => {
    elements.sceneTransition.classList.remove("visible");
    setTimeout(() => elements.sceneTransition.classList.add("hidden"), 430);
  }, duration);
}

function fadeThen(message, action) {
  elements.sceneTransitionText.textContent = message;
  elements.sceneTransition.classList.remove("hidden");
  requestAnimationFrame(() => elements.sceneTransition.classList.add("visible"));
  setTimeout(() => {
    action?.();
    renderAll();
    setTimeout(() => {
      elements.sceneTransition.classList.remove("visible");
      setTimeout(() => elements.sceneTransition.classList.add("hidden"), 430);
    }, 650);
  }, 430);
}

function updateMasterToggle() {
  if (!elements.masterToggle) return;
  elements.masterToggle.classList.toggle("active", activeCenter);
  elements.masterToggle.setAttribute("aria-expanded", String(activeCenter));
  elements.masterToggle.setAttribute(
    "aria-label",
    activeCenter ? "Fechar Equipamento e Mochila" : "Abrir Equipamento e Mochila"
  );
}

function syncRaidSummary() {
  const summary = state?.run?.summary;
  const visible = state?.run?.mode === "summary" && summary;
  elements.raidSummary?.classList.toggle("hidden", !visible);
  if (!visible) return;

  elements.raidSummaryTitle.textContent = summary.mapName || "Resumo do roubo";
  elements.raidSummaryMoney.textContent = formatMoney(summary.money || 0);
  elements.raidSummaryXp.textContent = String(summary.xp || 0);
  elements.raidSummaryTargets.textContent = `${summary.targetsRobbed || 0} / ${summary.targetsTotal || 0}`;
  elements.raidSummaryCountdown.textContent = `${Math.ceil(state.run.summaryTimer || 0)}s`;
  const items = [
    ...(summary.items || []).map((item) => `+ ${item}`),
    ...(summary.lostItems || []).map((item) => `${item} perdido: mochila cheia`)
  ];
  elements.raidSummaryItems.textContent = items.length ? items.join(" | ") : "Nenhum item obtido.";
  elements.autoRepeatToggle.checked = Boolean(state.settings.autoRepeatRaid);
}

function remainingTargets(sourceState = state) {
  return (sourceState.run?.npcs || []).filter((npc) => !npc.done).length;
}

function totalTargets(sourceState = state) {
  return sourceState.run?.summary?.targetsTotal || sourceState.run?.npcs?.length || 0;
}

function playerRow() {
  return playerRowForState(state);
}

function playerRowForState(sourceState) {
  return PLAYERS.find((player) => player.id === sourceState?.selectedPlayerId)?.row || 0;
}

function normalizeState() {
  if (!PLAYERS.some((player) => player.id === state.selectedPlayerId)) {
    state.selectedPlayerId = PLAYERS[0].id;
  }
  state.settings ||= {};
  state.settings.visual ||= {};
  state.onlineCityPlayers = [];
  normalizeTutorialState(state, { startIfMissing: false });
  if (!state.settings.visual.version || state.settings.visual.version < 2) {
    state.settings.visual = {
      ...state.settings.visual,
      version: 2,
      groundY: 274,
      playerYOffset: 0,
      npcYOffset: 0,
      maps: {},
      players: {},
      npcs: {}
    };
  }
  state.settings.visual.playerHeight ||= 78;
  state.settings.visual.npcHeight ||= 82;
  state.settings.visual.groundY ||= 274;
  state.settings.visual.playerYOffset ||= 0;
  state.settings.visual.npcYOffset ||= 0;
  state.settings.visual.cameraLead ||= 280;
  state.settings.visual.maps ||= {};
  state.settings.visual.players ||= {};
  state.settings.visual.npcs ||= {};
  state.settings.visual.hideoutItems ||= {};
  state.settings.onlineUrl ||= "ws://localhost:4191";
  const publicSupabaseConfig = window.PROJETO190_SUPABASE || {};
  if (publicSupabaseConfig.url && publicSupabaseConfig.key) {
    state.settings.onlineProvider = "supabase";
    state.settings.supabaseUrl = publicSupabaseConfig.url;
    state.settings.supabaseKey = publicSupabaseConfig.key;
  } else {
    state.settings.onlineProvider ||= "supabase";
    state.settings.supabaseUrl ||= "";
    state.settings.supabaseKey ||= "";
  }
  state.settings.autoRepeatRaid = Boolean(state.settings.autoRepeatRaid);
  state.settings.npcTestDirection ||= "right";
  state.settings.hideoutEditor ||= {};
  state.settings.hideoutEditor.selectedType ||= "house";
  state.settings.hideoutEditor.previewTiers ||= {};
  if (!state.settings.citySpawnAdjustedForAssailant) {
    if (state.scene === "city" && state.run?.mode === "city" && Number(state.run.playerX || 0) < 170) {
      state.run.playerX = 190;
      state.run.cityTargetX = null;
    }
    state.settings.citySpawnAdjustedForAssailant = true;
  }
  state.activeAssaultTier ||= 1;
  state.player.highestMapUnlocked ||= 1;
  state.player.playerId ||= activeProfile?.id || null;
  state.player.username ||= activeProfile?.username || "";
  state.player.isGuest = Boolean(activeProfile?.isGuest || state.player.isGuest);
  state.player.displayName ||= activeProfile?.displayName || "";
  state.player.characterId ||= activeProfile?.characterId || state.selectedPlayerId;
  state.player.factionId ||= activeProfile?.factionId || null;
  state.player.hideoutTier = Number(state.player.hideoutTier || state.player.terrenoAtual || 0);
  state.player.hideoutItems ||= {};
  state.player.needsHideoutRest = Boolean(state.player.needsHideoutRest);
  normalizeDrugState(state.player);
  HIDEOUT_ITEM_TYPES.forEach((item) => {
    state.settings.hideoutEditor.previewTiers[item.id] ||= state.player.hideoutItems[item.id] || 1;
  });
  state.log ||= [];
  state.player.inventory ||= [];
  if (state.player.inventory.length < BACKPACK_TOTAL_SLOTS) {
    state.player.inventory.push(...Array.from({ length: BACKPACK_TOTAL_SLOTS - state.player.inventory.length }, () => null));
  }
  if (state.player.inventory.length > BACKPACK_TOTAL_SLOTS) {
    state.player.inventory = state.player.inventory.slice(0, BACKPACK_TOTAL_SLOTS);
  }
  state.player.inventory = state.player.inventory.map((item) => normalizeDrugInventoryItem(normalizeInventoryItem(item)));
  state.backpackPage = Math.min(BACKPACK_PAGE_COUNT, Math.max(1, Number(state.backpackPage || 1) || 1));
  state.selectedVaultIndex ??= null;
  state.player.equipment ||= {};
  const legacyEquipped = [
    state.player.equipment.feet,
    state.player.equipment.head,
    state.player.equipment.face,
    ...(state.player.equipment.accessories || [])
  ].map((item) => normalizeInventoryItem(item)).filter(Boolean);
  legacyEquipped.forEach((item) => {
    const emptyIndex = state.player.inventory.findIndex((cell) => !cell);
    if (emptyIndex !== -1) state.player.inventory[emptyIndex] = item;
  });
  delete state.player.equipment.feet;
  delete state.player.equipment.head;
  delete state.player.equipment.face;
  delete state.player.equipment.accessories;
  ["weapon", "body", "hands"].forEach((slot) => {
    state.player.equipment[slot] = normalizeInventoryItem(state.player.equipment[slot]) || state.player.equipment[slot] || null;
  });
  ensurePersonalVault();
  if (state.selectedVaultIndex >= PERSONAL_VAULT_SLOTS || !state.player.personalVault.items[state.selectedVaultIndex]) {
    state.selectedVaultIndex = null;
  }
  normalizeProgressionSystems(state.player);
  applyOfflinePassiveIncome(state);
  state.run ||= createNewGame(state.selectedPlayerId || "iris").run;
  state.run.playerDirection ||= "right";
  state.run.cityTargetX ??= null;
  state.run.pendingCityNpcId ??= null;
  state.run.pendingCityPortalId ??= null;
  state.run.pendingHideoutPortalId ??= null;
  state.run.pendingIdlePortalId ??= null;
  state.run.pendingHideoutItemId ??= null;
  state.run.playerAction ??= null;
  state.run.playerActionTimer ||= 0;
  state.run.playerActionDuration ||= 0;
  state.run.caughtInFlagrante ||= 0;
  state.run.battlesStarted ||= 0;
  state.run.nearHideoutHouse ||= false;
  state.run.hideoutRestHint ??= null;
  state.run.choiceTimer ||= 0;
  state.run.damageNumbers ||= [];
  state.run.itemTheftChats ||= [];
  state.run.groundLoots ||= [];
  state.run.decorativeNpcs ||= [];
  state.run.policeTimer ||= 0;
  state.run.policeMessage ??= null;
  state.run.policeScene ??= null;
  state.run.temporaryStay ??= null;
  state.run.summary ??= null;
  state.run.summaryTimer ||= 0;
}

function applyVisualCalibration() {
  const calibration = loadVisualCalibration();
  if (calibration) {
    state.settings.visual = {
      ...state.settings.visual,
      ...calibration,
      maps: {
        ...(state.settings.visual.maps || {}),
        ...(calibration.maps || {})
      },
      players: {
        ...(state.settings.visual.players || {}),
        ...(calibration.players || {})
      },
      hideoutItems: {
        ...(state.settings.visual.hideoutItems || {}),
        ...(calibration.hideoutItems || {})
      },
      npcs: {
        ...(state.settings.visual.npcs || {}),
        ...(calibration.npcs || {})
      }
    };
  }
}

function updateVisualSetting(key, value) {
  const visual = state.settings.visual;
  if (key === "groundY") {
    const mapKey = state.scene === "map"
      ? state.currentMapId
      : state.scene === "idle"
        ? state.currentMapId
      : state.scene === "hideout"
        ? `esconderijo-${state.player.hideoutTier || 1}`
        : "cidade";
    visual.maps[mapKey] ||= {};
    visual.maps[mapKey].groundY = value;
    return;
  }

  if (key === "playerYOffset") {
    visual.players[state.selectedPlayerId] ||= {};
    visual.players[state.selectedPlayerId].y = value;
    return;
  }

  visual[key] = value;
}

function formatMoney(value) {
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
}

function formatHudMoney(value) {
  return `R$${formatHudNumber(value)}`;
}

function formatHudNumber(value) {
  const number = Math.round(value || 0);
  const abs = Math.abs(number);
  const compact = (divisor, suffix) => {
    const maximumFractionDigits = abs >= divisor * 10 ? 0 : 1;
    return `${(number / divisor).toLocaleString("pt-BR", { maximumFractionDigits })}${suffix}`;
  };
  if (abs >= 1_000_000_000) return compact(1_000_000_000, "B");
  if (abs >= 1_000_000) return compact(1_000_000, "M");
  if (abs >= 1_000) return compact(1_000, "K");
  return number.toLocaleString("pt-BR");
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function temporaryStayText() {
  const stay = state?.run?.temporaryStay;
  if (!stay) return "Saida bloqueada temporariamente.";
  return `${stay.label}: ${formatTime(stay.remaining)}`;
}

function idleMapName(mapId) {
  return IDLE_MAPS.find((map) => map.id === mapId)?.name || "mapa";
}

function modeLabel(mode) {
  return {
    city: "Cidade inicial",
    hideout: "Esconderijo",
    idle: "Mapa livre",
    temporary: "Retencao temporaria",
    seeking: "Procurando alvo",
    approaching: "Aproximando por tras",
    stealing: "Tentativa de roubo",
    choice: "Alvo percebeu",
    combat: "Briga em andamento",
    returning: "Voltando",
    summary: "Resumo do assalto",
    "npc-test": "Teste visual"
  }[mode] || "Em movimento";
}

function actionLabel(mode, map) {
  if (mode === "city") return "Clique na cidade para caminhar ou abra Assaltos";
  if (mode === "hideout") return "Clique no chao para andar pelo esconderijo";
  if (mode === "idle") return `Caminhe pelo mapa ${map?.name || ""}`;
  if (mode === "temporary") return temporaryStayText();
  if (mode === "seeking") return "Caminhando pelo cenario em busca de NPCs";
  if (mode === "approaching") return "Seguindo o alvo sem chamar atencao";
  if (mode === "stealing") return "Chance base de roubo com bonus de equipamentos";
  if (mode === "choice") return "Escolha fugir ou brigar";
  if (mode === "combat") return `Combate idle no mapa ${map?.code || ""}`;
  if (mode === "returning") return "Voltando para o esconderijo";
  if (mode === "summary") return "Confira o loot ou repita o assalto";
  if (mode === "npc-test") return "Conferindo mapa, recorte e posicionamento dos NPCs";
  return "Idle ativo";
}

elements.masterToggle?.addEventListener("click", toggleMaster);
elements.canvas.addEventListener("pointerdown", handleStagePointer);
document.addEventListener("keydown", handleGameKeyDown);
document.addEventListener("keyup", handleGameKeyUp);
window.addEventListener("blur", clearKeyboardMovement);
document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
}, { capture: true });

function round(value) {
  return Math.round(value * 100) / 100;
}

elements.saveButton.addEventListener("click", () => {
  if (!state) return;
  if (state.settings.visualPreview) {
    saveVisualCalibration(state.settings.visual);
    showToast("Calibracao visual salva para o jogo.");
    return;
  }
  persistGame();
  showToast("Jogo salvo.");
});

elements.fleeButton.addEventListener("click", () => {
  hideChoice();
  combat.chooseFlee();
});

elements.fightButton.addEventListener("click", () => {
  hideChoice();
  combat.chooseFight();
});

elements.hospitalClose?.addEventListener("click", hideHospitalBill);
elements.hospitalModal?.addEventListener("click", (event) => {
  if (event.target === elements.hospitalModal) hideHospitalBill();
});

elements.raidRepeatButton?.addEventListener("click", () => {
  combat.repeatLastRaid();
  renderAll();
});

elements.raidReturnButton?.addEventListener("click", () => {
  combat.returnFromSummary();
  renderAll();
});

elements.autoRepeatToggle?.addEventListener("change", () => {
  state.settings.autoRepeatRaid = elements.autoRepeatToggle.checked;
  syncRaidSummary();
  showToast(state.settings.autoRepeatRaid ? "Auto repetir ativado." : "Auto repetir desativado.");
});
