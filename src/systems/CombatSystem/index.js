import { IDLE_MAPS, MAPS } from "../../data/maps/index.js?v=spawn-height-1";
import { SPRITES } from "../../data/assets.js?v=petshop-portal-1";
import { NPC_ALERT_LINES } from "../../data/enemies/index.js?v=npc-crops-1";
import { decorativeNpcsForIdleMap } from "../../data/decorativeNpcs/index.js?v=idle-npcs-1";
import { calculateStats } from "../EquipmentSystem/index.js";
import { createNpcWave, createEnemyStats } from "../EnemySystem/index.js?v=npc-crops-1";
import { rollLoot, applyLoot } from "../LootSystem/index.js?v=stack-1";
import { gainXp, addLog } from "../PlayerSystem/index.js";
import { applyHospitalFee, applyPrisonFee } from "../PenaltySystem/index.js?v=hospital-fee-1";
import { canStartRaid, consumeStaminaForMap, staminaRaidBlockedMessage } from "../StaminaSystem/index.js?v=phase1-1";
import { confiscateDrugItems } from "../DrugSystem/index.js?v=stack-1";
import { theftConfig } from "../../data/balance/index.js?v=phase1-1";
import { getEquippedPet, normalizePets, petDamageForAttack } from "../../data/pets/index.js?v=pets-manual-1";

const CHOICE_AUTO_FIGHT_SECONDS = 5;
const ITEM_THEFT_CHAT_SECONDS = 5.5;
const POLICE_RISK_STARTS_AFTER_FIGHTS = 2;
const GROUND_LOOT_PICKUP_DISTANCE = 22;
const GROUND_LOOT_PICKUP_DELAY = 0.4;
const FLEE_SPEED = 520;
const FLEE_MAX_SECONDS = 2.2;
const POLICE_SIREN_SECONDS = 3.2;
const CITY_SPAWN_X = 190;
const HIDEOUT_SPAWN_X = 260;
const RAID_DOG_ATTACK_CHANCE = 0.1;
const RAID_DOG_TRIGGER_DISTANCE = 52;
const RAID_DOG_ATTACK_SECONDS = 0.42;
const RAID_DOG_HIT_AT_SECONDS = 0.2;
const RAID_DOG_ATTACK_SPEED = 250;
const RAID_DOG_FLEE_SPEED = 340;
const RAID_DOG_PET_IDS = ["boxer", "doberman", "rottweiler", "cane-corso", "american-bully", "bull-terrier"];

const POLICE_WARNINGS = [
  "Dessa vez ficou so no prejuizo. Na proxima, voce vai junto.",
  "Confiscado. E agradece por nao estar algemado agora.",
  "Considera isso um aviso. Se eu te pegar de novo, acabou a conversa.",
  "Hoje voce perdeu so isso ai. Da proxima, perde a liberdade.",
  "Vai embora e pensa bem antes de tentar essa gracinha de novo.",
  "Isso aqui fica com a policia. Voce fica com o aviso.",
  "Te dei uma chance. Nao me faz me arrepender.",
  "Se aparecer de novo fazendo isso, vai direto pro camburao.",
  "Agora some da minha frente antes que eu mude de ideia.",
  "Da proxima vez nao vai ter sermao, vai ter ocorrencia.",
  "Ta confiscado. E voce ta marcado, entendeu?",
  "Eu vou lembrar da sua cara. Nao testa a minha paciencia.",
  "Hoje passou raspando. Amanha pode nao ter a mesma sorte.",
  "Vai brincar de esperto longe daqui, porque comigo nao cola.",
  "Isso aqui e o preco do seu vacilo. O proximo e cadeia.",
  "Pode ir. Mas se eu te ver de novo, a conversa vai ser outra.",
  "Voce escapou barato. Muito barato.",
  "Aprende com o prejuizo e nao repete essa burrada.",
  "Um passo errado de novo e eu te levo pro xadrez.",
  "Ta liberado... por enquanto."
];

const ITEM_THEFT_LINES = [
  "Ei, isso era meu!",
  "Que isso? Cade meu negocio?",
  "Eu acabei de comprar isso!",
  "Volta aqui com isso agora!",
  "Ta achando que eu nao vi?",
  "Ladrao! Pega ladrao!",
  "Vou chamar a policia!",
  "Devolve antes que eu grite!",
  "Voce pegou isso de mim, ne?",
  "Eu vi essa mao ai!",
  "Nao acredito que voce fez isso na minha frente.",
  "Isso nao vai ficar assim!",
  "Me devolve agora ou vai dar ruim.",
  "O folgado, isso e meu!",
  "Tu ta maluco de mexer nas minhas coisas?",
  "Eu ralei pra comprar isso!",
  "Ah nao, hoje nao. Devolve!",
  "Pode parando ai, espertinho.",
  "Isso ai nao e seu nao!",
  "Eu sabia que tinha algo estranho.",
  "Voce acabou de me roubar?",
  "Minha nossa, que cara de pau!",
  "Pega esse sujeito antes que ele suma!",
  "Eu vou te denunciar!",
  "Me devolve e eu finjo que nao vi.",
  "Voce vai se arrepender disso.",
  "Acabou de comprar e ja me roubam? Que inferno!",
  "Cade meu item? Eu estava com ele agora!",
  "Nao vem pagar de inocente nao.",
  "Voce acha que eu sou otario?",
  "Isso tem dono, parceiro!",
  "Larga isso ai agora!",
  "Eu quero meu item de volta!",
  "Voce mexeu no bolso errado.",
  "Vou chamar a policia agora!",
  "Ah, entao e assim que voce joga?",
  "Que vergonha, roubando os outros assim.",
  "Se eu te pegar de novo, vai ser pior.",
  "Some daqui antes que eu perca a cabeca!",
  "Hoje eu nao deixo barato nao."
];

export class CombatSystem {
  constructor(state, hooks = {}) {
    this.state = state;
    this.hooks = hooks;
    this.syncHpToStats();
    normalizePets(this.state.player, { silent: true });
  }

  setHooks(hooks) {
    this.hooks = hooks;
  }

  enterCity(options = {}) {
    const playerX = clampWorldX(options.playerX ?? CITY_SPAWN_X);
    this.state.scene = "city";
    this.state.currentMapId = null;
    this.state.run = {
      mode: "city",
      playerX,
      playerDirection: options.playerDirection || "right",
      npcs: [],
      targetId: null,
      timer: 0,
      raidDuration: 0,
      raidTimeLeft: 0,
      enemyHp: 0,
      enemyMaxHp: 0,
      playerAttackTimer: 0,
      enemyAttackTimer: 0,
      playerAction: null,
      playerActionTimer: 0,
      playerActionDuration: 0,
      cityTargetX: null,
      attempts: 0,
      caughtInFlagrante: 0,
      battlesStarted: 0,
      choiceTimer: 0,
      pendingCityNpcId: null,
      pendingCityPortalId: null,
      pendingHideoutPortalId: null,
      pendingIdlePortalId: null,
      pendingIdleNpcId: null,
      pendingHideoutItemId: null,
      returnToCity: null,
      damageNumbers: [],
      itemTheftChats: [],
      raidDogs: [],
      groundLoots: [],
      decorativeNpcs: [],
      summary: null,
      summaryTimer: 0
    };
    this.syncHpToStats();
    if (options.logMessage !== false) addLog(this.state, options.logMessage || "Voce voltou para a cidade.");
    this.emit();
  }

