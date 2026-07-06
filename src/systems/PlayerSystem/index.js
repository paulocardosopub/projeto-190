import { createEmptyInventory, createStarterEquipment, createStarterInventory } from "../InventorySystem/index.js?v=stack-1";

export function createNewGame(playerId) {
  return {
    version: 1,
    selectedPlayerId: playerId,
    scene: "city",
    currentMapId: null,
    activeAssaultTier: 1,
    selectedInventoryIndex: null,
    selectedVaultIndex: null,
    log: ["Cidade inicial desbloqueada."],
    tutorial: {
      version: 3,
      active: true,
      completed: false,
      step: "character_selected",
      skipped: false
    },
    player: {
      playerId: null,
      username: "",
      isGuest: false,
      displayName: "",
      characterId: playerId,
      factionId: null,
      level: 1,
      highestMapUnlocked: 1,
      lastRaidMapId: null,
      lastRaidMapNumber: 0,
      hideoutTier: 0,
      hideoutItems: {},
      xp: 0,
      nextXp: 100,
      money: 0,
      hp: 0,
      staminaAtual: 120,
      staminaMax: 120,
      staminaRegenPorMinuto: 2,
      needsHideoutRest: false,
      lastHideoutRestAt: 0,
      nivelJogador: 1,
      casaAtual: null,
      carroAtual: null,
      terrenoAtual: null,
      ownedHouses: [],
      ownedCars: [],
      terrenosComprados: [],
      maiorTerrenoDesbloqueado: 1,
      passiveVault: {
        amount: 0,
        accumulatedSeconds: 0,
        lastUpdatedAt: Date.now()
      },
      personalVault: {
        money: 0,
        items: createEmptyInventory(36)
      },
      equipment: createStarterEquipment(),
      inventory: createStarterInventory(),
      businessTutorialCompleted: false,
      businessTutorialSkipped: false,
      businessTutorialActive: false,
      businessTutorialStep: null
    },
    run: {
      mode: "city",
      playerX: 190,
      playerDirection: "right",
      npcs: [],
      targetId: null,
      timer: 0,
      enemyHp: 0,
      enemyMaxHp: 0,
      playerAttackTimer: 0,
      enemyAttackTimer: 0,
      playerAction: null,
      playerActionTimer: 0,
      playerActionDuration: 0,
      cityTargetX: null,
      pendingHideoutPortalId: null,
      pendingHideoutItemId: null,
      attempts: 0,
      caughtInFlagrante: 0,
      battlesStarted: 0,
      damageNumbers: [],
      itemTheftChats: [],
      raidDogs: [],
      nearHideoutHouse: false,
      hideoutRestHint: null,
      policeTimer: 0,
      policeMessage: null,
      policeScene: null,
      tutorialFirstRaid: false,
      summary: null,
      summaryTimer: 0
    },
    settings: {
      sound: true,
      music: false,
      quality: "pixel",
      autoRepeatRaid: false,
      visual: {
        version: 2,
        playerHeight: 78,
        npcHeight: 82,
        groundY: 274,
        playerYOffset: 0,
        npcYOffset: 0,
        cameraLead: 280,
        maps: {},
        players: {},
        npcs: {}
      },
      onlineProvider: "supabase",
      onlineUrl: "ws://localhost:4191",
      supabaseUrl: "",
      supabaseKey: ""
    }
  };
}

export function gainXp(player, amount) {
  let leveled = 0;
  player.xp += amount;

  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level += 1;
    player.nextXp = Math.round(player.nextXp * 1.22 + 35);
    leveled += 1;
  }

  return leveled;
}

export function addLog(state, message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 14);
}
