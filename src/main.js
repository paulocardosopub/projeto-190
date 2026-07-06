import { DEFAULT_PLAYER_ID, PLAYERS } from "./data/players/index.js?v=players-16";
import { HIDEOUTS, IDLE_MAPS, MAPS } from "./data/maps/index.js?v=spawn-height-1";
import { NPC_TYPES } from "./data/enemies/index.js?v=npc-crops-1";
import { CITY_NPCS } from "./data/cityNpcs/index.js?v=petshop-portal-1";
import { CITY_PORTALS, HIDEOUT_PORTALS, IDLE_PORTALS } from "./data/cityPortals/index.js?v=petshop-portal-1";
import { HIDEOUT_ITEM_TIERS, HIDEOUT_ITEM_TYPES, hideoutItemCost, hideoutItemHeight, hideoutItemPlacementDefault, hideoutItemType } from "./data/hideoutItems/index.js?v=hideout-items-7";
import { CombatSystem, policePrisonChanceForFight } from "./systems/CombatSystem/index.js?v=stack-1";
import { calculateStats, calculateStealChancePercent, itemPower } from "./systems/EquipmentSystem/index.js?v=equipment-2";
import {
  buyDrugItem,
  DRUG_ITEMS,
  drugEffectText,
  drugInventoryCount,
  HIDEOUT_STAMINA_RECOVERY_CONFIG,
  isDrugInventoryItem,
  normalizeDrugInventoryItem,
  useDrugInventoryItem,
  normalizeDrugState
} from "./systems/DrugSystem/index.js?v=stack-1";
import { applyHospitalFee } from "./systems/PenaltySystem/index.js?v=hospital-fee-1";
import {
  addItem,
  compactInventoryStacks,
  createItem,
  craftAllInventory,
  craftInventoryItem,
  equipBestAvailable,
  equipFromInventory,
  getCraftPreview,
  itemQuantity,
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
} from "./systems/InventorySystem/index.js?v=stack-1";
import { createNewGame, addLog } from "./systems/PlayerSystem/index.js?v=players-16";
import {
  applyProfileToState,
  createAccount,
  createGuestSession,
  clearActiveSession,
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
  leaveFaction,
  resetPlayerFaction
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
} from "./systems/ShopSystem/index.js?v=stack-1";
import {
  AUTO_RAID_UNLOCK_LEVEL,
  BUSINESS_CONFIG,
  BUSINESS_MAP_ID,
  BUSINESS_UNLOCK_LEVEL,
  SELLABLE_BUSINESS_PRODUCTS,
  businessProductConfig
} from "./data/business/index.js";
import {
  activeProductionLabel,
  businessCapacity,
  businessStockForSource,
  buyFarm,
  buyLab,
  calculateProduction,
  canProduceBusinessProduct,
  collectFarmProduction,
  collectLabProduction,
  normalizeBusinessState,
  productionRatePerHour,
  startFarmProduction,
  startLabProduction,
  stockAmount,
  upgradeFarm,
  upgradeLab
} from "./systems/BusinessSystem/index.js";
import {
  buyFromShop,
  closeShop,
  createShop,
  getPlayerActiveShop,
  getShopById,
  normalizePlayerShopState,
  syncShopNpcsForBusinessMap
} from "./systems/PlayerShopSystem/index.js";
import {
  CHARACTER_SELECT_TUTORIAL,
  TutorialOverlay,
  advanceTutorialStep,
  canRewindTutorialStep,
  completeTutorial,
  expectedTutorialAssetPurchase,
  handleTutorialEvent,
  isTutorialTargetAllowed,
  normalizeTutorialState,
  rewindTutorialStep,
  skipTutorial,
  tutorialNudgeLine,
  tutorialStep
} from "./systems/TutorialSystem/index.js?v=tutorial-shortcut-1";
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
  hideoutRestCooldown,
  houseOptions,
  landOptions,
  normalizeProgressionSystems,
  restNow,
  staminaRaidBlockedMessage,
  staminaPercent,
  staminaState,
  updatePassiveIncome
} from "./systems/StaminaSystem/index.js?v=asset-lock-1";
import { getCarConfig, getHouseConfig, getItemConfigById, getLandConfig } from "./data/balance/index.js?v=asset-lock-1";
import { PETS, PET_UNLOCK_LEVEL, STARTER_PET_ID, buyPet, equipPet, normalizePets, petPrice, petStatus, petsUnlocked, unequipPet } from "./data/pets/index.js?v=pets-manual-1";
import { SpriteRenderer } from "./ui/SpriteRenderer.js?v=players-16";
import {
  renderCharacterSelect,
  renderConfigWindow,
  renderInventoryWindow,
  renderVaultWindow,
  renderPanel
} from "./ui/WindowSystem.js?v=players-16";

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
  raidMapLabel: document.querySelector("#raid-map-label"),
  raidTimerLabel: document.querySelector("#raid-timer-label"),
  raidCountLabel: document.querySelector("#raid-count-label"),
  raidCaughtRiskLabel: document.querySelector("#raid-caught-risk-label"),
  raidSummary: document.querySelector("#raid-summary"),
  raidSummaryTitle: document.querySelector("#raid-summary-title"),
  raidSummaryMoney: document.querySelector("#raid-summary-money"),
  raidSummaryXp: document.querySelector("#raid-summary-xp"),
  raidSummaryTargets: document.querySelector("#raid-summary-targets"),
  raidSummaryCountdown: document.querySelector("#raid-summary-countdown"),
  raidSummaryItems: document.querySelector("#raid-summary-items"),
  raidRepeatButton: document.querySelector("#raid-repeat-button"),
  raidReturnButton: document.querySelector("#raid-return-button"),
  raidNextButton: document.querySelector("#raid-next-button"),
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
  choicePrisonRisk: document.querySelector("#choice-prison-risk"),
  fleeButton: document.querySelector("#flee-button"),
  fightButton: document.querySelector("#fight-button"),
  fightAutoTimer: document.querySelector("#fight-auto-timer"),
  hospitalModal: document.querySelector("#hospital-modal"),
  hospitalTitle: document.querySelector("#hospital-title"),
  hospitalText: document.querySelector("#hospital-text"),
  hospitalFee: document.querySelector("#hospital-fee"),
  hospitalClose: document.querySelector("#hospital-close"),
  deathFlash: document.querySelector("#death-flash"),
  saveButton: document.querySelector("#save-button"),
  masterToggle: document.querySelector("#master-toggle"),
  autoRaidToggle: document.querySelector("#auto-raid-toggle"),
  autoRaidPanel: document.querySelector("#auto-raid-panel"),
  autoRaidTitle: document.querySelector("#auto-raid-title"),
  autoRaidMapLabel: document.querySelector("#auto-raid-map-label"),
  autoRaidRepeatToggle: document.querySelector("#auto-raid-repeat-toggle"),
  autoRaidCancel: document.querySelector("#auto-raid-cancel"),
  autoRaidConfirm: document.querySelector("#auto-raid-confirm"),
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
let viewportRenderTimer = null;
let activeProfile = null;
let bootOptions = null;
let characterSelectionMode = "new";
let tutorialOverlay = null;
let characterTutorialVisible = false;
let lastTutorialSideEffectStep = null;
let cloudSavePending = false;
let sessionCheckTimer = 0;
let sessionCheckInFlight = false;
let inventoryPointerX = 0;
let inventoryPointerY = 0;
let inventoryCursorGhost = null;

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
const BACKGROUND_TICK_MS = 1000;
const DETAILED_GAME_STEP_SECONDS = 0.05;
const SIMPLE_GAME_STEP_SECONDS = 1;
const PET_TUTORIAL_FIRST_STEP = "pet_city";
const PET_TUTORIAL_STEPS = [
  {
    id: "pet_city",
    message: "Pets liberados no nivel 5. Fala com o Dr. Rubens no petshop para adotar teu primeiro parceiro.",
    buttonLabel: "Ir ao petshop",
    target: "npc_petshop",
    actionRequired: "visit_petshop_city",
    passiveButton: true,
    allowSkip: true,
    next: "pet_enter"
  },
  {
    id: "pet_enter",
    message: "O atendente te leva para dentro do petshop. Entra la antes que a oportunidade fuja.",
    buttonLabel: "Entrar",
    target: "city_shop_panel",
    actionRequired: "enter_petshop",
    passiveButton: true,
    allowSkip: true,
    next: "pet_inside"
  },
  {
    id: "pet_inside",
    message: "La dentro, fala com o Dr. Rubens. Ele cuida das adocoes.",
    buttonLabel: "Falar",
    target: "idle_petshop_npc",
    actionRequired: "talk_petshop_owner",
    passiveButton: true,
    allowSkip: true,
    next: "pet_dogs"
  },
  {
    id: "pet_dogs",
    message: "Nos assaltos, alguns doguinhos podem gostar de voce. Quando isso acontecer, eles soltam coracoes e ficam liberados aqui no Petshop.",
    buttonLabel: "Entendi",
    target: "stage",
    allowSkip: true,
    next: "pet_unlock"
  },
  {
    id: "pet_unlock",
    message: "Liberado nao e adotado. O cachorro aparece no Petshop, mas so vira teu parceiro depois que voce comprar ou adotar no balcao.",
    buttonLabel: "Boa",
    target: "stage",
    allowSkip: true,
    next: "pet_sequence"
  },
  {
    id: "pet_sequence",
    message: "A ordem importa: adota um cachorro para o proximo poder gostar de voce nos mapas. So cachorro comprado conta nessa progressao.",
    buttonLabel: "Fechou",
    target: "stage",
    allowSkip: true,
    next: "pet_buy"
  },
  {
    id: "pet_buy",
    message: "Adota teu primeiro parceiro no balcao. Ele so aparece contigo depois disso.",
    buttonLabel: "Adotar",
    target: "pet_shop_starter",
    actionRequired: "buy_starter_pet",
    passiveButton: true,
    allowSkip: true
  }
];
const PET_TUTORIAL_STEP_BY_ID = Object.fromEntries(PET_TUTORIAL_STEPS.map((step) => [step.id, step]));
const BUSINESS_TUTORIAL_FIRST_STEP = "business_city";
const BUSINESS_TUTORIAL_STEPS = [
  {
    id: "business_city",
    message: "Nivel 10 liberou negocios. Fala com o Mendigo Fumante para conhecer o esquema.",
    buttonLabel: "Ir ao contato",
    target: "npc_business_contact",
    actionRequired: "visit_business_contact",
    passiveButton: true,
    allowSkip: true,
    next: "business_enter"
  },
  {
    id: "business_enter",
    message: "Ele conhece um lugar onde ficam fazendas, laboratorios e lojinhas de jogadores.",
    buttonLabel: "Entrar",
    target: "city_shop_panel",
    actionRequired: "enter_business_map",
    passiveButton: true,
    allowSkip: true,
    next: "business_owner"
  },
  {
    id: "business_owner",
    message: "La dentro, fala com o Empresario. Ele abre o painel dos negocios.",
    buttonLabel: "Falar",
    target: "idle_business_npc",
    actionRequired: "talk_business_owner",
    passiveButton: true,
    allowSkip: true,
    next: "business_panel"
  },
  {
    id: "business_panel",
    message: "Aqui voce compra fazenda, laboratorio, inicia producao e organiza tua lojinha.",
    buttonLabel: "Entendi",
    target: "business_panel",
    allowSkip: true,
    next: "business_shops"
  },
  {
    id: "business_shops",
    message: "Lojas de jogadores aparecem como NPCs nesse mapa. Se tiver uma aberta, toque nela para ver e comprar.",
    buttonLabel: "Fechou",
    target: "player_shop_panel",
    allowSkip: true
  }
];
const BUSINESS_TUTORIAL_STEP_BY_ID = Object.fromEntries(BUSINESS_TUTORIAL_STEPS.map((step) => [step.id, step]));