  enterIdleMap(mapId, options = {}) {
    const map = IDLE_MAPS.find((candidate) => candidate.id === mapId);
    if (!map) return;
    const temporaryStay = options.temporaryStay
      ? {
          duration: Number(options.temporaryStay.duration || 0),
          remaining: Number(options.temporaryStay.duration || 0),
          label: options.temporaryStay.label || "",
          returnScene: options.temporaryStay.returnScene || "city",
          returnX: options.temporaryStay.returnX ?? 120,
          returnDirection: options.temporaryStay.returnDirection || "right",
          returnLog: options.temporaryStay.returnLog || "",
          completionToast: options.temporaryStay.completionToast || "",
          healOnReturn: Boolean(options.temporaryStay.healOnReturn)
        }
      : null;

    this.state.scene = "idle";
    this.state.currentMapId = map.id;
    this.state.run = {
      mode: temporaryStay ? "temporary" : "idle",
      playerX: clampWorldX(options.playerX ?? map.spawnX ?? 120),
      playerDirection: options.playerDirection || "right",
      npcs: cloneIdleNpcs(map.npcs),
      targetId: null,
      timer: 0,
      raidDuration: 0,
      raidTimeLeft: 0,
      enemyHp: 0,
      enemyMaxHp: 0,
      playerAttackTimer: 0,
      enemyAttackTimer: 0,
      playerAction: null,
      playerActionTimer: 0,
      playerActionDuration: 0,
      cityTargetX: null,
      attempts: 0,
      caughtInFlagrante: 0,
      battlesStarted: 0,
      choiceTimer: 0,
      pendingCityNpcId: null,
      pendingCityPortalId: null,
      pendingHideoutPortalId: null,
      pendingIdlePortalId: null,
      pendingIdleNpcId: null,
      pendingHideoutItemId: null,
      returnToCity: options.returnToCity || null,
      damageNumbers: [],
      itemTheftChats: [],
      raidDogs: [],
      groundLoots: [],
      decorativeNpcs: decorativeNpcsForIdleMap(map.id),
      policeTimer: 0,
      policeMessage: null,
      policeScene: null,
      temporaryStay,
      summary: null,
      summaryTimer: 0
    };
    this.syncHpToStats();
    if (options.logMessage) addLog(this.state, options.logMessage);
    this.emit();
  }

  enterTemporaryStay({ mapId, duration, label, returnX, returnDirection = "right", logMessage, completionToast, healOnReturn = false, playerX = 120 }) {
    this.enterIdleMap(mapId, {
      playerX,
      temporaryStay: {
        duration,
        label,
        returnScene: "city",
        returnX,
        returnDirection,
        completionToast,
        healOnReturn
      },
      logMessage
    });
  }

  enterPrison() {
    this.enterTemporaryStay({
      mapId: "prisao",
      duration: 30,
      label: "cumprindo pena",
      playerX: 260,
      returnX: CITY_SPAWN_X,
      returnDirection: "right",
      logMessage: "Voce foi levado para a prisao.",
      completionToast: "Pena cumprida. Voce voltou para a cidade."
    });
  }

  enterHospital() {
    this.enterTemporaryStay({
      mapId: "hospital",
      duration: 30,
      label: "Aguarde o tratamento finalizar",
      playerX: 260,
      returnX: CITY_SPAWN_X,
      returnDirection: "right",
      logMessage: "Voce foi levado para o hospital.",
      completionToast: "Tratamento finalizado. Voce voltou para a cidade.",
      healOnReturn: true
    });
  }

  enterHideout(tier = this.state.player.terrenoAtual || this.state.player.hideoutTier || 1) {
    this.state.scene = "hideout";
    this.state.currentMapId = null;
    this.state.player.hideoutTier = tier;
    this.state.run = {
      mode: "hideout",
      playerX: HIDEOUT_SPAWN_X,
      playerDirection: "right",
      npcs: [],
      targetId: null,
      timer: 0,
      raidDuration: 0,
      raidTimeLeft: 0,
      enemyHp: 0,
      enemyMaxHp: 0,
      playerAttackTimer: 0,
      enemyAttackTimer: 0,
      playerAction: null,
      playerActionTimer: 0,
      playerActionDuration: 0,
      cityTargetX: null,
      attempts: 0,
      caughtInFlagrante: 0,
      battlesStarted: 0,
      choiceTimer: 0,
      pendingCityNpcId: null,
      pendingCityPortalId: null,
      pendingHideoutPortalId: null,
      pendingIdlePortalId: null,
      pendingIdleNpcId: null,
      pendingHideoutItemId: null,
      returnToCity: null,
      damageNumbers: [],
      itemTheftChats: [],
      raidDogs: [],
      groundLoots: [],
      decorativeNpcs: [],
      summary: null,
      summaryTimer: 0
    };
    this.syncHpToStats();
    addLog(this.state, "Voce entrou no esconderijo.");
    this.emit();
  }

  enterMap(mapId, options = {}) {
    const map = MAPS.find((candidate) => candidate.id === mapId);
    if (!map) return;
    const highestUnlocked = this.state.player.highestMapUnlocked || 1;
    if (!this.state.settings?.visualPreview && !canStartRaid(this.state.player, map)) {
      const message = staminaRaidBlockedMessage(this.state.player, map);
      addLog(this.state, message);
      this.hooks.onToast?.(message);
      this.emit();
      return;
    }
    const stats = calculateStats(this.state.player);
    if (this.state.player.needsHideoutRest && Number(this.state.player.hp || 0) < stats.maxHp * 0.6) {
      addLog(this.state, "Voce precisa repousar no esconderijo antes de sair.");
      this.emit();
      return;
    }
    if (!this.state.settings?.visualPreview && map.index > highestUnlocked) {
      addLog(this.state, `${map.name} ainda esta bloqueado.`);
      this.emit();
      return;
    }
    if (!this.state.settings?.visualPreview) {
      const staminaSpent = consumeStaminaForMap(this.state.player, map);
      addLog(this.state, `Stamina consumida: -${staminaSpent}.`);
    }
    this.state.scene = "map";
    this.state.currentMapId = map.id;
    const npcs = createNpcWave(map);
    const raidDogs = createRaidDogs(map, npcs);
    this.state.run = {
      mode: "seeking",
      playerX: 82,
      playerDirection: "right",
      npcs,
      targetId: null,
      timer: 0,
      raidDuration: 60,
      raidTimeLeft: 60,
      enemyHp: 0,
      enemyMaxHp: 0,
      playerAttackTimer: 0,
      enemyAttackTimer: 0,
      playerAction: null,
      playerActionTimer: 0,
      playerActionDuration: 0,
      cityTargetX: null,
      attempts: 0,
      caughtInFlagrante: 0,
      battlesStarted: 0,
      choiceTimer: 0,
      pendingCityNpcId: null,
      pendingHideoutPortalId: null,
      pendingIdlePortalId: null,
      pendingIdleNpcId: null,
      pendingHideoutItemId: null,
      returnToCity: null,
      damageNumbers: [],
      itemTheftChats: [],
      raidDogs,
      groundLoots: [],
      decorativeNpcs: [],
      targetDropId: null,
      policeTimer: 0,
      policeMessage: null,
      policeScene: null,
      tutorialFirstRaid: Boolean(options.tutorialFirstRaid),
      raidStartSnapshot: createRaidStartSnapshot(this.state.player),
      summary: createRaidSummary(map, npcs.length),
      summaryTimer: 0
    };
    this.syncHpToStats();
    addLog(this.state, `Assalto iniciado: ${map.name}.`);
    this.hooks.onRaidStart?.("Roube o maximo que conseguir!");
    this.emit();
  }

  update(dt) {
    const run = this.state.run;
    this.updatePlayerAction(dt);
    this.updatePet(dt);
    this.updateDamageNumbers(dt);
    this.updateItemTheftChats(dt);
    this.updateGroundLoots(dt);
    if (run.mode === "police") {
      this.updatePoliceConfiscation(dt);
      return;
    }
    if (run.mode === "temporary") {
      this.updateFreeMovement(dt);
      this.updateTemporaryStay(dt);
      return;
    }
    if (run.mode === "idle") {
      this.updateFreeMovement(dt);
      return;
    }
    if (run.mode === "summary") {
      this.updateRaidSummary(dt);
      return;
    }
    if (run.mode === "npc-test") return;
    if (run.mode === "city" || run.mode === "hideout") {
      this.updateFreeMovement(dt);
      return;
    }
    if (run.mode === "choice") {
      this.updateChoiceTimer(dt);
      return;
    }
    if (run.mode === "fleeing") {
      this.updateFleeing(dt);
      return;
    }
    if (run.mode === "returning") return;
    if (this.state.scene !== "map") return;

    const map = this.currentMap();
    if (!map) return;

    if (this.updateRaidDogs(dt, map)) return;

    run.raidTimeLeft = Math.max(0, (run.raidTimeLeft ?? 0) - dt);
    if (run.raidTimeLeft <= 0) {
      this.finishMap("time");
      return;
    }

    for (const npc of run.npcs) {
      if (npc.done || npc.alerted) continue;
      npc.walkPhase += dt;
      npc.x += Math.sin(npc.walkPhase * 0.75) * dt * 6;
      setNpcDirection(npc, Math.sin(npc.walkPhase * 0.75) > 0.35 ? "right" : "back");
    }

    if (run.mode === "seeking") {
      const drop = this.nextGroundLoot();
      if (drop) {
        run.targetDropId = drop.id;
        run.mode = "collectingLoot";
        return;
      }
      const target = this.nextTarget();
      if (!target) {
        this.finishMap();
        return;
      }
      run.targetId = target.id;
      run.mode = "approaching";
      run.timer = 0;
    }

    if (run.mode === "approaching") {
      const target = this.targetNpc();
      if (!target) {
        run.mode = "seeking";
        return;
      }
      const destination = target.x - 42;
      const direction = Math.sign(destination - run.playerX) || 1;
      run.playerDirection = target.x >= run.playerX ? "right" : "left";
      run.playerX += direction * dt * 105;
      if (Math.abs(destination - run.playerX) < 5) {
        run.playerX = destination;
        run.playerDirection = target.x >= run.playerX ? "right" : "left";
        run.mode = "stealing";
        run.timer = 1.05;
        setNpcDirection(target, "back");
        addLog(this.state, `Tentando roubar ${target.name}...`);
      }
    }

    if (run.mode === "collectingLoot") {
      this.updateLootCollection(dt);
    }

    if (run.mode === "stealing") {
      this.faceTarget();
      run.timer -= dt;
      if (run.timer <= 0) this.resolveSteal();
    }

    if (run.mode === "combat") {
      this.faceTarget();
      this.updateCombat(dt);
    }

    if (!this.nextTarget() && !this.hasGroundLoots() && run.mode !== "combat" && run.mode !== "collectingLoot") {
      this.finishMap("clear");
    }
  }

  chooseFlee() {
    const target = this.targetNpc();
    if (target) {
      target.alerted = false;
      setNpcDirection(target, "right");
    }
    const run = this.state.run;
    run.choiceTimer = 0;
    run.targetId = null;
    run.enemy = null;
    run.enemyHp = 0;
    run.enemyMaxHp = 0;
    run.mode = "fleeing";
    run.fleeTimer = 0;
    run.playerDirection = "left";
    run.playerAction = null;
    run.playerActionTimer = 0;
    run.playerActionDuration = 0;
    addLog(this.state, "Voce saiu correndo do combate.");
    this.hooks.onToast?.("Fugindo do mapa.");
    this.emit();
  }

  chooseFight() {
    const target = this.targetNpc();
    const map = this.currentMap();
    if (!target || !map) return;
    if (this.shouldTriggerPoliceBeforeFight()) {
      this.triggerPoliceConfiscation();
      this.emit();
      return;
    }

    const enemy = createEnemyStats(target, map);
    this.state.run.battlesStarted = (this.state.run.battlesStarted || 0) + 1;
    target.alerted = true;
    setNpcDirection(target, "left");
    this.state.run.mode = "combat";
    this.state.run.choiceTimer = 0;
    this.faceTarget();
    this.state.run.enemy = enemy;
    this.state.run.enemyHp = enemy.hp;
    this.state.run.enemyMaxHp = enemy.hp;
    this.state.run.playerAttackTimer = 0.35;
    this.state.run.enemyAttackTimer = 0.75;
    addLog(this.state, `${target.name} partiu para briga.`);
    this.emit();
  }

  currentMap() {
    if (this.state.scene === "idle") {
      return IDLE_MAPS.find((map) => map.id === this.state.currentMapId);
    }
    return MAPS.find((map) => map.id === this.state.currentMapId);
  }

  moveCityTo(worldX) {
    if (this.state.scene !== "city" || this.state.run.mode !== "city") return;
    this.moveFreeSceneTo(worldX);
  }

  moveHideoutTo(worldX) {
    if (this.state.scene !== "hideout" || this.state.run.mode !== "hideout") return;
    this.moveFreeSceneTo(worldX);
  }