await renderer.load();
await boot();
lastTime = performance.now();
requestAnimationFrame(tick);
window.setInterval(runBackgroundTick, BACKGROUND_TICK_MS);

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
    state = createNewGame(DEFAULT_PLAYER_ID);
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

  if (state && needsCharacterSelection(state, activeProfile)) {
    showCharacterSelection("existing");
    return;
  }

  if (!state && !isValidPlayerId(activeProfile.characterId)) {
    showCharacterSelection("new");
    return;
  }

  if (!state && activeProfile.characterId) {
    state = createNewGame(activeProfile.characterId);
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
  const previewState = state || createNewGame(activeProfile?.characterId || DEFAULT_PLAYER_ID);
  const initialPlayerId = normalizePlayerId(previewState.selectedPlayerId || previewState.player?.characterId);
  renderCharacterSelect(elements.characterGrid, renderer, completeCharacterSelection, initialPlayerId);
  renderer.draw(previewState, playerRowForState(previewState));
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
document.addEventListener("pointerdown", updateInventoryPointer);
document.addEventListener("pointermove", updateInventoryPointer);
function updateInventoryPointer(event) {
  inventoryPointerX = event.clientX;
  inventoryPointerY = event.clientY;
  syncInventoryCursorGhost();
}
document.addEventListener("visibilitychange", () => {
  runGameClock(performance.now(), { render: document.visibilityState !== "hidden" });
  if (document.visibilityState === "hidden") persistGame({ keepalive: true });
});

function tick(now) {
  runGameClock(now, { render: true });
  requestAnimationFrame(tick);
}

function runBackgroundTick() {
  if (document.visibilityState !== "hidden") return;
  runGameClock(performance.now(), { render: false });
}

function runGameClock(now, options = {}) {
  const dt = Math.max(0, (now - lastTime) / 1000);
  lastTime = now;

  if (state && combat) {
    advanceGameTime(dt);
    flushAutosave();
    if (options.render !== false) {
      renderer.draw(state, playerRow());
      syncHud();
      syncChoiceTimer();
      renderTutorial();
    }
  }
}

function advanceGameTime(seconds) {
  let remaining = Math.max(0, Number(seconds || 0));
  let safety = 0;
  while (remaining > 0.0001 && safety < 200000) {
    const step = Math.min(remaining, gameStepSeconds());
    advanceGameStep(step);
    remaining -= step;
    safety += 1;
  }
}

function gameStepSeconds() {
  const mode = state?.run?.mode;
  if (state?.scene === "map") return DETAILED_GAME_STEP_SECONDS;
  if (["combat", "choice", "approaching", "stealing", "collectingLoot", "summary"].includes(mode)) {
    return DETAILED_GAME_STEP_SECONDS;
  }
  return SIMPLE_GAME_STEP_SECONDS;
}

function advanceGameStep(dt) {
  combat.update(dt);
  online?.update(dt);
  updatePassiveIncome(state, dt);
  calculateProduction(state.player);
  syncShopNpcsForBusinessMap(state);
  updateHideoutRestRecovery(dt);
  updateTutorialCityNpcArrival();
  updatePendingCityNpcArrival();
  updatePendingCityPortalArrival();
  updatePendingHideoutPortalArrival();
  updatePendingIdlePortalArrival();
  updatePendingIdleNpcArrival();
  updatePendingHideoutHouseArrival();
  saveTimer += dt;
  if (!state.settings.visualPreview) updateSessionGuard(dt);
}

function flushAutosave() {
  if (state.settings.visualPreview || saveTimer <= 8) return;
  saveTimer = 0;
  persistGame();
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
  syncInventoryCursorGhost();
}

function updateWindowLayerState() {
  elements.windowLayer.classList.toggle("has-center-window", activeCenter);
  elements.windowLayer.classList.toggle("has-left-window", Boolean(activeLeft));
  elements.windowLayer.classList.toggle("has-right-window", Boolean(activeRight));
}

function handleViewportChange() {
  clearTimeout(viewportRenderTimer);
  viewportRenderTimer = window.setTimeout(() => {
    applyWindowLayout();
    if (state) renderAll();
  }, 120);
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
      if (isPetTutorialStep(step)) {
        advancePetTutorial();
        return;
      }
      if (isBusinessTutorialStep(step)) {
        advanceBusinessTutorial();
        return;
      }
      advanceActiveTutorial();
    },
    onBack: (step) => {
      if (isPetTutorialStep(step)) {
        rewindPetTutorial();
        return;
      }
      if (isBusinessTutorialStep(step)) {
        rewindBusinessTutorial();
        return;
      }
      rewindActiveTutorial();
    },
    onSkip: (step) => {
      if (isPetTutorialStep(step)) {
        skipPetTutorial();
        return;
      }
      if (isBusinessTutorialStep(step)) {
        skipBusinessTutorial();
        return;
      }
      skipActiveTutorial();
    },
    onPassive: (step) => {
      if (isPetTutorialStep(step)) {
        performPetTutorialAction(step);
        return;
      }
      if (isBusinessTutorialStep(step)) {
        performBusinessTutorialAction(step);
        return;
      }
      performTutorialPrimaryAction(step);
    }
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
  const mainStep = tutorialStep(state);
  if (mainStep) {
    ensureTutorialOverlay().render(mainStep, { canGoBack: canRewindTutorialStep(state) });
    return;
  }

  maybeStartPetTutorial();
  const petStep = activePetTutorialStep();
  if (petStep) {
    ensureTutorialOverlay().render(petStep, { canGoBack: canRewindPetTutorial() });
    return;
  }

  maybeStartBusinessTutorial();
  const businessStep = activeBusinessTutorialStep();
  ensureTutorialOverlay().render(businessStep, { canGoBack: canRewindBusinessTutorial() });
}

function advanceActiveTutorial() {
  if (!state) return;
  commitTutorialChange(advanceTutorialStep(state));
}

function rewindActiveTutorial() {
  if (!state) return;
  commitTutorialChange(rewindTutorialStep(state));
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
    startRaid(MAPS[0]?.id, { tutorialFirstRaid: true });
    return;
  }
  if (action === "complete_first_raid") {
    if (state.run?.mode === "summary" && state.run?.summary) {
      combat.returnFromSummary();
      renderAll();
      return;
    }
    showToast("Termine o primeiro assalto e retorne para a cidade.");
    return;
  }

  showToast(tutorialNudgeLine());
}

function performPetTutorialAction(step) {
  if (!state || !combat || !step?.actionRequired) {
    showToast("Siga o marcador do petshop.");
    return;
  }

  const action = step.actionRequired;
  if (action === "visit_petshop_city") {
    moveToTutorialCityNpc("npc-petshop");
    return;
  }
  if (action === "enter_petshop") {
    if (state.scene === "city" && activeCityNpc?.id === "npc-petshop") {
      enterPetshopFromCityNpc();
      return;
    }
    moveToTutorialCityNpc("npc-petshop");
    return;
  }
  if (action === "talk_petshop_owner") {
    if (state.scene !== "idle" || state.currentMapId !== "petshop") {
      showToast("Entre no petshop para falar com o Dr. Rubens.");
      return;
    }
    const npc = (state.run?.npcs || []).find((candidate) => candidate.id === "petshop-responsavel");
    if (!npc) return;
    if (activeCityNpc?.id === npc.id) {
      dispatchPetTutorialEvent("petshop_owner_opened");
      return;
    }
    walkToIdleNpc(npc);
    return;
  }
  if (action === "buy_starter_pet") {
    if (activeCityNpc?.id !== "petshop-responsavel" || shopMode !== "pets") {
      const npc = (state.run?.npcs || []).find((candidate) => candidate.id === "petshop-responsavel");
      if (state.scene === "idle" && state.currentMapId === "petshop" && npc) {
        walkToIdleNpc(npc);
      } else {
        showToast("Fale com o Dr. Rubens no petshop.");
      }
      return;
    }
    const result = buyPet(state.player, STARTER_PET_ID);
    handlePetResult(result, { action: "buy", petId: STARTER_PET_ID });
    return;
  }

  showToast("Siga o marcador do petshop.");
}