  moveIdleTo(worldX) {
    if (this.state.scene !== "idle" || !["idle", "temporary"].includes(this.state.run.mode)) return;
    this.moveFreeSceneTo(worldX);
  }

  moveFreeSceneTo(worldX) {
    const minX = 64;
    const maxX = SPRITES.background.width - 64;
    const targetX = Math.max(minX, Math.min(maxX, Math.round(worldX)));
    this.state.run.cityTargetX = targetX;
    this.state.run.playerDirection = targetX >= this.state.run.playerX ? "right" : "left";
    this.emit();
  }

  syncHpToStats() {
    const stats = calculateStats(this.state.player);
    const currentHp = Number(this.state.player.hp);
    if (!Number.isFinite(currentHp) || (currentHp <= 0 && !this.state.player.needsHideoutRest)) {
      this.state.player.hp = stats.maxHp;
    } else if (currentHp > stats.maxHp) {
      this.state.player.hp = stats.maxHp;
    } else if (currentHp < 0) {
      this.state.player.hp = 0;
    }
  }

  nextTarget() {
    return this.state.run.npcs.find((npc) => !npc.done);
  }

  targetNpc() {
    return this.state.run.npcs.find((npc) => npc.id === this.state.run.targetId);
  }

  faceTarget() {
    const target = this.targetNpc();
    if (!target) return;
    this.state.run.playerDirection = target.x >= this.state.run.playerX ? "right" : "left";
  }

  resolveSteal() {
    const stats = calculateStats(this.state.player);
    const target = this.targetNpc();
    const map = this.currentMap();
    if (!target) {
      this.state.run.mode = "seeking";
      return;
    }

    this.state.run.attempts += 1;
    const success = Math.random() <= calculateStealChanceForMap(map, stats);
    if (success) {
      const rewardResult = this.rewardTarget(false);
      if (rewardResult.itemStolen) {
        this.showItemTheftReaction(target);
      }
      this.finishTargetAfterSteal(target);
    } else {
      this.state.run.caughtInFlagrante = (this.state.run.caughtInFlagrante || 0) + 1;
      const alertLine = randomAlertLine();
      target.alerted = true;
      setNpcDirection(target, "left");
      target.alertLine = alertLine;
      this.state.run.mode = "choice";
      this.state.run.choiceTimer = CHOICE_AUTO_FIGHT_SECONDS;
      addLog(this.state, `${target.name}: "${alertLine}"`);
      this.hooks.onChoice?.(target);
    }
    this.emit();
  }

  rewardTarget(wonFight) {
    const map = this.currentMap();
    const stats = calculateStats(this.state.player);
    const reward = rollLoot(map, stats, wonFight);
    applyLoot(this.state, { money: reward.money, item: null });
    if (reward.item) this.spawnGroundLoot(reward.item);
    const levels = gainXp(this.state.player, reward.xp);
    this.syncHpToStats();
    this.addRewardToSummary({ ...reward, item: null }, false, levels, wonFight);

    const pieces = [`+R$ ${reward.money}`, `+${reward.xp} XP`];
    if (reward.item) pieces.push(`item no chao: ${reward.item.name}`);
    if (levels) pieces.push(`subiu ${levels} nivel`);

    addLog(this.state, pieces.join(" | "));
    this.hooks.onToast?.(pieces.join(" | "));
    return {
      reward,
      itemAdded: false,
      itemStolen: Boolean(reward.item)
    };
  }

  spawnGroundLoot(item) {
    const run = this.state.run;
    const target = this.targetNpc();
    const baseX = target?.x ?? run.playerX ?? 120;
    run.groundLoots ||= [];
    run.groundLoots.push({
      id: `${item.uid || item.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      item,
      x: Math.round(baseX + (Math.random() * 20 - 10)),
      age: 0,
      pickupDelay: GROUND_LOOT_PICKUP_DELAY,
      rarity: item.rarity,
      color: item.colorHex || rarityLootColor(item.rarity)
    });
    run.groundLoots = run.groundLoots.slice(-8);
  }

  updateGroundLoots(dt) {
    const run = this.state.run;
    if (!run.groundLoots?.length) return;
    run.groundLoots.forEach((drop) => {
      drop.age = (drop.age || 0) + dt;
    });
  }

  updateLootCollection(dt) {
    const run = this.state.run;
    const drop = this.targetGroundLoot() || this.nextGroundLoot();
    if (!drop) {
      run.targetDropId = null;
      run.mode = "seeking";
      return;
    }

    const destination = drop.x;
    const direction = Math.sign(destination - run.playerX) || 1;
    run.playerDirection = destination >= run.playerX ? "right" : "left";
    run.playerX += direction * dt * 118;

    if (Math.abs(destination - run.playerX) <= GROUND_LOOT_PICKUP_DISTANCE) {
      run.playerX = destination;
      if ((drop.age || 0) < (drop.pickupDelay || 0)) return;
      this.collectGroundLoot(drop);
      run.targetDropId = null;
      run.mode = "seeking";
    }
  }

  collectGroundLoot(drop) {
    const itemAdded = applyLoot(this.state, { money: 0, item: drop.item });
    this.state.run.groundLoots = (this.state.run.groundLoots || []).filter((candidate) => candidate.id !== drop.id);
    this.recordGroundLootPickup(drop.item, itemAdded);
    const message = itemAdded
      ? `Item coletado: ${drop.item.name}.`
      : `${drop.item.name} perdido: mochila cheia.`;
    addLog(this.state, message);
    this.hooks.onToast?.(message);
  }

  recordGroundLootPickup(item, itemAdded) {
    const summary = this.state.run.summary;
    if (!summary || !item) return;
    if (itemAdded) {
      summary.items.push(item.name);
      if (item.uid) summary.itemUids.push(item.uid);
    } else {
      summary.lostItems.push(item.name);
    }
  }

  nextGroundLoot() {
    return (this.state.run.groundLoots || [])[0] || null;
  }

  targetGroundLoot() {
    const id = this.state.run.targetDropId;
    return (this.state.run.groundLoots || []).find((drop) => drop.id === id) || null;
  }

  hasGroundLoots() {
    return Boolean(this.state.run.groundLoots?.length);
  }

  finishTargetAfterSteal(target) {
    if (target) {
      target.done = true;
      target.robbed = true;
      target.alerted = false;
      target.alertLine = null;
    }
    this.state.run.targetId = null;
    this.state.run.mode = "seeking";
  }

  showItemTheftReaction(target) {
    const line = randomItemTheftLine();
    this.state.run.itemTheftChats ||= [];
    this.state.run.itemTheftChats.push({
      line,
      x: target.x,
      sheet: target.sheet || "enemies",
      row: target.row,
      columnOffset: Number(target.columnOffset || 0),
      direction: target.fixedFrame ? target.direction : "left",
      heightScale: Number(target.heightScale || 1),
      actorHidden: false,
      age: 0,
      duration: ITEM_THEFT_CHAT_SECONDS
    });
    this.state.run.itemTheftChats = this.state.run.itemTheftChats.slice(-4);
    addLog(this.state, `${target.name}: "${line}"`);
  }

  updateItemTheftChats(dt) {
    const run = this.state.run;
    if (!run.itemTheftChats?.length) return;
    run.itemTheftChats.forEach((chat) => {
      chat.age += dt;
    });
    run.itemTheftChats = run.itemTheftChats.filter((chat) => chat.age < chat.duration);
  }

  updateChoiceTimer(dt) {
    const run = this.state.run;
    run.choiceTimer = Number.isFinite(run.choiceTimer)
      ? Math.max(0, run.choiceTimer - dt)
      : CHOICE_AUTO_FIGHT_SECONDS;
    if (run.choiceTimer > 0) return;
    this.hooks.onChoiceTimeout?.();
    addLog(this.state, "Voce demorou para reagir e a briga comecou.");
    this.chooseFight();
  }

  updateCombat(dt) {
    const run = this.state.run;
    const target = this.targetNpc();
    const player = this.state.player;
    const stats = calculateStats(player);
    const enemy = run.enemy;

    if (!target || !enemy) {
      run.mode = "seeking";
      return;
    }

    run.playerAttackTimer -= dt * stats.speed;
    run.enemyAttackTimer -= dt * enemy.speed;

    if (run.playerAttackTimer <= 0) {
      run.playerAttackTimer = 1;
      let damage = Math.max(1, stats.attack - Math.round(enemy.block * stats.attack));
      const critical = Math.random() < stats.crit;
      if (critical) damage = Math.round(damage * 1.75);
      run.enemyHp = Math.max(0, run.enemyHp - damage);
      this.pushDamageNumber(damage, target.x, critical ? "crit" : "enemy");
      this.triggerPlayerAction("attack", 0.46);
      addLog(this.state, `Voce causou ${damage} de dano.`);
    }

    if (run.enemyHp <= 0) {
      target.done = true;
      target.alerted = false;
      run.enemy = null;
      run.enemyHp = 0;
      run.enemyMaxHp = 0;
      run.targetId = null;
      run.mode = "seeking";
      this.rewardTarget(true);
      addLog(this.state, `${target.name} desistiu da briga.`);
      this.emit();
      return;
    }

    if (run.enemyAttackTimer <= 0) {
      run.enemyAttackTimer = 1;
      if (Math.random() > stats.dodge) {
        const blocked = Math.random() < stats.block;
        const reduction = Math.min(0.75, Math.max(0, Number(stats.damageReduction || 0)));
        const damage = Math.max(1, Math.round(enemy.attack * (blocked ? 0.45 : 1) * (1 - reduction)));
        player.hp = Math.max(0, player.hp - damage);
        this.pushDamageNumber(damage, run.playerX, blocked ? "blocked" : "player");
        this.triggerPlayerAction("hurt", 0.42);
        addLog(this.state, `${enemy.name} causou ${damage} de dano.`);
      } else {
        addLog(this.state, "Voce desviou do golpe.");
      }
    }

    if (player.hp <= 0) {
      player.hp = 0;
      player.needsHideoutRest = true;
      const hospitalBill = applyHospitalFee(player);
      addLog(this.state, "Voce caiu na briga e foi levado para o hospital.");
      addLog(this.state, `Taxa hospitalar: R$ ${hospitalBill.charged}.`);
      this.hooks.onToast?.("Briga perdida. Tratamento iniciado no hospital.");
      this.enterHospital();
      this.hooks.onHospitalBill?.(hospitalBill);
    }
  }

  updateRaidDogs(dt, map) {
    const run = this.state.run;
    if (!Array.isArray(run.raidDogs) || !run.raidDogs.length) return false;

    const playerX = Number(run.playerX || 0);
    let flowChanged = false;

    for (const dog of run.raidDogs) {
      if (!dog || dog.done) continue;
      dog.x = Number.isFinite(Number(dog.x)) ? Number(dog.x) : playerX + 120;
      dog.walkPhase = Number(dog.walkPhase || 0) + dt;

      if (dog.state === "attacking") {
        dog.direction = dog.x >= playerX ? "left" : "right";
        dog.attackTimer = Math.max(0, Number(dog.attackTimer || 0) - dt);
        dog.hitTimer = Math.max(0, Number(dog.hitTimer || 0) - dt);
        dog.x += Math.sign(playerX - dog.x || (dog.direction === "right" ? 1 : -1)) * dt * RAID_DOG_ATTACK_SPEED;

        if (!dog.hitApplied && dog.hitTimer <= 0) {
          dog.hitApplied = true;
          flowChanged = this.applyRaidDogHit(dog, map);
          if (flowChanged) break;
        }

        if (dog.attackTimer <= 0) startRaidDogFlee(dog, playerX);
        continue;
      }

      if (dog.state === "fleeing") {
        dog.direction = dog.fleeDirection || "right";
        dog.x += (dog.direction === "left" ? -1 : 1) * dt * RAID_DOG_FLEE_SPEED;
        if (dog.x < -140 || dog.x > SPRITES.background.width + 140) dog.done = true;
        continue;
      }

      const drift = Math.sin(dog.walkPhase * 0.9) * dt * 9;
      dog.x = clamp(dog.x + drift, 120, SPRITES.background.width - 90);
      if (Math.abs(drift) > 0.02) dog.direction = drift >= 0 ? "right" : "left";

      if (!canRaidDogTrigger(run.mode) || dog.checked) continue;
      if (Math.abs(playerX - dog.x) > RAID_DOG_TRIGGER_DISTANCE) continue;

      dog.checked = true;
      if (Math.random() <= RAID_DOG_ATTACK_CHANCE) {
        startRaidDogAttack(dog, playerX);
        addLog(this.state, "Um cachorro de guarda avancou em voce!");
        this.hooks.onToast?.("Cachorro de guarda atacando!");
      }
    }

    run.raidDogs = run.raidDogs.filter((dog) => dog && !dog.done);
    return flowChanged;
  }

  applyRaidDogHit(dog, map) {
    const player = this.state.player;
    const run = this.state.run;
    const damage = Math.max(1, Math.round(Number(dog.damage || averageEnemyDamage(map, run.npcs || [])) || 1));
    player.hp = Math.max(0, Number(player.hp || 0) - damage);
    this.pushDamageNumber(damage, run.playerX, "player");
    this.triggerPlayerAction("hurt", 0.38);
    addLog(this.state, `Cachorro de guarda causou ${damage} de dano.`);
    this.hooks.onToast?.(`Cachorro de guarda: -${damage} HP.`);

    if (player.hp > 0) return false;

    player.hp = 0;
    player.needsHideoutRest = true;
    const hospitalBill = applyHospitalFee(player);
    addLog(this.state, "Voce caiu no assalto e foi levado para o hospital.");
    addLog(this.state, `Taxa hospitalar: R$ ${hospitalBill.charged}.`);
    this.hooks.onToast?.("Ferimento grave. Tratamento iniciado no hospital.");
    this.enterHospital();
    this.hooks.onHospitalBill?.(hospitalBill);
    return true;
  }

  updatePet(dt) {
    const run = this.state.run;
    const player = this.state.player;
    if (!run || !player) return;

    const messages = normalizePets(player);
    messages.forEach((message) => {
      addLog(this.state, message);
      this.hooks.onToast?.(message);
    });

    run.pet ||= {};
    const pet = getEquippedPet(player);
    if (!pet || petHiddenInScene(this.state)) {
      run.pet.visible = false;
      run.pet.action = null;
      return;
    }

    run.pet.visible = true;
    const followDirection = run.playerDirection === "left" ? "left" : "right";
    player.lastPetFollowDirection = followDirection;
    run.pet.attackCooldownTimer = Math.max(0, Number(run.pet.attackCooldownTimer || 0) - dt);

    if (run.pet.actionTimer) {
      run.pet.actionTimer = Math.max(0, Number(run.pet.actionTimer || 0) - dt);
      if (run.pet.actionTimer <= 0 && run.pet.action === "attack") {
        run.pet.action = "returnToPlayer";
      }
    }

    if (run.mode === "combat") this.updatePetCombat(pet);

    const targetX = this.petFollowTargetX();
    if (!Number.isFinite(run.pet.x)) run.pet.x = targetX;
    const lerpSpeed = run.pet.action === "attack" ? 18 : 11;
    run.pet.x += (targetX - run.pet.x) * Math.min(1, dt * lerpSpeed);

    const maxLag = run.pet.action === "attack" ? 12 : 8;
    if (Math.abs(run.pet.x - targetX) > maxLag) {
      run.pet.x = targetX + Math.sign(run.pet.x - targetX) * maxLag;
    }

    if (run.pet.action === "returnToPlayer" && Math.abs(run.pet.x - targetX) <= 3) {
      run.pet.action = null;
    }

    if (run.pet.action !== "attack") run.pet.direction = followDirection;
  }

  updatePetCombat(pet) {
    const run = this.state.run;
    const target = this.targetNpc();
    const enemy = run.enemy;
    if (!target || !enemy || run.enemyHp <= 0) return;

    const side = target.x >= (run.playerX || 0) ? 1 : -1;
    if (run.pet.action !== "attack" && run.pet.attackCooldownTimer <= 0) {
      run.pet.action = "attack";
      run.pet.actionTimer = 0.48;
      run.pet.actionDuration = 0.48;
      run.pet.damageApplied = false;
      run.pet.direction = side < 0 ? "left" : "right";
      run.pet.attackCooldownTimer = Number(pet.cooldown || 1.5);
    }

    if (run.pet.action !== "attack" || run.pet.damageApplied) return;
    const duration = Number(run.pet.actionDuration || 0.48);
    const progress = Math.max(0, Math.min(1, (duration - Number(run.pet.actionTimer || 0)) / duration));
    if (progress < 0.48) return;

    const stats = calculateStats(this.state.player);
    const damage = petDamageForAttack(stats, enemy, pet);
    run.enemyHp = Math.max(0, Number(run.enemyHp || 0) - damage);
    run.pet.damageApplied = true;
    this.pushDamageNumber(damage, target.x, "enemy");
    addLog(this.state, `${pet.name} causou ${damage} de dano.`);
  }

  petFollowTargetX() {
    const run = this.state.run;
    const playerX = Number(run.playerX || 120);
    if (run.pet?.action === "attack") {
      const side = run.pet.direction === "left" ? -1 : 1;
      return playerX + side * 42;
    }
    const direction = run.playerDirection === "left" ? "left" : "right";
    return playerX + (direction === "left" ? 36 : -36);
  }

  finishMap(reason = "clear") {
    if (this.state.run.mode === "returning" || this.state.run.mode === "summary") return;
    const map = this.currentMap();
    const summary = this.state.run.summary || createRaidSummary(map, this.state.run.npcs.length);
    summary.remaining = this.remainingTargets();
    summary.finished = true;
    summary.finishedAt = Date.now();
    this.state.run.summary = summary;
    this.state.run.summaryTimer = 5;
    this.state.run.mode = "summary";
    this.state.run.targetId = null;
    this.state.run.enemy = null;
    this.state.run.enemyHp = 0;
    this.state.run.enemyMaxHp = 0;
    if (reason !== "time" && map?.index) {
      const previousUnlocked = this.state.player.highestMapUnlocked || 1;
      if (map.index >= previousUnlocked && previousUnlocked < MAPS.length) {
        this.state.player.highestMapUnlocked = Math.min(MAPS.length, map.index + 1);
        const nextMap = MAPS.find((candidate) => candidate.index === this.state.player.highestMapUnlocked);
        if (nextMap) addLog(this.state, `Novo mapa desbloqueado: ${nextMap.name}.`);
      }
    }
    addLog(this.state, "Assalto encerrado. Conferindo loot.");
    this.hooks.onToast?.("Assalto encerrado.");
    this.emit();
  }

  repeatLastRaid() {
    if (this.state.run?.tutorialFirstRaid) {
      this.hooks.onToast?.("Retorne para a cidade para continuar o tutorial.");
      return;
    }
    const mapId = this.state.run.summary?.mapId || this.state.currentMapId || MAPS[0].id;
    this.enterMap(mapId);
  }

  returnFromSummary() {
    const summary = this.state.run.summary;
    addLog(this.state, "Voltando para a cidade.");
    this.enterCity();
    this.hooks.onRaidReturn?.(summary);
  }

  updateRaidSummary(dt) {
    const run = this.state.run;
    run.summaryTimer = Math.max(0, (run.summaryTimer || 0) - dt);
    if (run.summaryTimer > 0) return;

    if (run.tutorialFirstRaid) {
      this.returnFromSummary();
      return;
    }

    if (this.state.settings?.autoRepeatRaid) {
      const map = MAPS.find((candidate) => candidate.id === (run.summary?.mapId || this.state.currentMapId));
      if (!canStartRaid(this.state.player, map)) {
        const message = staminaRaidBlockedMessage(this.state.player, map);
        this.state.settings.autoRepeatRaid = false;
        addLog(this.state, message);
        this.hooks.onToast?.(message);
        this.returnFromSummary();
        return;
      }
      this.repeatLastRaid();
      return;
    }

    this.returnFromSummary();
  }

  addRewardToSummary(reward, itemAdded, levels, wonFight) {
    const summary = this.state.run.summary;
    if (!summary) return;
    summary.money += reward.money;
    summary.xp += reward.xp;
    summary.targetsRobbed += 1;
    if (wonFight) summary.fightsWon += 1;
    if (levels) summary.levels += levels;
    if (reward.item && itemAdded) summary.items.push(reward.item.name);
    if (reward.item && itemAdded) summary.itemUids.push(reward.item.uid);
    if (reward.item && !itemAdded) summary.lostItems.push(reward.item.name);
    summary.remaining = this.remainingTargets();
  }

  shouldTriggerPoliceBeforeFight() {
    if (this.state.run?.tutorialFirstRaid) return false;
    return Math.random() < policePrisonChanceForFight(this.state.run.battlesStarted || 0);
  }

  triggerPoliceConfiscation() {
    const message = randomPoliceWarning();
    const target = this.targetNpc();
    if (target) {
      target.alerted = false;
      setNpcDirection(target, "left");
    }

    const confiscated = this.confiscateRaidLoot();
    const confiscatedDrugs = confiscateDrugItems(this.state.player);
    const prisonFee = applyPrisonFee(this.state.player);
    const prisonFeeLine = `Taxa da prisao: R$ ${prisonFee.charged}.`;
    const drugLine = confiscatedDrugs ? ` Drogas confiscadas: ${confiscatedDrugs}.` : "";
    const run = this.state.run;
    const playerX = Number(run.playerX || target?.x || 220);
    run.mode = "police";
    run.choiceTimer = 0;
    run.targetId = null;
    run.enemy = null;
    run.enemyHp = 0;
    run.enemyMaxHp = 0;
    run.policeTimer = POLICE_SIREN_SECONDS;
    run.policeMessage = `${message} ${prisonFeeLine}${drugLine}`;
    run.policeScene = {
      officers: [
        { x: Math.max(80, playerX - 74), direction: "right" },
        { x: playerX + 78, direction: "left" }
      ]
    };
    addLog(this.state, `Policia no local: ${message}`);
    addLog(this.state, `Loot confiscado: R$ ${confiscated.money}, ${confiscated.items} item(ns), ${confiscated.xp} XP.`);
    if (confiscatedDrugs) addLog(this.state, `Drogas confiscadas: ${confiscatedDrugs} unidade(s).`);
    addLog(this.state, prisonFeeLine);
    this.hooks.onPolice?.(`${message} ${prisonFeeLine}${drugLine}`);
    this.emit();
  }

  confiscateRaidLoot() {
    const run = this.state.run;
    const player = this.state.player;
    const summary = run.summary || createRaidSummary(this.currentMap(), run.npcs?.length || 0);
    run.summary = summary;
    const confiscated = {
      money: summary.money || 0,
      xp: summary.xp || 0,
      items: (summary.items?.length || 0) + (run.groundLoots?.length || 0)
    };

    const snapshot = run.raidStartSnapshot;
    if (snapshot) {
      player.money = snapshot.money;
      player.level = snapshot.level;
      player.xp = snapshot.xp;
      player.nextXp = snapshot.nextXp;
      if (Array.isArray(snapshot.inventory) && snapshot.equipment) {
        player.inventory = structuredClone(snapshot.inventory);
        player.equipment = structuredClone(snapshot.equipment);
      } else {
        const safeUids = new Set(snapshot.itemUids || []);
        player.inventory = (player.inventory || []).map((item) => item && safeUids.has(item.uid) ? item : null);
        Object.keys(player.equipment || {}).forEach((slot) => {
          const item = player.equipment[slot];
          if (item && !safeUids.has(item.uid)) player.equipment[slot] = null;
        });
      }
      this.syncHpToStats();
    } else {
      player.money = Math.max(0, (player.money || 0) - confiscated.money);
      const itemUids = new Set(summary.itemUids || []);
      if (itemUids.size) {
        player.inventory = (player.inventory || []).map((item) => item && itemUids.has(item.uid) ? null : item);
      }
    }

    summary.confiscated = true;
    summary.confiscatedMoney = confiscated.money;
    summary.confiscatedXp = confiscated.xp;
    summary.confiscatedItems = confiscated.items;
    summary.money = 0;
    summary.xp = 0;
    summary.items = [];
    summary.itemUids = [];
    summary.lostItems = [];
    run.groundLoots = [];
    run.targetDropId = null;
    summary.remaining = this.remainingTargets();
    summary.finished = true;
    summary.finishedAt = Date.now();
    return confiscated;
  }

  updatePoliceConfiscation(dt) {
    const run = this.state.run;
    run.policeTimer = Math.max(0, (run.policeTimer || 0) - dt);
    if (run.policeTimer > 0) return;
    const message = run.policeMessage || randomPoliceWarning();
    this.enterPrison();
    addLog(this.state, message);
    this.hooks.onToast?.(message);
    this.emit();
  }

  updateTemporaryStay(dt) {
    const run = this.state.run;
    const stay = run.temporaryStay;
    if (!stay) return;
    stay.remaining = Math.max(0, Number(stay.remaining || 0) - dt);
    if (stay.remaining > 0) return;

    if (stay.healOnReturn) {
      const stats = calculateStats(this.state.player);
      this.state.player.hp = stats.maxHp;
      this.state.player.needsHideoutRest = false;
    }

    if (stay.returnScene === "city") {
      const toast = stay.completionToast;
      this.enterCity({
        playerX: stay.returnX,
        playerDirection: stay.returnDirection,
        logMessage: stay.returnLog || toast || "Voce voltou para a cidade."
      });
      if (toast) this.hooks.onToast?.(toast);
    }
  }

  pushDamageNumber(value, worldX, type) {
    const run = this.state.run;
    run.damageNumbers ||= [];
    run.damageNumbers.push({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      value,
      worldX,
      type,
      age: 0,
      duration: 0.85,
      lift: 0
    });
    run.damageNumbers = run.damageNumbers.slice(-12);
  }

  updateDamageNumbers(dt) {
    const run = this.state.run;
    if (!run.damageNumbers?.length) return;
    run.damageNumbers.forEach((number) => {
      number.age += dt;
      number.lift = Math.min(1, number.age / number.duration);
    });
    run.damageNumbers = run.damageNumbers.filter((number) => number.age < number.duration);
  }

  remainingTargets() {
    return (this.state.run.npcs || []).filter((npc) => !npc.done).length;
  }

  triggerPlayerAction(action, duration) {
    this.state.run.playerAction = action;
    this.state.run.playerActionTimer = duration;
    this.state.run.playerActionDuration = duration;
  }

  updatePlayerAction(dt) {
    const run = this.state.run;
    if (!run.playerActionTimer) return;
    run.playerActionTimer = Math.max(0, run.playerActionTimer - dt);
    if (run.playerActionTimer <= 0) {
      run.playerAction = null;
      run.playerActionDuration = 0;
    }
  }

  updateFreeMovement(dt) {
    const run = this.state.run;
    if (!Number.isFinite(run.cityTargetX)) return;

    const distance = run.cityTargetX - run.playerX;
    if (Math.abs(distance) <= 2) {
      run.playerX = run.cityTargetX;
      run.cityTargetX = null;
      return;
    }

    const direction = Math.sign(distance);
    run.playerDirection = direction >= 0 ? "right" : "left";
    run.playerX += direction * Math.min(Math.abs(distance), dt * 150);
  }

  updateFleeing(dt) {
    const run = this.state.run;
    run.playerDirection = "left";
    run.fleeTimer = Number(run.fleeTimer || 0) + dt;
    run.playerX -= dt * FLEE_SPEED;
    if (run.playerX > -90 && run.fleeTimer < FLEE_MAX_SECONDS) return;

    addLog(this.state, "Voce fugiu do mapa e voltou para a cidade.");
    this.enterCity();
    this.hooks.onToast?.("Voce voltou para a cidade.");
  }

  emit() {
    this.hooks.onChange?.(this.state);
  }
}

function createRaidSummary(map, totalTargets = 0) {
  return {
    mapId: map?.id || null,
    mapName: map?.name || "Assalto",
    money: 0,
    xp: 0,
    items: [],
    lostItems: [],
    targetsTotal: totalTargets,
    targetsRobbed: 0,
    remaining: totalTargets,
    fightsWon: 0,
    levels: 0,
    itemUids: [],
    confiscated: false,
    confiscatedMoney: 0,
    confiscatedXp: 0,
    confiscatedItems: 0,
    finished: false,
    finishedAt: null
  };
}

export function policePrisonChanceForFight(battlesStarted = 0) {
  const count = Math.max(0, Number(battlesStarted || 0));
  if (count < POLICE_RISK_STARTS_AFTER_FIGHTS) return 0;
  return Math.min(1, (count - POLICE_RISK_STARTS_AFTER_FIGHTS + 1) * 0.1);
}

function createRaidDogs(map, npcs = []) {
  const count = Math.random() < 0.52 ? 1 : 2;
  const damage = averageEnemyDamage(map, npcs);
  const firstNpcX = Math.min(...npcs.map((npc) => Number(npc.x)).filter(Number.isFinite));
  const lastNpcX = Math.max(...npcs.map((npc) => Number(npc.x)).filter(Number.isFinite));
  const minX = Number.isFinite(firstNpcX) ? Math.max(230, firstNpcX - 120) : 310;
  const maxX = Number.isFinite(lastNpcX) ? Math.min(SPRITES.background.width - 120, lastNpcX - 40) : 1640;
  const span = Math.max(220, maxX - minX);

  return Array.from({ length: count }, (_, index) => {
    const lane = (index + 1) / (count + 1);
    const jitter = randomBetween(-95, 95);
    const x = clamp(minX + span * lane + jitter, 210, SPRITES.background.width - 110);
    return {
      id: `${map.id}-dog-${index}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      petId: RAID_DOG_PET_IDS[(Number(map.index || 1) + index) % RAID_DOG_PET_IDS.length],
      x: Math.round(x),
      direction: index % 2 === 0 ? "left" : "right",
      state: "idle",
      checked: false,
      hitApplied: false,
      damage,
      walkPhase: Math.random() * 10
    };
  });
}