function performBusinessTutorialAction(step) {
  if (!state || !combat || !step?.actionRequired) {
    showToast("Siga o marcador dos negocios.");
    return;
  }

  const action = step.actionRequired;
  if (action === "visit_business_contact") {
    moveToTutorialCityNpc("npc-mendigo-fumante");
    return;
  }
  if (action === "enter_business_map") {
    if (state.scene === "city" && activeCityNpc?.id === "npc-mendigo-fumante") {
      enterBusinessMapFromCityNpc();
      return;
    }
    moveToTutorialCityNpc("npc-mendigo-fumante");
    return;
  }
  if (action === "talk_business_owner") {
    if (state.scene !== "idle" || state.currentMapId !== BUSINESS_MAP_ID) {
      if (state.scene === "city" && activeCityNpc?.id === "npc-mendigo-fumante") {
        enterBusinessMapFromCityNpc();
      } else {
        moveToTutorialCityNpc("npc-mendigo-fumante");
      }
      return;
    }
    const npc = (state.run?.npcs || []).find((candidate) => candidate.id === "npc-empresario-negocios");
    if (!npc) return;
    if (activeCityNpc?.id === npc.id) {
      openBusinessPanels(npc);
      dispatchBusinessTutorialEvent("business_owner_opened", {}, { render: false });
      return;
    }
    walkToIdleNpc(npc);
    return;
  }

  showToast("Siga o marcador dos negocios.");
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

function isPetTutorialStep(step) {
  return Boolean(step?.id && PET_TUTORIAL_STEP_BY_ID[step.id]);
}

function maybeStartPetTutorial() {
  if (!state?.player || tutorialStep(state) || characterTutorialVisible) return;
  normalizePets(state.player, { silent: true });
  if (starterPetOwned()) {
    completePetTutorial({ render: false, persist: false });
    return;
  }
  if (state.player.petTutorialCompleted || state.player.petTutorialSkipped) return;
  if (!petsUnlocked(state.player)) return;
  if (state.player.petTutorialActive) {
    if (!PET_TUTORIAL_STEP_BY_ID[state.player.petTutorialStep]) {
      state.player.petTutorialStep = PET_TUTORIAL_FIRST_STEP;
    }
    return;
  }
  if (state.scene !== "city" || state.run?.mode !== "city") return;
  state.player.petTutorialActive = true;
  state.player.petTutorialStep = activeCityNpc?.id === "npc-petshop" ? "pet_enter" : PET_TUTORIAL_FIRST_STEP;
  addLog(state, "Pets liberados. Fale com o responsavel do petshop.");
  if (!state.settings?.visualPreview) persistGame();
}

function activePetTutorialStep() {
  if (!state?.player?.petTutorialActive) return null;
  if (starterPetOwned()) {
    completePetTutorial({ render: false, persist: true });
    return null;
  }
  const step = PET_TUTORIAL_STEP_BY_ID[state.player.petTutorialStep] || PET_TUTORIAL_STEP_BY_ID[PET_TUTORIAL_FIRST_STEP];
  state.player.petTutorialStep = step.id;
  return step;
}

function advancePetTutorial(options = {}) {
  const step = activePetTutorialStep();
  if (!step) return false;
  if (!step.next) return completePetTutorial(options);
  state.player.petTutorialStep = step.next;
  return commitPetTutorialChange(options);
}

function rewindPetTutorial(options = {}) {
  const step = activePetTutorialStep();
  if (!step) return false;
  const index = PET_TUTORIAL_STEPS.findIndex((candidate) => candidate.id === step.id);
  if (index <= 0) return false;
  state.player.petTutorialStep = PET_TUTORIAL_STEPS[index - 1].id;
  return commitPetTutorialChange(options);
}

function canRewindPetTutorial() {
  const step = activePetTutorialStep();
  return PET_TUTORIAL_STEPS.findIndex((candidate) => candidate.id === step?.id) > 0;
}

function skipPetTutorial(options = {}) {
  if (!state?.player) return false;
  state.player.petTutorialActive = false;
  state.player.petTutorialSkipped = true;
  state.player.petTutorialStep = null;
  return commitPetTutorialChange(options);
}

function completePetTutorial(options = {}) {
  if (!state?.player) return false;
  state.player.petTutorialActive = false;
  state.player.petTutorialCompleted = true;
  state.player.petTutorialStep = null;
  return commitPetTutorialChange(options);
}

function commitPetTutorialChange(options = {}) {
  if (!state?.settings?.visualPreview && options.persist !== false) persistGame();
  if (options.render !== false) renderAll();
  return true;
}

function dispatchPetTutorialEvent(type, payload = {}, options = {}) {
  const step = activePetTutorialStep();
  if (!step) return false;
  const nextByEvent = {
    petshop_city_opened: { from: "pet_city", next: "pet_enter" },
    petshop_entered: { from: "pet_enter", next: "pet_inside" },
    petshop_owner_opened: { from: "pet_inside", next: "pet_dogs" }
  }[type];
  if (nextByEvent && step.id === nextByEvent.from) {
    state.player.petTutorialStep = nextByEvent.next;
    return commitPetTutorialChange(options);
  }
  if (type === "starter_pet_bought" && step.id === "pet_buy") {
    return completePetTutorial(options);
  }
  return false;
}

function starterPetOwned() {
  return Boolean(
    state?.player?.petStarterClaimed ||
    (Array.isArray(state?.player?.petsOwned) && state.player.petsOwned.includes(STARTER_PET_ID))
  );
}

function isBusinessTutorialStep(step) {
  return Boolean(step?.id && BUSINESS_TUTORIAL_STEP_BY_ID[step.id]);
}

function maybeStartBusinessTutorial() {
  if (!state?.player || tutorialStep(state) || characterTutorialVisible) return;
  if (!businessUnlocked(state.player)) return;
  if (state.player.businessTutorialCompleted || state.player.businessTutorialSkipped) return;
  if (state.player.businessTutorialActive) {
    if (!BUSINESS_TUTORIAL_STEP_BY_ID[state.player.businessTutorialStep]) {
      state.player.businessTutorialStep = BUSINESS_TUTORIAL_FIRST_STEP;
    }
    return;
  }
  if (state.scene !== "city" || state.run?.mode !== "city") return;
  state.player.businessTutorialActive = true;
  state.player.businessTutorialStep = activeCityNpc?.id === "npc-mendigo-fumante" ? "business_enter" : BUSINESS_TUTORIAL_FIRST_STEP;
  addLog(state, "Negocios liberados. Fale com o Mendigo Fumante.");
  if (!state.settings?.visualPreview) persistGame();
}

function activeBusinessTutorialStep() {
  if (!state?.player?.businessTutorialActive) return null;
  if (!businessUnlocked(state.player)) return null;
  const step = BUSINESS_TUTORIAL_STEP_BY_ID[state.player.businessTutorialStep] || BUSINESS_TUTORIAL_STEP_BY_ID[BUSINESS_TUTORIAL_FIRST_STEP];
  state.player.businessTutorialStep = step.id;
  return step;
}

function advanceBusinessTutorial(options = {}) {
  const step = activeBusinessTutorialStep();
  if (!step) return false;
  if (!step.next) return completeBusinessTutorial(options);
  state.player.businessTutorialStep = step.next;
  return commitBusinessTutorialChange(options);
}

function rewindBusinessTutorial(options = {}) {
  const step = activeBusinessTutorialStep();
  if (!step) return false;
  const index = BUSINESS_TUTORIAL_STEPS.findIndex((candidate) => candidate.id === step.id);
  if (index <= 0) return false;
  state.player.businessTutorialStep = BUSINESS_TUTORIAL_STEPS[index - 1].id;
  return commitBusinessTutorialChange(options);
}

function canRewindBusinessTutorial() {
  const step = activeBusinessTutorialStep();
  return BUSINESS_TUTORIAL_STEPS.findIndex((candidate) => candidate.id === step?.id) > 0;
}

function skipBusinessTutorial(options = {}) {
  if (!state?.player) return false;
  state.player.businessTutorialActive = false;
  state.player.businessTutorialSkipped = true;
  state.player.businessTutorialStep = null;
  return commitBusinessTutorialChange(options);
}

function completeBusinessTutorial(options = {}) {
  if (!state?.player) return false;
  state.player.businessTutorialActive = false;
  state.player.businessTutorialCompleted = true;
  state.player.businessTutorialStep = null;
  return commitBusinessTutorialChange(options);
}

function commitBusinessTutorialChange(options = {}) {
  if (!state?.settings?.visualPreview && options.persist !== false) persistGame();
  if (options.render !== false) renderAll();
  return true;
}

function dispatchBusinessTutorialEvent(type, payload = {}, options = {}) {
  const step = activeBusinessTutorialStep();
  if (!step) return false;
  const nextByEvent = {
    business_contact_opened: { from: "business_city", next: "business_enter" },
    business_map_entered: { from: "business_enter", next: "business_owner" },
    business_owner_opened: { from: "business_owner", next: "business_panel" }
  }[type];
  if (nextByEvent && step.id === nextByEvent.from) {
    state.player.businessTutorialStep = nextByEvent.next;
    return commitBusinessTutorialChange(options);
  }
  return false;
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
  if (isTutorialTargetAllowed(state, targetType, targetId)) return false;
  if (!step.actionRequired) {
    showToast(tutorialNudgeLine());
    return true;
  }
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
    first_assault_start: "#left-window [data-enter-map]",
    first_raid_return: "#raid-return-button",
    pet_shop_starter: `#city-shop-panel [data-buy-pet="${STARTER_PET_ID}"], #city-shop-panel [data-equip-pet="${STARTER_PET_ID}"]`,
    business_panel: "#right-window .business-window-body, #right-window [data-business-buy-farm]",
    player_shop_panel: "#left-window .player-shop-window-body, #city-shop-panel .player-shop-buy-list"
  };

  if (target === "stage") return fallback;
  if (target === "npc_almeida") return cityNpcTutorialRect("comerciante-itens") || fallback;
  if (target === "npc_zeca") return cityNpcTutorialRect("seu-zeca") || fallback;
  if (target === "npc_vendedor") return cityNpcTutorialRect("npc-vendedor") || fallback;
  if (target === "npc_petshop") return cityNpcTutorialRect("npc-petshop") || fallback;
  if (target === "npc_business_contact") return cityNpcTutorialRect("npc-mendigo-fumante") || fallback;
  if (target === "idle_petshop_npc") return idleNpcTutorialRect("petshop-responsavel") || fallback;
  if (target === "idle_business_npc") return idleNpcTutorialRect("npc-empresario-negocios") || fallback;
  if (target === "pet_shop_starter") return domTargetRect(selectorTargets.pet_shop_starter) || cityShopPanelTutorialRect(selectorTargets.city_shop_panel) || fallback;
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

function idleNpcTutorialRect(npcId) {
  if (!state || state.scene !== "idle") return null;
  const npc = (state.run?.npcs || []).find((candidate) => candidate.id === npcId);
  if (!npc) return null;
  const height = cityNpcHeight();
  const rect = canvasWorldTargetRect(npc.x, idleGroundY() - height - 8, 68, height + 20);
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
  document.body.classList.toggle("temporary-stay-mode", Boolean(isTemporary));
  elements.raidTimer.classList.toggle("hidden", !isRaid);
  elements.raidCaughtRiskLabel?.classList.toggle("hidden", !isRaid);
  if (isRaid) {
    if (elements.raidMapLabel) elements.raidMapLabel.textContent = map ? `${map.code || map.index || ""} ${map.name}`.trim() : "Assalto";
    elements.raidTimerLabel.textContent = formatTime(state.run.raidTimeLeft);
    elements.raidCountLabel.textContent = `${remainingTargets(state)} / ${totalTargets(state)} alvos`;
    const caughtRisk = Math.max(0, Math.min(100, 100 - calculateStealChancePercent(map, stats)));
    if (elements.raidCaughtRiskLabel) {
      elements.raidCaughtRiskLabel.textContent = `Ser pego: ${formatPercent(caughtRisk)}`;
    }
  }
  elements.playerHpFill.style.width = `${Math.round(hpPercent * 100)}%`;
  elements.playerHp.textContent = `HP ${state.player.hp} / ${stats.maxHp}`;
  syncAutoRaidButton();
  syncHideoutRestButton();
  syncRaidSummary();
}

function syncHideoutRestButton() {
  const button = document.querySelector("[data-hideout-rest]");
  if (!button || !state?.player) return;
  const player = state.player;
  const house = getHouseConfig(player.casaAtual);
  const rechargeCost = getStaminaRechargeCost(player);
  const cooldown = hideoutRestCooldown(player);
  const canRestNow = Boolean(house && rechargeCost > 0 && player.money >= rechargeCost && cooldown.ready);
  button.disabled = !canRestNow;
  button.textContent = hideoutRestButtonLabel(player, house, rechargeCost, cooldown);
}

function hideoutRestButtonLabel(player, house, rechargeCost, cooldown) {
  if (!house) return "Sem casa";
  if (rechargeCost <= 0) return "Stamina cheia";
  if (!cooldown.ready) return `Aguardar ${compactDuration(cooldown.remainingMs)}`;
  if (player.money < rechargeCost) return `Precisa ${formatMoney(rechargeCost)}`;
  return `Descansar ${formatMoney(rechargeCost)}`;
}

function compactDuration(ms) {
  const totalSeconds = Math.max(1, Math.ceil(Number(ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function syncAutoRaidButton() {
  if (!elements.autoRaidToggle) return;
  const visible = canShowAutoRaidButton();
  elements.autoRaidToggle.classList.toggle("hidden", !visible);
  elements.autoRaidToggle.setAttribute("aria-expanded", String(visible && !elements.autoRaidPanel?.classList.contains("hidden")));
  if (!visible) hideAutoRaidConfirm();
}

function canShowAutoRaidButton() {
  if (!state?.player || state.settings?.visualPreview) return false;
  if (playerLevelValue(state.player) < AUTO_RAID_UNLOCK_LEVEL) return false;
  if (guidedTutorialActive()) return false;
  if (state.scene === "map" || state.run?.summary) return false;
  if (state.run?.mode === "temporary") return false;
  return Boolean(autoRaidMap());
}

function autoRaidMap() {
  if (!state?.player) return null;
  const highest = Math.max(1, Math.floor(Number(state.player.highestMapUnlocked || 1)));
  const lastById = MAPS.find((map) => map.id === state.player.lastRaidMapId);
  const lastByNumber = MAPS.find((map) => Number(map.index || 0) === Number(state.player.lastRaidMapNumber || 0));
  const map = lastById || lastByNumber || legacyAutoRaidMap(highest);
  if (!map || Number(map.index || 0) > highest) return null;
  return map;
}

function legacyAutoRaidMap(highestMapUnlocked) {
  const inferredIndex = Math.max(1, Math.min(MAPS.length, Number(highestMapUnlocked || 1) - 1 || 1));
  return MAPS.find((map) => Number(map.index || 0) === inferredIndex) || MAPS[0] || null;
}

function showAutoRaidConfirm() {
  if (!canShowAutoRaidButton()) return;
  const map = autoRaidMap();
  if (!map) return;
  elements.autoRaidTitle.textContent = "Auto assalto";
  elements.autoRaidMapLabel.textContent = `${map.code || map.index || ""} ${map.name}`.trim();
  elements.autoRaidRepeatToggle.checked = Boolean(state.settings.autoRepeatRaid);
  elements.autoRaidPanel.classList.remove("hidden");
  elements.autoRaidToggle?.setAttribute("aria-expanded", "true");
}

function hideAutoRaidConfirm() {
  elements.autoRaidPanel?.classList.add("hidden");
  elements.autoRaidToggle?.setAttribute("aria-expanded", "false");
}

function startAutoRaidFromConfirm() {
  const map = autoRaidMap();
  if (!map) {
    hideAutoRaidConfirm();
    return;
  }
  state.settings.autoRepeatRaid = Boolean(elements.autoRaidRepeatToggle?.checked);
  hideAutoRaidConfirm();
  showToast(`Auto assalto: ${map.name}.`);
  startRaid(map.id);
}

function syncSurvivalWarning(stats, hpPercent) {
  if (!elements.survivalWarning) return;
  if (state.scene === "idle" && state.run?.mode === "temporary") {
    elements.survivalWarning.classList.remove("hidden");
    elements.survivalWarning.textContent = temporaryStayText();
    return;
  }

  const staminaPercentValue = state.player.staminaMax
    ? Number(state.player.staminaAtual || 0) / state.player.staminaMax
    : 1;
  const danger = hpPercent < 0.3 || staminaPercentValue < 0.3 || Boolean(state.player.needsHideoutRest);
  elements.survivalWarning.classList.toggle("hidden", !danger);
  if (!danger) return;

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
    const npc = findClickedIdleNpc(point.x, point.y);
    if (npc) {
      if (activeCityNpc?.id === npc.id) {
        closeCityShopPanel();
        return;
      }
      walkToIdleNpc(npc);
      return;
    }
    state.run.pendingIdlePortalId = null;
    state.run.pendingIdleNpcId = null;
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
  if (isTypingTarget(event.target)) {
    keyboardMoveKeys.delete(event.key.toLowerCase());
    return;
  }
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
    state.run.pendingIdleNpcId = null;
    combat.moveIdleTo(targetX);
  }
}

function stopKeyboardMovement() {
  if (!state?.run) return;
  if (state.scene !== "city" && state.scene !== "hideout" && state.scene !== "idle") return;
  state.run.cityTargetX = null;
  state.run.pendingHideoutPortalId = null;
  state.run.pendingIdlePortalId = null;
  state.run.pendingIdleNpcId = null;
  state.run.pendingHideoutItemId = null;
  state.run.playerAction = null;
  renderAll();
}

function clearKeyboardMovement() {
  keyboardMoveKeys.clear();
  stopKeyboardMovement();
}

function isTypingTarget(target) {
  return Boolean(target?.isContentEditable || target?.closest?.("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
}

function renderInventory() {
  elements.inventoryWindow.classList.remove("hidden");
  renderInventoryWindow(elements.inventoryWindow, state, renderer, {
    close: closeMaster,
    openTab: openMasterTab,
    openConfig,
    openPets: openPetsPanel,
    activeLeft,
    activeRight,
    selectInventory: (index) => {
      state.selectedEquipmentSlot = null;
      const selectedIndex = state.selectedInventoryIndex;
      const selectedItem = Number.isInteger(selectedIndex) ? state.player.inventory[selectedIndex] : null;
      if (selectedItem && selectedIndex === index) {
        state.selectedInventoryIndex = null;
        renderAll();
        return;
      }
      if (selectedItem && selectedIndex !== index) {
        moveItem(state.player.inventory, selectedIndex, index);
        state.selectedInventoryIndex = null;
        renderAll();
        return;
      }
      state.selectedInventoryIndex = index;
      renderAll();
    },
    selectEquipment: (slot) => {
      if (!state.player.equipment?.[slot]) return;
      state.selectedInventoryIndex = null;
      state.selectedEquipmentSlot = state.selectedEquipmentSlot === slot ? null : slot;
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
      state.selectedEquipmentSlot = null;
      syncInventoryCursorGhost();
      addLog(state, "Mochila filtrada por uso e tier.");
      renderAll();
    },
    selectBackpackPage: (page) => {
      state.backpackPage = Math.min(BACKPACK_PAGE_COUNT, Math.max(1, Number(page) || 1));
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
  if (type === "playerShop") {
    renderPlayerShopPanel(elements.leftWindow);
    return;
  }
  renderPanel(elements.leftWindow, type, state, renderer, panelCallbacks(closeLeft));
}

function renderRightPanel(type) {
  elements.rightWindow.classList.remove("hidden");
  if (type === "business") {
    renderBusinessPanel(elements.rightWindow);
    return;
  }
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
  state.player.personalVault.items = compactInventoryStacks(state.player.personalVault.items);
  return state.player.personalVault;
}

function moveInventoryItemToVault(index, targetIndex = null) {
  const vault = ensurePersonalVault();
  const item = state.player.inventory[index];
  if (!item) return { ok: false, reason: "Selecione um item da mochila." };

  const target = Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < vault.items.length && !vault.items[targetIndex]
    ? targetIndex
    : null;

  if (target !== null) {
    vault.items[target] = item;
  } else if (!addItem({ inventory: vault.items }, item)) {
    return { ok: false, reason: "Cofre cheio." };
  }
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
    : null;

  if (target !== null) {
    state.player.inventory[target] = item;
  } else if (!addItem(state.player, item)) {
    return { ok: false, reason: "Mochila cheia." };
  }
  vault.items[index] = null;
  state.selectedVaultIndex = null;
  state.selectedInventoryIndex = target;
  return { ok: true, message: `${item.name} voltou para a mochila.` };
}

function moveVaultItemWithinVault(from, to) {
  const vault = ensurePersonalVault();
  if (from === to) return null;
  if (!vault.items[from]) return { ok: false, reason: "Selecione um item do cofre." };
  moveItem(vault.items, from, to);
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
      combat.enterIdleMap(mapId, {
        logMessage: `Voce entrou em ${idleMapName(mapId)}.`,
        returnToCity: cityReturnPointForIdleMap(mapId)
      });
      renderAll();
    },
    enterCity: () => {
      if (state.run?.mode === "temporary") {
        showToast(temporaryStayText());
        return;
      }
      combat.enterCity(cityReturnPointForCurrentScene() || {});
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
    equipPet: (petId) => handlePetResult(equipPet(state.player, petId)),
    unequipPet: () => handlePetResult(unequipPet(state.player)),
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
    account: {
      isLoggedIn: Boolean(activeProfile?.id),
      isGuest: Boolean(activeProfile?.isGuest || state.player?.isGuest),
      displayName: activeProfile?.displayName || state.player?.displayName || "",
      username: activeProfile?.username || state.player?.username || ""
    },
    close: closeRight,
    save: () => {
      if (state.settings.visualPreview) {
        saveVisualCalibration(state.settings.visual);
      }
      persistGame();
      showToast("Salvamento forcado.");
    },
    createAccount: (event) => {
      event.preventDefault();
      createAccountFromConfig(new FormData(event.currentTarget));
    },
    logout: () => {
      disconnectActiveAccount("Conta desconectada.");
    },
    resetGame: resetCurrentProgress
  });
}

async function createAccountFromConfig(formData) {
  if (!state?.player) return;
  const result = await createAccount(Object.fromEntries(formData.entries()));
  if (!result.ok) {
    showToast(result.reason);
    return;
  }

  activeProfile = result.profile;
  const displayName = state.player.displayName || activeProfile.displayName || activeProfile.username || "";
  activeProfile = updateProfile(activeProfile.id, {
    displayName,
    characterId: state.selectedPlayerId || state.player.characterId || null,
    factionId: state.player.factionId || null
  }) || activeProfile;
  applyProfileToState(state, activeProfile);
  persistGame();
  online?.disconnect();
  if (!state.settings.visualPreview) online?.connect();
  showToast("Conta criada e progresso salvo.");
  renderAll();
}

function resetCurrentProgress() {
  if (!state?.player) return;
  const previousProfile = activeProfile ? { ...activeProfile } : null;
  const displayName = state.player.displayName || previousProfile?.displayName || "";
  const username = state.player.username || previousProfile?.username || "";
  const isGuest = Boolean(previousProfile?.isGuest || state.player.isGuest);

  resetPlayerFaction(state.player);
  if (previousProfile?.id) {
    clearProfileSave(previousProfile.id);
    activeProfile = updateProfile(previousProfile.id, {
      displayName,
      characterId: null,
      factionId: null,
      lastMap: "city",
      lastPositionX: 190,
      lastPositionY: 0
    }) || {
      ...previousProfile,
      displayName,
      characterId: null,
      factionId: null,
      lastMap: "city",
      lastPositionX: 190,
      lastPositionY: 0
    };
  } else {
    clearSave();
  }

  state = createNewGame(DEFAULT_PLAYER_ID);
  if (activeProfile?.id) {
    applyProfileToState(state, activeProfile);
  } else {
    state.player.displayName = displayName;
    state.player.username = username;
    state.player.isGuest = isGuest;
  }
  state.player.factionId = null;

  closeCityShopPanel({ force: true, render: false });
  hideAutoRaidConfirm();
  hideChoice();
  elements.hospitalModal?.classList.add("hidden");
  elements.sceneTransition?.classList.remove("visible");
  elements.sceneTransition?.classList.add("hidden");
  elements.deathFlash?.classList.add("hidden");
  activeCenter = true;
  activeLeft = null;
  activeRight = "configs";
  activeCityNpc = null;
  activeCityPortalId = null;
  pendingSellIndexes.clear();
  pendingCraftIndex = null;
  saveTimer = 0;
  cloudSavePending = false;
  sessionCheckTimer = 0;
  lastTime = performance.now();

  online?.disconnect();
  combat = null;
  online = null;
  showToast("Progresso resetado. Escolha um novo visual.");
  showCharacterSelection("existing");
}

function disconnectActiveAccount(message) {
  persistGame({ keepalive: true });
  clearActiveSession();
  online?.disconnect();
  combat = null;
  online = null;
  state = null;
  activeProfile = null;
  activeCenter = false;
  activeLeft = null;
  activeRight = null;
  syncInventoryCursorGhost();
  document.body.classList.add("auth-pending");
  elements.inventoryWindow.classList.add("hidden");
  elements.leftWindow.classList.add("hidden");
  elements.rightWindow.classList.add("hidden");
  elements.configWindow.classList.add("hidden");
  showAuthScreen("home", message);
}

function openMaster() {
  if (isMobileWindowLayout()) {
    closeCityShopPanel({ render: false });
  }
  hideAutoRaidConfirm();
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
    combat?.enterCity(cityReturnPointForCurrentScene() || {});
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

function openPetsPanel() {
  activeCenter = true;
  activeLeft = activeLeft === "pets" ? null : "pets";
  renderAll();
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

function petshopCityReturnPoint() {
  const npc = CITY_NPCS.find((candidate) => candidate.id === "npc-petshop");
  return {
    playerX: Math.max(64, Math.round((npc?.x ?? 1840) - 48)),
    playerDirection: "right"
  };
}

function businessCityReturnPoint() {
  const npc = CITY_NPCS.find((candidate) => candidate.id === "npc-mendigo-fumante");
  return {
    playerX: Math.max(64, Math.round((npc?.x ?? 960) - 48)),
    playerDirection: "right"
  };
}

function cityHideoutReturnPoint() {
  const portal = CITY_PORTALS.find((candidate) => candidate.id === "hideout-door");
  return {
    playerX: Math.max(64, Math.round(portal?.x ?? 505)),
    playerDirection: "right"
  };
}

function cityReturnPointForIdleMap(mapId) {
  if (mapId === BUSINESS_MAP_ID) return businessCityReturnPoint();
  if (mapId === "petshop") return petshopCityReturnPoint();
  return null;
}

function cityReturnPointForCurrentScene() {
  if (state?.scene === "hideout") return cityHideoutReturnPoint();
  if (state?.scene === "idle") return cityReturnPointForIdleMap(state.currentMapId);
  return null;
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

function isMobileWindowLayout() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const compactLandscape = window.matchMedia?.("(max-width: 960px) and (orientation: landscape)")?.matches;
  return compactLandscape || window.innerWidth <= 700 || (coarsePointer && window.innerWidth <= 960);
}

function clearAppliedWindowLayout() {
  elements.windowLayer.classList.remove("custom-window-layout");
  elements.windowLayer.style.height = "";
  elements.windowLayer.style.minHeight = "";
  document.documentElement.style.removeProperty("--window-ui-scale");

  [
    elements.leftWindow,
    elements.inventoryWindow,
    elements.rightWindow,
    elements.configWindow
  ].forEach((node) => {
    if (!node) return;
    ["left", "top", "width", "height", "maxHeight"].forEach((property) => {
      node.style[property] = "";
    });
  });

  if (elements.bottomDock) {
    elements.bottomDock.classList.remove("custom-dock-position");
    ["left", "top", "width", "height"].forEach((property) => {
      elements.bottomDock.style[property] = "";
    });
  }
}

function applyWindowLayout() {
  const hasSavedLayout = Boolean(loadWindowLayout());
  const shouldApply = !isMobileWindowLayout() && (editorMode || hasSavedLayout);
  elements.windowLayer.classList.toggle("custom-window-layout", shouldApply);
  if (!shouldApply) {
    clearAppliedWindowLayout();
    return;
  }

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
    document.body.append(bar);
  }

  bar.classList.remove("hidden");
  if (bar.dataset.testReady) return;
  bar.innerHTML = `
    <strong>Teste combate</strong>
    ${PLAYERS.map((player) => `<button type="button" data-test-player="${escapeHtml(player.id)}">${escapeHtml(player.name)}</button>`).join("")}
    <button type="button" data-test-action="attack">Atacar</button>
    <button type="button" data-test-action="hurt">Dano</button>
    <button type="button" data-test-action="loop">Loop</button>
    <button type="button" data-test-action="city">Cidade</button>
  `;
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
  if (activeCenter && activeRight === "vault") {
    state.run.pendingHideoutPortalId = null;
    state.run.pendingHideoutItemId = null;
    closeMaster();
    return true;
  }

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
  hideAutoRaidConfirm();
  if (options.tutorialFirstRaid) state.settings.autoRepeatRaid = false;
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
  rememberLastRaidMap(map);
  fadeThen("Roube o maximo que conseguir!", () => {
    combat.enterMap(mapId, { tutorialFirstRaid: Boolean(options.tutorialFirstRaid) });
    dispatchTutorialEvent("raid_started", { mapId, mapIndex: map?.index || 1 }, { render: false });
    online?.sayHello();
    if (options.keepMenus) {
      activeCenter = true;
      activeRight = activeRight || "configs";
    }
  });
}

function rememberLastRaidMap(map) {
  if (!map || !state?.player) return;
  state.player.lastRaidMapId = map.id;
  state.player.lastRaidMapNumber = Number(map.index || map.mapNumber || 1);
  if (!state.settings?.visualPreview) persistGame();
}

function startNextRaidFromSummary() {
  const nextMap = nextRaidMapFromSummary();
  if (!nextMap) {
    showToast("Proximo mapa ainda bloqueado.");
    return;
  }
  startRaid(nextMap.id);
}

function nextRaidMapFromSummary() {
  const sourceMapId = state.run?.summary?.mapId || state.currentMapId;
  const current = MAPS.find((map) => map.id === sourceMapId);
  if (!current) return null;
  const next = MAPS.find((map) => map.index === current.index + 1);
  if (!next || next.index > Number(state.player.highestMapUnlocked || 1)) return null;
  return next;
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

function findClickedIdleNpc(screenX, screenY) {
  if (state.scene !== "idle") return null;
  const worldX = renderer.screenToWorld(screenX, state);
  const groundY = idleGroundY();
  const npcHeight = cityNpcHeight();
  if (screenY < groundY - npcHeight - 24 || screenY > groundY + 18) return null;
  return (state.run?.npcs || [])
    .filter((npc) => npc.role)
    .map((npc) => ({ npc, distance: Math.abs(worldX - npc.x) }))
    .filter((entry) => entry.distance <= 58)
    .sort((a, b) => a.distance - b.distance)[0]?.npc || null;
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
  state.run.pendingIdleNpcId = null;
  state.run.pendingHideoutPortalId = null;
  state.run.pendingHideoutItemId = null;
  const defaultOffset = portal.x < 90 ? portal.width / 2 + 8 : -portal.width / 2 - 12;
  const approachX = Math.max(64, Math.round(portal.x + Number(portal.approachOffset ?? defaultOffset)));
  combat.moveIdleTo(approachX);
  showToast("Indo até a cidade.");
}

function walkToIdleNpc(npc) {
  if (!state?.run || state.scene !== "idle") return;
  closeCityShopPanel({ render: false, force: true });
  closeMaster({ render: false, force: true });
  state.run.pendingIdleNpcId = npc.id;
  state.run.pendingIdlePortalId = null;
  const approachOffset = (state.run.playerX || 0) <= npc.x ? -48 : 48;
  combat.moveIdleTo(npc.x + approachOffset);
  showToast(`Indo ate ${npc.name}.`);
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
  const returnPoint = cityHideoutReturnPoint();
  fadeThen("Voltando para a cidade.", () => {
    combat.enterCity(returnPoint);
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
  const returnToCity = state.run.returnToCity || cityReturnPointForIdleMap(fromMap);
  fadeThen("Voltando para a cidade.", () => {
    combat.enterCity(returnToCity || {});
    online?.sayHello();
    dispatchTutorialEvent("scene_entered", { scene: "city", from: fromMap }, { render: false });
  });
}

function updatePendingIdleNpcArrival() {
  if (state.scene !== "idle" || !["idle", "temporary"].includes(state.run.mode) || !state.run.pendingIdleNpcId) return;
  if (Number.isFinite(state.run.cityTargetX)) return;
  const npc = (state.run.npcs || []).find((candidate) => candidate.id === state.run.pendingIdleNpcId);
  state.run.pendingIdleNpcId = null;
  if (!npc) return;
  openIdleNpcPanel(npc);
}

function openIdleNpcPanel(npc) {
  if (activeCityNpc?.id === npc?.id) {
    closeCityShopPanel();
    return;
  }
  if (npc?.role === "business") {
    openBusinessPanels(npc);
    return;
  }
  if (npc?.role === "player_shop") {
    closeMaster({ render: false, force: true });
    activeCityNpc = npc;
    activeCityNpcGreeting = npc.shopName || npc.name || "";
    shopMode = "player-shop-buy";
    pendingSellIndexes.clear();
    pendingCraftIndex = null;
    renderAll();
    return;
  }
  if (npc?.role !== "petshop") return;
  closeMaster({ render: false, force: true });
  activeCityNpc = npc;
  activeCityNpcGreeting = cityNpcGreeting(npc);
  shopMode = "pets";
  pendingSellIndexes.clear();
  pendingCraftIndex = null;
  if (npc?.id === "petshop-responsavel") {
    dispatchPetTutorialEvent("petshop_owner_opened", { npcId: npc.id }, { render: false });
  }
  renderAll();
}

function openBusinessPanels(npc = null) {
  if (!businessUnlocked(state.player)) {
    showToast(businessLockedMessage());
    return;
  }
  closeCityShopPanel({ render: false, force: true });
  closeCityPortalPanel({ render: false, force: true });
  activeCityNpc = null;
  activeCityNpcGreeting = "";
  shopMode = "talk";
  activeCenter = true;
  activeLeft = "playerShop";
  activeRight = "business";
  syncShopNpcsForBusinessMap(state);
  if (npc) showToast(cityNpcGreeting(npc));
  dispatchBusinessTutorialEvent("business_owner_opened", { npcId: npc?.id }, { render: false });
  renderAll();
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

  if (activeCityNpc?.id === nearest.npc.id) {
    closeCityShopPanel();
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
  if (isMobileWindowLayout()) {
    closeMaster({ render: false, force: true });
  }
  closeCityPortalPanel({ render: false });
  activeCityNpc = npc;
  shopMode = npc?.role === "drugs" ? "drugs" : "talk";
  activeCityNpcGreeting = cityNpcGreeting(npc);
  restoreTutorialNpcShopMode(npc);
  pendingSellIndexes.clear();
  pendingCraftIndex = null;
  dispatchTutorialEvent("npc_opened", { npcId: npc.id }, { render: false });
  if (npc?.id === "npc-petshop") {
    dispatchPetTutorialEvent("petshop_city_opened", { npcId: npc.id }, { render: false });
  }
  if (npc?.id === "npc-mendigo-fumante") {
    dispatchBusinessTutorialEvent("business_contact_opened", { npcId: npc.id }, { render: false });
  }
  renderAll();
}

function renderCityShopPanel() {
  const panel = ensureCityShopPanel();
  if (!activeCityNpc) {
    panel.classList.remove("drug-shop-panel");
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  panel.classList.toggle("drug-shop-panel", shopMode === "drugs");
  if (activeCityNpc.role === "business_invite") {
    renderBusinessInvitePanel(panel, activeCityNpc);
    return;
  }
  if (shopMode === "player-shop-buy") {
    renderPlayerShopBuyPanel(panel, activeCityNpc);
    return;
  }
  if (shopMode === "drugs") {
    renderDrugPanel(panel, activeCityNpc);
    return;
  }
  if (shopMode === "pets") {
    renderPetShopPanel(panel, activeCityNpc);
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
        <button type="button" class="secondary-action" data-shop-quick-craft>Fusao Rapida</button>
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

function renderBusinessInvitePanel(panel, npc) {
  const greeting = activeCityNpcGreeting || cityNpcGreeting(npc);
  const unlocked = businessUnlocked(state.player);
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${escapeHtml(npc.name)}</span>
      <h2>${escapeHtml(npc.shopName)}</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <p>${escapeHtml(greeting)}</p>
    ${unlocked ? "" : `<p>${businessLockedMessage()}</p>`}
    <div class="city-shop-actions">
      <button type="button" class="primary-action" data-enter-business-map ${unlocked ? "" : "disabled"}>Sim</button>
      <button type="button" class="secondary-action" data-shop-close>Agora nao</button>
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

function renderPetShopPanel(panel, npc) {
  normalizePets(state.player, { silent: true });
  const greeting = petsUnlocked(state.player)
    ? "Escolhe um parceiro. So um acompanha voce por vez."
    : "Nao te conheco ainda. Pets liberados no nivel 5.";
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${npc.name}</span>
      <h2>Loja de Pets</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <p>${greeting}</p>
    <div class="pet-shop-list">
      ${PETS.map((pet) => petShopRow(pet)).join("")}
    </div>
    <div class="shop-sell-footer">
      <button type="button" class="secondary-action" data-shop-close>Fechar</button>
    </div>
  `;
  bindShopPanel(panel);
  panel.querySelectorAll("[data-pet-preview]").forEach((canvas) => {
    renderer.drawPetPreview(canvas, canvas.dataset.petPreview);
  });
  panel.querySelectorAll("[data-buy-pet]").forEach((button) => {
    button.addEventListener("click", () => {
      const petId = button.dataset.buyPet;
      handlePetResult(buyPet(state.player, petId), { action: "buy", petId });
    });
  });
  panel.querySelectorAll("[data-equip-pet]").forEach((button) => {
    button.addEventListener("click", () => handlePetResult(equipPet(state.player, button.dataset.equipPet)));
  });
  panel.querySelector("[data-unequip-pet]")?.addEventListener("click", () => handlePetResult(unequipPet(state.player)));
}

function petShopRow(pet) {
  const status = petStatus(state.player, pet);
  const price = petPrice(pet);
  const statusLabel = {
    "locked-system": `Libera no nivel ${PET_UNLOCK_LEVEL}`,
    "locked-level": `Libera no nivel ${pet.requiredLevel}`,
    equipped: "Equipado",
    owned: "Comprado",
    claimable: "Disponivel gratis",
    available: "Disponivel"
  }[status] || "Disponivel";

  const action = petShopAction(pet, status, price);
  return `
    <article class="pet-shop-row">
      <canvas class="pet-preview" width="86" height="70" data-pet-preview="${pet.id}"></canvas>
      <div>
        <h3>${pet.name}</h3>
        <p>Nivel ${pet.requiredLevel} | ${Math.round(pet.dpsPercent * 1000) / 10}% DPS | ${pet.cooldown.toFixed(2)}s</p>
        <small>${statusLabel}${price > 0 ? ` | ${formatMoney(price)}` : ""}</small>
      </div>
      ${action}
    </article>
  `;
}

function petShopAction(pet, status, price) {
  if (status === "equipped") return `<button type="button" class="panel-action" data-unequip-pet>Desequipar</button>`;
  if (status === "owned") return `<button type="button" class="panel-action" data-equip-pet="${pet.id}">Equipar</button>`;
  if (status === "claimable") return `<button type="button" class="panel-action" data-buy-pet="${pet.id}">Adotar gratis</button>`;
  if (status === "available") return `<button type="button" class="panel-action" data-buy-pet="${pet.id}" ${state.player.money >= price ? "" : "disabled"}>${formatMoney(price)}</button>`;
  return `<button type="button" class="panel-action" disabled>Bloqueado</button>`;
}

function drugShopRow(drug, stats, now) {
  const effect = drugEffectText(drug, state.player, stats);
  const carried = drugInventoryCount(state.player, drug.id);
  const locked = !businessUnlocked(state.player);
  return `
    <article class="drug-shop-row">
      <div>
        <h3>${drug.name}</h3>
        <p>${formatMoney(drug.price)} | ${effect}</p>
        <small>Na mochila: ${carried} | Risco ${drug.risk}</small>
      </div>
      <button type="button" class="panel-action" data-buy-drug="${drug.id}" ${locked ? "disabled" : ""}>
        ${locked ? `Nivel ${BUSINESS_UNLOCK_LEVEL}` : "Comprar"}
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
  if (!businessUnlocked(state.player)) {
    showToast(businessLockedMessage());
    renderCityShopPanel();
    return;
  }
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
  if (result.badDrugHospital) {
    handleDrugHospital(result, "ish... usou coisa zoada?");
    return;
  }

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
  handleDrugHospital(result, `${result.drug.name}: voce apagou e foi levado para o hospital.`);
}

function handleDrugHospital(result, message) {
  const bill = applyHospitalFee(state.player);
  state.player.hp = 0;
  state.player.needsHideoutRest = true;
  addLog(state, message);
  addLog(state, `Taxa hospitalar: ${formatMoney(bill.charged || 0)}.`);
  showToast(message);
  closeCityShopPanel({ render: false });
  closeMaster({ render: false, force: true });
  combat.enterHospital();
  showHospitalBill(bill);
  persistGame();
  renderAll();
}

function renderBusinessPanel(container) {
  normalizeBusinessState(state.player);
  calculateProduction(state.player);
  if (!businessUnlocked(state.player)) {
    container.innerHTML = `
      ${businessWindowHeader("Negocios", "business")}
      <div class="window-body business-window-body">
        <section class="business-stock-panel">
          <div class="business-section-title">
            <span class="eyebrow">Bloqueado</span>
            <strong>Nivel ${BUSINESS_UNLOCK_LEVEL}</strong>
          </div>
          <p>${businessLockedMessage()}</p>
        </section>
      </div>
    `;
    bindClose(container, closeRight);
    return;
  }
  container.innerHTML = `
    ${businessWindowHeader("Negocios", "business")}
    <div class="window-body business-window-body">
      ${businessStructureCard("farm")}
      ${businessStructureCard("lab")}
      <section class="business-stock-panel">
        <div class="business-section-title">
          <span class="eyebrow">Estoque</span>
          <strong>${businessStockForSource(state.player, "farm") + businessStockForSource(state.player, "lab")} un.</strong>
        </div>
        <div class="business-stock-grid">
          ${BUSINESS_CONFIG ? Object.keys(BUSINESS_CONFIG.products).map((productType) => businessStockCell(productType)).join("") : ""}
        </div>
      </section>
    </div>
  `;
  bindClose(container, closeRight);
  bindBusinessPanel(container);
}

function renderPlayerShopPanel(container) {
  normalizePlayerShopState(state);
  const activeShop = getPlayerActiveShop(state, state.player.playerId);
  if (!businessUnlocked(state.player)) {
    container.innerHTML = `
      ${businessWindowHeader("Minha Lojinha", "player-shop")}
      <div class="window-body player-shop-window-body">
        <section class="business-stock-panel">
          <div class="business-section-title">
            <span class="eyebrow">Bloqueado</span>
            <strong>Nivel ${BUSINESS_UNLOCK_LEVEL}</strong>
          </div>
          <p>${businessLockedMessage()}</p>
        </section>
      </div>
    `;
    bindClose(container, closeLeft);
    return;
  }
  container.innerHTML = `
    ${businessWindowHeader("Minha Lojinha", "player-shop")}
    <div class="window-body player-shop-window-body">
      ${activeShop ? activePlayerShopTemplate(activeShop) : playerShopCreateTemplate()}
    </div>
  `;
  bindClose(container, closeLeft);
  bindPlayerShopPanel(container);
}

function renderPlayerShopBuyPanel(panel, npc) {
  const shop = getShopById(state, npc.shopId);
  if (!businessUnlocked(state.player)) {
    panel.innerHTML = `
      <header>
        <span class="eyebrow">Lojinha</span>
        <h2>Bloqueado</h2>
        <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
      </header>
      <p>${businessLockedMessage()}</p>
    `;
    bindShopPanel(panel);
    return;
  }
  if (!shop?.active) {
    panel.innerHTML = `
      <header>
        <span class="eyebrow">Lojinha</span>
        <h2>Indisponivel</h2>
        <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
      </header>
      <p>Essa lojinha ja fechou.</p>
    `;
    bindShopPanel(panel);
    return;
  }

  const isOwnShop = shop.ownerPlayerId === (state.player.playerId || "local-player");
  panel.innerHTML = `
    <header>
      <span class="eyebrow">${escapeHtml(shop.ownerName)}</span>
      <h2>${escapeHtml(shop.shopName)}</h2>
      <button type="button" class="close-button" data-shop-close aria-label="Fechar">X</button>
    </header>
    <div class="player-shop-buy-list">
      ${shop.listings.filter((listing) => listing.quantity > 0).map((listing) => playerShopBuyRow(shop, listing, isOwnShop)).join("")}
    </div>
  `;
  bindShopPanel(panel);
  panel.querySelectorAll("[data-buy-player-shop]").forEach((button) => {
    button.addEventListener("click", () => {
      const drugType = button.dataset.buyPlayerShop;
      const input = panel.querySelector(`[data-buy-player-shop-qty="${drugType}"]`);
      const result = buyFromShop(state, state.player.playerId, shop.shopId, drugType, Number(input?.value || 1));
      handleShopResult(result);
    });
  });
}

function businessStructureCard(source) {
  const isFarm = source === "farm";
  const hasStructure = isFarm ? state.player.hasFarm : state.player.hasLab;
  const level = isFarm ? state.player.farmLevel : state.player.labLevel;
  const label = isFarm ? "Fazenda" : "Laboratorio";
  const currentConfig = hasStructure ? (isFarm ? BUSINESS_CONFIG.farmLevels[level] : BUSINESS_CONFIG.labLevels[level]) : null;
  const nextConfig = isFarm
    ? BUSINESS_CONFIG.farmLevels[hasStructure ? level + 1 : 1]
    : BUSINESS_CONFIG.labLevels[hasStructure ? level + 1 : 1];
  const sourceStock = businessStockForSource(state.player, source);
  const capacity = businessCapacity(state.player, source);
  const activeLabel = activeProductionLabel(state.player, source);
  const buyAction = isFarm ? "data-business-buy-farm" : "data-business-buy-lab";
  const upgradeAction = isFarm ? "data-business-upgrade-farm" : "data-business-upgrade-lab";
  const collectAction = isFarm ? "data-business-collect-farm" : "data-business-collect-lab";
  const activeProduction = isFarm ? state.player.activeFarmProduction : state.player.activeLabProduction;
  return `
    <section class="business-card">
      <div class="business-section-title">
        <span class="eyebrow">${label}</span>
        <strong>${hasStructure ? `Nivel ${level}` : "Nao comprada"}</strong>
      </div>
      <div class="business-card-stats">
        <span>Producao: ${escapeHtml(activeLabel)}</span>
        <span>Estoque: ${sourceStock}/${capacity || "-"}</span>
        <span>Multiplicador: x${formatMultiplier(currentConfig?.multiplier || 0)}</span>
      </div>
      <div class="business-actions">
        ${hasStructure ? `
          <button type="button" class="panel-action" ${upgradeAction} ${nextConfig && state.player.money >= nextConfig.cost ? "" : "disabled"}>
            ${nextConfig ? `Upgrade ${formatMoney(nextConfig.cost)}` : "Maximo"}
          </button>
        ` : `
          <button type="button" class="panel-action primary-action" ${buyAction} ${nextConfig && state.player.money >= nextConfig.cost ? "" : "disabled"}>
            Comprar ${formatMoney(nextConfig?.cost || 0)}
          </button>
        `}
        <button type="button" class="panel-action" ${collectAction} ${activeProduction?.productType ? "" : "disabled"}>Coletar</button>
      </div>
      <div class="business-production-list">
        ${businessProductionButtons(source).join("")}
      </div>
    </section>
  `;
}

function businessProductionButtons(source) {
  const products = source === "farm" ? ["weed", "cocaineInput"] : ["ecstasy", "cocaine"];
  return products.map((productType) => {
    const product = businessProductConfig(productType);
    const rate = productionRatePerHour(state.player, source, productType);
    const canProduce = canProduceBusinessProduct(state.player, source, productType) && businessStockForSource(state.player, source) < businessCapacity(state.player, source);
    const action = source === "farm" ? "data-business-start-farm" : "data-business-start-lab";
    return `
      <button type="button" class="business-product-button" ${action}="${productType}" ${canProduce ? "" : "disabled"}>
        <span>${escapeHtml(product.label)}</span>
        <small>${rate}/h</small>
      </button>
    `;
  });
}

function businessStockCell(productType) {
  const product = businessProductConfig(productType);
  return `
    <div class="business-stock-cell">
      <span>${escapeHtml(product.label)}</span>
      <strong>${stockAmount(state.player, productType)}</strong>
    </div>
  `;
}

function playerShopCreateTemplate() {
  return `
    <form class="player-shop-form" data-player-shop-form>
      <input name="shopName" maxlength="24" placeholder="Nome da loja" value="${escapeHtml(defaultShopName())}">
      <div class="player-shop-listing-list">
        ${SELLABLE_BUSINESS_PRODUCTS.map((productType) => playerShopListingRow(productType)).join("")}
      </div>
      <button type="submit" class="panel-action primary-action">Abrir loja</button>
    </form>
  `;
}

function playerShopListingRow(productType) {
  const product = businessProductConfig(productType);
  const stockAvailable = stockAmount(state.player, productType);
  const inventoryAvailable = playerShopInventoryAmount(productType);
  const available = stockAvailable + inventoryAvailable;
  return `
    <article class="player-shop-listing-row">
      <div>
        <h3>${escapeHtml(product.label)}</h3>
        <small>Disponivel ${available} | estoque ${stockAvailable} | mochila ${inventoryAvailable}</small>
      </div>
      <label>
        <span>Qtd</span>
        <input type="number" min="0" max="${available}" step="1" value="0" data-shop-listing-qty="${productType}">
      </label>
      <label>
        <span>Preco</span>
        <input type="number" min="${product.minPrice}" max="${product.maxPrice}" step="1" value="${product.suggestedPrice}" data-shop-listing-price="${productType}">
      </label>
      <small>${formatMoney(product.suggestedPrice)} | ${formatMoney(product.minPrice)}-${formatMoney(product.maxPrice)}</small>
    </article>
  `;
}

function playerShopInventoryAmount(productType) {
  const product = businessProductConfig(productType);
  if (!product?.inventoryDrugId) return 0;
  return (state.player.inventory || [])
    .filter((item) => isDrugInventoryItem(item) && (item.drugId || String(item.id || "").replace(/^drug-/, "")) === product.inventoryDrugId)
    .reduce((sum, item) => sum + itemQuantity(item), 0);
}

function activePlayerShopTemplate(shop) {
  return `
    <section class="active-player-shop">
      <div class="business-section-title">
        <span class="eyebrow">${escapeHtml(shop.shopName)}</span>
        <strong>Ativa</strong>
      </div>
      <div class="active-shop-stats">
        <span>Vendidas: ${shop.salesCount}</span>
        <span>Bruto: ${formatMoney(shop.grossSales)}</span>
        <span>Ganho: ${formatMoney(shop.sellerRevenue)}</span>
      </div>
      <div class="active-shop-list">
        ${shop.listings.map((listing) => activeShopListingRow(listing)).join("")}
      </div>
      <button type="button" class="panel-action danger-action" data-close-player-shop>Fechar loja</button>
    </section>
  `;
}

function activeShopListingRow(listing) {
  const product = businessProductConfig(listing.drugType);
  return `
    <article class="active-shop-row">
      <span>${escapeHtml(product.label)}</span>
      <strong>${listing.quantity}/${listing.originalQuantity}</strong>
      <small>${formatMoney(listing.pricePerUnit)} un.</small>
    </article>
  `;
}

function playerShopBuyRow(shop, listing, isOwnShop) {
  const product = businessProductConfig(listing.drugType);
  const locked = !businessUnlocked(state.player);
  return `
    <article class="player-shop-buy-row">
      <div>
        <h3>${escapeHtml(product.label)}</h3>
        <p>${formatMoney(listing.pricePerUnit)} un.</p>
        <small>Disponivel ${listing.quantity}</small>
      </div>
      <input type="number" min="1" max="${listing.quantity}" step="1" value="1" data-buy-player-shop-qty="${listing.drugType}" ${isOwnShop || locked ? "disabled" : ""}>
      <button type="button" class="panel-action" data-buy-player-shop="${listing.drugType}" ${isOwnShop || locked ? "disabled" : ""}>
        ${locked ? `Nivel ${BUSINESS_UNLOCK_LEVEL}` : isOwnShop ? "Propria" : "Comprar"}
      </button>
    </article>
  `;
}

function bindBusinessPanel(container) {
  container.querySelector("[data-business-buy-farm]")?.addEventListener("click", () => handleBusinessResult(buyFarm(state.player)));
  container.querySelector("[data-business-buy-lab]")?.addEventListener("click", () => handleBusinessResult(buyLab(state.player)));
  container.querySelector("[data-business-upgrade-farm]")?.addEventListener("click", () => handleBusinessResult(upgradeFarm(state.player)));
  container.querySelector("[data-business-upgrade-lab]")?.addEventListener("click", () => handleBusinessResult(upgradeLab(state.player)));
  container.querySelector("[data-business-collect-farm]")?.addEventListener("click", () => handleBusinessResult(collectFarmProduction(state.player)));
  container.querySelector("[data-business-collect-lab]")?.addEventListener("click", () => handleBusinessResult(collectLabProduction(state.player)));
  container.querySelectorAll("[data-business-start-farm]").forEach((button) => {
    button.addEventListener("click", () => handleBusinessResult(startFarmProduction(state.player, button.dataset.businessStartFarm)));
  });
  container.querySelectorAll("[data-business-start-lab]").forEach((button) => {
    button.addEventListener("click", () => handleBusinessResult(startLabProduction(state.player, button.dataset.businessStartLab)));
  });
}

function bindPlayerShopPanel(container) {
  container.querySelector("[data-player-shop-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const listings = SELLABLE_BUSINESS_PRODUCTS.map((productType) => ({
      drugType: productType,
      quantity: Number(form.querySelector(`[data-shop-listing-qty="${productType}"]`)?.value || 0),
      pricePerUnit: Number(form.querySelector(`[data-shop-listing-price="${productType}"]`)?.value || 0)
    }));
    const result = createShop(state, state.player.playerId, form.elements.shopName?.value, listings);
    handleShopResult(result);
  });
  container.querySelector("[data-close-player-shop]")?.addEventListener("click", () => {
    const result = closeShop(state, state.player.playerId);
    handleShopResult(result);
  });
}

function handleBusinessResult(result) {
  handleResult(result);
  if (result?.ok) {
    calculateProduction(state.player);
    persistGame();
  }
  renderAll();
}

function handleShopResult(result) {
  handleResult(result);
  if (result?.ok) {
    normalizePlayerShopState(state);
    syncShopNpcsForBusinessMap(state);
    persistGame();
    if (result.shop && !result.shop.active && activeCityNpc?.shopId === result.shop.shopId) {
      closeCityShopPanel({ render: false, force: true });
    }
  }
  renderAll();
}

function bindClose(container, close) {
  container.querySelectorAll("[data-window-close], .window-header .close-button").forEach((button) => {
    button.addEventListener("click", () => close?.());
  });
}

function businessWindowHeader(title, id) {
  return `
    <header class="window-header">
      <h2>${title}</h2>
      <button class="close-button" data-window-close="${id}" aria-label="Fechar">X</button>
    </header>
  `;
}

function defaultShopName() {
  const base = state.player.displayName || state.player.username || "Jogador";
  return `Loja ${base}`.slice(0, 24);
}

function formatMultiplier(value) {
  return Number(value || 0).toFixed(1);
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
  panel.querySelectorAll("[data-craft-one]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const index = Number(button.dataset.craftOne);
      const currentPreview = getCraftPreview(state.player, index);
      if (!currentPreview?.canCraft) return;
      if (!confirmCraftRisk(currentPreview)) return;
      const result = craftInventoryItem(state.player, index);
      handleResult(result);
      renderAll();
    });
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
  panel.querySelector("[data-shop-quick-craft]")?.addEventListener("click", () => {
    const entries = shopCraftEntries();
    if (!entries.length) {
      showToast("Junte 4 itens iguais para fundir.");
      return;
    }
    if (!confirmCraftAllRisk(entries)) return;
    const result = craftAllInventory(state.player);
    handleResult(result);
    renderAll();
  });
  panel.querySelector("[data-enter-petshop]")?.addEventListener("click", () => {
    enterPetshopFromCityNpc();
  });
  panel.querySelector("[data-enter-business-map]")?.addEventListener("click", () => {
    enterBusinessMapFromCityNpc();
  });
}

function enterPetshopFromCityNpc() {
  if (state.run?.mode === "temporary") {
    showToast(temporaryStayText());
    return;
  }
  closeCityShopPanel({ render: false });
  closeCityPortalPanel({ render: false });
  closeMaster({ render: false, force: true });
  combat.enterIdleMap("petshop", {
    playerX: 620,
    logMessage: `Voce entrou em ${idleMapName("petshop")}.`,
    returnToCity: petshopCityReturnPoint()
  });
  dispatchPetTutorialEvent("petshop_entered", {}, { render: false });
  renderAll();
}

function enterBusinessMapFromCityNpc() {
  if (state.run?.mode === "temporary") {
    showToast(temporaryStayText());
    return;
  }
  if (!businessUnlocked(state.player)) {
    showToast(businessLockedMessage());
    return;
  }
  closeCityShopPanel({ render: false });
  closeCityPortalPanel({ render: false });
  closeMaster({ render: false, force: true });
  combat.enterIdleMap(BUSINESS_MAP_ID, {
    playerX: 620,
    logMessage: `Voce entrou em ${idleMapName(BUSINESS_MAP_ID)}.`,
    returnToCity: businessCityReturnPoint()
  });
  syncShopNpcsForBusinessMap(state);
  dispatchBusinessTutorialEvent("business_map_entered", {}, { render: false });
  renderAll();
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
  if (state?.run) {
    state.run.pendingCityNpcId = null;
    state.run.pendingIdleNpcId = null;
  }
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
    <article class="shop-sell-cell shop-craft-cell ${selected ? "selected" : ""} ${preview.canCraft ? "ready" : ""}" data-craft-index="${entry.index}" title="${entry.item.name}">
      <span>${entry.item.name}</span>
      <small>${status}${risk}</small>
      <button type="button" class="item-action" data-craft-one="${entry.index}" ${preview.canCraft ? "" : "disabled"}>Fundir</button>
    </article>
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
  const recommended = !offer.sold && isRecommendedShopOffer(item);
  return `
    <button type="button" class="shop-sell-cell ${offer.sold ? "empty" : ""} ${recommended ? "recommended-offer" : ""}" data-buy-offer="${index}" title="${item.name}" ${offer.sold ? "disabled" : ""}>
      ${recommended ? `<i class="shop-recommend-badge" aria-label="Melhor que equipado" title="Melhor que equipado"></i>` : ""}
      <span>${offer.sold ? "Vendido" : item.name}</span>
      <small>${item.rarityLabel} T${item.tier} | ${formatMoney(item.precoNPCVende)}</small>
    </button>
  `;
}

function isRecommendedShopOffer(item) {
  const equipped = state?.player?.equipment?.[item?.slot];
  return Boolean(item?.slot && (!equipped || itemPower(item) > itemPower(equipped)));
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
        <small>${unlocked ? "Disponivel" : assetRequirementText(asset, state.player)}</small>
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
  elements.choiceText.textContent = `${target.name}: "${target.alertLine || "O que pensa que esta fazendo?"}"`;
  const prisonChance = currentPrisonChance();
  elements.choiceWarning?.classList.toggle("hidden", prisonChance <= 0);
  elements.choiceModal.classList.remove("hidden");
  syncChoiceTimer();
}

function hideChoice() {
  elements.choiceWarning?.classList.add("hidden");
  elements.choicePrisonRisk?.classList.remove("danger");
  elements.choiceModal.classList.add("hidden");
}

function syncChoiceTimer() {
  if (!elements.fightAutoTimer || !elements.choiceModal || elements.choiceModal.classList.contains("hidden")) return;
  const seconds = Math.max(0, Math.ceil(Number(state?.run?.choiceTimer || 0)));
  elements.fightAutoTimer.textContent = `Auto em ${seconds}s`;
  elements.fightButton?.classList.toggle("auto-soon", seconds <= 2);
  syncChoicePrisonRisk();
}

function syncChoicePrisonRisk() {
  if (!elements.choicePrisonRisk) return;
  const chance = currentPrisonChance() * 100;
  elements.choicePrisonRisk.textContent = `Chance de ir preso: ${formatPercent(chance)}`;
  elements.choicePrisonRisk.classList.toggle("danger", chance > 0);
}

function currentPrisonChance() {
  if (state?.run?.tutorialFirstRaid) return 0;
  return policePrisonChanceForFight(state?.run?.battlesStarted || 0);
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

function handlePetResult(result, options = {}) {
  handleResult(result);
  if ((result?.ok || starterPetOwned()) && options.action === "buy" && options.petId === STARTER_PET_ID) {
    dispatchPetTutorialEvent("starter_pet_bought", {}, { render: false, persist: false });
  }
  if (result?.ok) persistGame();
  renderAll();
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

  const guidedFirstRaid = isGuidedFirstRaidSummary();
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
  if (guidedFirstRaid) state.settings.autoRepeatRaid = false;
  elements.autoRepeatToggle.checked = guidedFirstRaid ? false : Boolean(state.settings.autoRepeatRaid);
  elements.autoRepeatToggle.disabled = guidedFirstRaid;
  elements.autoRepeatToggle.closest("label")?.classList.toggle("hidden", guidedFirstRaid);
  elements.raidRepeatButton?.classList.toggle("hidden", guidedFirstRaid);
  elements.raidNextButton?.classList.toggle("hidden", guidedFirstRaid);
  if (elements.raidNextButton) {
    elements.raidNextButton.disabled = guidedFirstRaid || !nextRaidMapFromSummary();
  }
  if (elements.raidRepeatButton) elements.raidRepeatButton.disabled = guidedFirstRaid;
}

function isGuidedFirstRaidSummary() {
  return Boolean(state?.run?.mode === "summary" && state.run?.tutorialFirstRaid);
}

function remainingTargets(sourceState = state) {
  return (sourceState.run?.npcs || []).filter((npc) => !npc.done).length;
}

function totalTargets(sourceState = state) {
  return sourceState.run?.summary?.targetsTotal || sourceState.run?.npcs?.length || 0;
}

function syncInventoryCursorGhost() {
  const item = activeCenter && !state?.selectedEquipmentSlot && Number.isInteger(state?.selectedInventoryIndex)
    ? state.player?.inventory?.[state.selectedInventoryIndex]
    : null;

  if (!item) {
    inventoryCursorGhost?.remove();
    inventoryCursorGhost = null;
    document.body.classList.remove("inventory-carrying-item");
    return;
  }

  if (!inventoryCursorGhost) {
    inventoryCursorGhost = document.createElement("div");
    inventoryCursorGhost.className = "inventory-cursor-ghost";
    inventoryCursorGhost.setAttribute("aria-hidden", "true");
    document.body.appendChild(inventoryCursorGhost);
  }

  inventoryCursorGhost.className = `inventory-cursor-ghost gear-square ${inventoryTierClass(item)}`;
  inventoryCursorGhost.innerHTML = `
    ${inventoryGhostIcon(item)}
    <small>${inventoryTierLabel(item)}</small>
  `;
  inventoryCursorGhost.style.left = `${inventoryPointerX + 14}px`;
  inventoryCursorGhost.style.top = `${inventoryPointerY + 14}px`;
  document.body.classList.add("inventory-carrying-item");
}

function inventoryGhostIcon(item) {
  if (item?.iconPath) {
    return `<img class="gear-icon-image" src="${escapeHtml(item.iconPath)}" alt="" draggable="false">`;
  }
  return `<span class="gear-glyph icon-${escapeHtml(item?.slot || "weapon")}" aria-hidden="true"></span>`;
}

function inventoryTierClass(item) {
  const tier = Math.max(1, Math.min(4, Number(item?.tier) || 1));
  return `rarity-${item?.rarity || "comum"} tier-${tier}`;
}

function inventoryTierLabel(item) {
  if (item?.slot === "drug") return "uso";
  return `t${Math.max(1, Math.min(4, Number(item?.tier) || 1))}`;
}

function playerRow() {
  return playerRowForState(state);
}

function playerRowForState(sourceState) {
  return Math.max(0, PLAYERS.findIndex((player) => player.id === sourceState?.selectedPlayerId));
}

function isValidPlayerId(playerId) {
  return PLAYERS.some((player) => player.id === playerId);
}

function normalizePlayerId(playerId) {
  return isValidPlayerId(playerId) ? playerId : DEFAULT_PLAYER_ID;
}

function needsCharacterSelection(sourceState, profile = activeProfile) {
  const loadedCharacterId = sourceState?.player?.characterId || sourceState?.selectedPlayerId || profile?.characterId;
  return !isValidPlayerId(loadedCharacterId);
}

function normalizeState() {
  if (!isValidPlayerId(state.selectedPlayerId)) {
    state.selectedPlayerId = DEFAULT_PLAYER_ID;
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
  state.player.lastRaidMapId ||= null;
  state.player.lastRaidMapNumber = Math.max(0, Math.floor(Number(state.player.lastRaidMapNumber || 0)));
  state.player.playerId ||= activeProfile?.id || null;
  state.player.username ||= activeProfile?.username || "";
  state.player.isGuest = Boolean(activeProfile?.isGuest || state.player.isGuest);
  state.player.displayName ||= activeProfile?.displayName || "";
  state.player.characterId = normalizePlayerId(state.player.characterId || activeProfile?.characterId || state.selectedPlayerId);
  state.selectedPlayerId = state.player.characterId;
  state.player.factionId ||= activeProfile?.factionId || null;
  state.player.hideoutTier = Number(state.player.hideoutTier || state.player.terrenoAtual || 0);
  state.player.hideoutItems ||= {};
  state.player.needsHideoutRest = Boolean(state.player.needsHideoutRest);
  normalizeDrugState(state.player);
  normalizeBusinessState(state.player);
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
  state.player.inventory = compactInventoryStacks(state.player.inventory);
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
    addItem(state.player, item);
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
  normalizePets(state.player, { silent: true });
  state.player.petTutorialCompleted = Boolean(state.player.petTutorialCompleted || starterPetOwned());
  state.player.petTutorialSkipped = Boolean(state.player.petTutorialSkipped);
  state.player.petTutorialActive = Boolean(state.player.petTutorialActive && !state.player.petTutorialCompleted && !state.player.petTutorialSkipped);
  if (!PET_TUTORIAL_STEP_BY_ID[state.player.petTutorialStep]) state.player.petTutorialStep = state.player.petTutorialActive ? PET_TUTORIAL_FIRST_STEP : null;
  state.player.businessTutorialCompleted = Boolean(state.player.businessTutorialCompleted);
  state.player.businessTutorialSkipped = Boolean(state.player.businessTutorialSkipped);
  state.player.businessTutorialActive = Boolean(
    state.player.businessTutorialActive &&
    !state.player.businessTutorialCompleted &&
    !state.player.businessTutorialSkipped &&
    businessUnlocked(state.player)
  );
  if (!BUSINESS_TUTORIAL_STEP_BY_ID[state.player.businessTutorialStep]) {
    state.player.businessTutorialStep = state.player.businessTutorialActive ? BUSINESS_TUTORIAL_FIRST_STEP : null;
  }
  applyOfflinePassiveIncome(state);
  state.run ||= createNewGame(state.selectedPlayerId || DEFAULT_PLAYER_ID).run;
  state.run.playerDirection ||= "right";
  state.run.cityTargetX ??= null;
  state.run.pendingCityNpcId ??= null;
  state.run.pendingCityPortalId ??= null;
  state.run.pendingHideoutPortalId ??= null;
  state.run.pendingIdlePortalId ??= null;
  state.run.pendingIdleNpcId ??= null;
  state.run.pendingHideoutItemId ??= null;
  state.run.returnToCity ??= null;
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
  state.run.raidDogs ||= [];
  state.run.groundLoots ||= [];
  state.run.decorativeNpcs ||= [];
  state.run.policeTimer ||= 0;
  state.run.policeMessage ??= null;
  state.run.policeScene ??= null;
  state.run.tutorialFirstRaid = Boolean(state.run.tutorialFirstRaid);
  state.run.temporaryStay ??= null;
  state.run.summary ??= null;
  state.run.summaryTimer ||= 0;
  normalizePlayerShopState(state);
  calculateProduction(state.player);
  syncShopNpcsForBusinessMap(state);
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

function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
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

function playerLevelValue(player = state?.player) {
  return Math.max(1, Math.floor(Number(player?.level || player?.nivelJogador || 1)));
}

function businessUnlocked(player = state?.player) {
  return playerLevelValue(player) >= BUSINESS_UNLOCK_LEVEL;
}

function businessLockedMessage() {
  return `Negocios e drogas de jogadores liberam no nivel ${BUSINESS_UNLOCK_LEVEL}.`;
}

function guidedTutorialActive() {
  return Boolean(
    characterTutorialVisible ||
    tutorialStep(state) ||
    state?.player?.petTutorialActive ||
    state?.player?.businessTutorialActive
  );
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
    fleeing: "Fugindo",
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
  if (mode === "fleeing") return "Correndo para fora do mapa";
  if (mode === "returning") return "Voltando para o esconderijo";
  if (mode === "summary") return "Confira o loot ou repita o assalto";
  if (mode === "npc-test") return "Conferindo mapa, recorte e posicionamento dos NPCs";
  return "Idle ativo";
}

elements.masterToggle?.addEventListener("click", toggleMaster);
elements.autoRaidToggle?.addEventListener("click", () => {
  if (elements.autoRaidPanel?.classList.contains("hidden")) {
    showAutoRaidConfirm();
  } else {
    hideAutoRaidConfirm();
  }
});
elements.autoRaidCancel?.addEventListener("click", hideAutoRaidConfirm);
elements.autoRaidConfirm?.addEventListener("click", startAutoRaidFromConfirm);
elements.canvas.addEventListener("pointerdown", handleStagePointer);
document.addEventListener("keydown", handleGameKeyDown);
document.addEventListener("keyup", handleGameKeyUp);
window.addEventListener("blur", clearKeyboardMovement);
window.addEventListener("resize", handleViewportChange);
window.addEventListener("orientationchange", handleViewportChange);
installMobileZoomBlock();
document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
}, { capture: true });

function round(value) {
  return Math.round(value * 100) / 100;
}

function installMobileZoomBlock() {
  let lastTouchEnd = 0;
  document.addEventListener("touchstart", (event) => {
    if (event.touches?.length > 1) event.preventDefault();
  }, { passive: false });
  document.addEventListener("touchmove", (event) => {
    if (event.touches?.length > 1) event.preventDefault();
  }, { passive: false });
  document.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("dblclick", (event) => event.preventDefault(), { passive: false, capture: true });
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
  if (isGuidedFirstRaidSummary()) {
    showToast("Retorne para a cidade para continuar o tutorial.");
    return;
  }
  combat.repeatLastRaid();
  renderAll();
});

elements.raidNextButton?.addEventListener("click", () => {
  if (isGuidedFirstRaidSummary()) {
    showToast("Retorne para a cidade para continuar o tutorial.");
    return;
  }
  startNextRaidFromSummary();
});

elements.raidReturnButton?.addEventListener("click", () => {
  combat.returnFromSummary();
  renderAll();
});

elements.autoRepeatToggle?.addEventListener("change", () => {
  if (isGuidedFirstRaidSummary()) {
    state.settings.autoRepeatRaid = false;
    elements.autoRepeatToggle.checked = false;
    showToast("Auto repetir libera depois do tutorial.");
    return;
  }
  state.settings.autoRepeatRaid = elements.autoRepeatToggle.checked;
  syncRaidSummary();
  showToast(state.settings.autoRepeatRaid ? "Auto repetir ativado." : "Auto repetir desativado.");
});