function averageEnemyDamage(map, npcs = []) {
  const attacks = (npcs || [])
    .map((npc) => createEnemyStats(npc, map).attack)
    .filter(Number.isFinite);
  if (attacks.length) {
    return Math.max(1, Math.round(attacks.reduce((total, value) => total + value, 0) / attacks.length));
  }
  return Math.max(1, Math.round(Number(map?.enemyDamage ?? map?.danoInimigo ?? (Number(map?.index || 1) * 5 + 6))));
}

function canRaidDogTrigger(mode) {
  return mode === "seeking" || mode === "approaching" || mode === "collectingLoot";
}

function startRaidDogAttack(dog, playerX) {
  dog.state = "attacking";
  dog.attackTimer = RAID_DOG_ATTACK_SECONDS;
  dog.hitTimer = RAID_DOG_HIT_AT_SECONDS;
  dog.hitApplied = false;
  dog.direction = dog.x >= playerX ? "left" : "right";
}

function startRaidDogFlee(dog, playerX) {
  dog.state = "fleeing";
  dog.fleeDirection = dog.x >= playerX ? "right" : "left";
  dog.direction = dog.fleeDirection;
}

function randomAlertLine() {
  return NPC_ALERT_LINES[Math.floor(Math.random() * NPC_ALERT_LINES.length)] || "O que pensa que esta fazendo?";
}

function randomItemTheftLine() {
  return ITEM_THEFT_LINES[Math.floor(Math.random() * ITEM_THEFT_LINES.length)] || ITEM_THEFT_LINES[0];
}

function randomPoliceWarning() {
  return POLICE_WARNINGS[Math.floor(Math.random() * POLICE_WARNINGS.length)] || POLICE_WARNINGS[0];
}

function rarityLootColor(rarity) {
  return {
    comum: "#c8c8c8",
    incomum: "#55d66b",
    raro: "#52a8ff",
    epico: "#c777ff",
    lendario: "#ffd45f",
    mestre: "#f8f5c4"
  }[rarity] || "#fff0bd";
}

function createRaidStartSnapshot(player) {
  const equipped = Object.values(player.equipment || {}).filter(Boolean);
  const inventory = player.inventory || [];
  return {
    money: player.money || 0,
    level: player.level || 1,
    xp: player.xp || 0,
    nextXp: player.nextXp || 100,
    inventory: structuredClone(inventory),
    equipment: structuredClone(player.equipment || {}),
    itemUids: [...inventory, ...equipped].filter((item) => item?.uid).map((item) => item.uid)
  };
}

function calculateStealChanceForMap(map, stats) {
  const risk = Number(map?.riscoFurtoMapa ?? map?.stealRisk ?? 0);
  const gloveBonus = Number(stats?.stealBonus || 0);
  const carBonus = Number(stats?.carStealBonus || 0);
  const baseSuccess = Math.min(
    theftConfig.maxChance,
    Math.max(theftConfig.minChance, theftConfig.baseChance - risk + gloveBonus + carBonus)
  );
  const caughtChance = 100 - baseSuccess;
  const percent = Math.min(
    theftConfig.maxChance,
    Math.max(theftConfig.minChance, 100 - caughtChance * Number(theftConfig.caughtChanceMultiplier || 1))
  );
  return percent / 100;
}

function clampWorldX(value) {
  const number = Math.round(Number(value || 120));
  return Math.max(64, Math.min(SPRITES.background.width - 64, number));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function cloneIdleNpcs(npcs = []) {
  return (npcs || []).map((npc) => ({ ...npc }));
}

function setNpcDirection(npc, direction) {
  if (!npc || npc.fixedFrame) return;
  npc.direction = direction;
}

function petHiddenInScene(state) {
  return state?.scene === "idle" && state?.currentMapId === "prisao";
}
