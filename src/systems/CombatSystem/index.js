import { MAPS } from "../../data/maps/index.js";
import { SPRITES } from "../../data/assets.js";
import { NPC_ALERT_LINES } from "../../data/enemies/index.js";
import { calculateStats } from "../EquipmentSystem/index.js";
import { createNpcWave, createEnemyStats } from "../EnemySystem/index.js";
import { rollLoot, applyLoot } from "../LootSystem/index.js";
import { gainXp, addLog } from "../PlayerSystem/index.js";
import { canStartRaid, consumeStaminaForMap } from "../StaminaSystem/index.js";
import { staminaConfig, theftConfig } from "../../data/balance/index.js?v=balance-2";

const CHOICE_AUTO_FIGHT_SECONDS = 5;
const ITEM_THEFT_CHAT_SECONDS = 5.5;
const POLICE_RISK_STARTS_AFTER_FIGHTS = 2;

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
  }

  setHooks(hooks) {
    this.hooks = hooks;
  }

  enterCity() {
    this.state.scene = "city";
    this.state.currentMapId = null;
    this.state.run = {
      mode: "city",
      playerX: 120,
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
      pendingCityPortalId: null,
      pendingHideoutPortalId: null,
      damageNumbers: [],
      itemTheftChats: [],
      summary: null,
      summaryTimer: 0
    };
    this.syncHpToStats();
    addLog(this.state, "Voce voltou para a cidade.");
    this.emit();
  }

  enterHideout(tier = this.state.player.terrenoAtual || this.state.player.hideoutTier || 1) {
    this.state.scene = "hideout";
    this.state.currentMapId = null;
    this.state.player.hideoutTier = tier;
    this.state.run = {
      mode: "hideout",
      playerX: 120,
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
      pendingCityPortalId: null,
      pendingHideoutPortalId: null,
      damageNumbers: [],
      itemTheftChats: [],
      summary: null,
      summaryTimer: 0
    };
    this.syncHpToStats();
    addLog(this.state, "Voce entrou no esconderijo.");
    this.emit();
  }

  enterMap(mapId) {
    const map = MAPS.find((candidate) => candidate.id === mapId);
    if (!map) return;
    const highestUnlocked = this.state.player.highestMapUnlocked || 1;
    if (!this.state.settings?.visualPreview && !canStartRaid(this.state.player)) {
      addLog(this.state, staminaConfig.emptyMessage);
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
    this.state.scene = "map";
    this.state.currentMapId = map.id;
    const npcs = createNpcWave(map);
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
      pendingHideoutPortalId: null,
      damageNumbers: [],
      itemTheftChats: [],
      policeTimer: 0,
      policeMessage: null,
      policeScene: null,
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
    this.updateDamageNumbers(dt);
    this.updateItemTheftChats(dt);
    if (run.mode === "police") {
      this.updatePoliceConfiscation(dt);
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
    if (run.mode === "returning") return;
    if (this.state.scene !== "map") return;

    const map = this.currentMap();
    if (!map) return;

    run.raidTimeLeft = Math.max(0, (run.raidTimeLeft ?? 0) - dt);
    if (run.raidTimeLeft <= 0) {
      this.finishMap("time");
      return;
    }

    for (const npc of run.npcs) {
      if (npc.done || npc.alerted) continue;
      npc.walkPhase += dt;
      npc.x += Math.sin(npc.walkPhase * 0.75) * dt * 6;
      npc.direction = Math.sin(npc.walkPhase * 0.75) > 0.35 ? "right" : "back";
    }

    if (run.mode === "seeking") {
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
        target.direction = "back";
        addLog(this.state, `Tentando roubar ${target.name}...`);
      }
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

    if (!this.nextTarget() && run.mode !== "combat") {
      this.finishMap("clear");
    }
  }

  chooseFlee() {
    const target = this.targetNpc();
    if (target) {
      target.done = true;
      target.alerted = false;
      target.direction = "right";
    }
    this.state.run.mode = "seeking";
    this.state.run.choiceTimer = 0;
    this.state.run.targetId = null;
    this.state.run.playerX = Math.max(70, this.state.run.playerX - 70);
    this.state.run.playerDirection = "left";
    addLog(this.state, "Voce fugiu e procurou outro alvo.");
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
    target.direction = "left";
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
      target.direction = "left";
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
    const itemAdded = applyLoot(this.state, reward);
    const levels = gainXp(this.state.player, reward.xp);
    this.syncHpToStats();
    this.addRewardToSummary(reward, itemAdded, levels, wonFight);

    const pieces = [`+R$ ${reward.money}`, `+${reward.xp} XP`];
    if (reward.item && itemAdded) pieces.push(`loot: ${reward.item.name}`);
    if (reward.item && !itemAdded) pieces.push(`${reward.item.name} perdido: inventario cheio`);
    if (levels) pieces.push(`subiu ${levels} nivel`);

    addLog(this.state, pieces.join(" | "));
    this.hooks.onToast?.(pieces.join(" | "));
    return {
      reward,
      itemAdded,
      itemStolen: Boolean(reward.item && itemAdded)
    };
  }

  finishTargetAfterSteal(target) {
    if (target) {
      target.done = true;
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
      direction: "left",
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
      addLog(this.state, "Voce caiu na briga e voltou para o esconderijo.");
      this.hooks.onToast?.("Briga perdida. Repouse perto da casa no esconderijo.");
      this.enterHideout();
    }
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
    if (map) {
      const staminaSpent = consumeStaminaForMap(this.state.player, map);
      addLog(this.state, `Stamina consumida: -${staminaSpent}.`);
    }
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

    if (this.state.settings?.autoRepeatRaid) {
      if (!canStartRaid(this.state.player)) {
        this.state.settings.autoRepeatRaid = false;
        addLog(this.state, staminaConfig.emptyMessage);
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
    const battlesStarted = this.state.run.battlesStarted || 0;
    if (battlesStarted < POLICE_RISK_STARTS_AFTER_FIGHTS) return false;
    const chance = Math.min(1, (battlesStarted - POLICE_RISK_STARTS_AFTER_FIGHTS + 1) * 0.1);
    return Math.random() < chance;
  }

  triggerPoliceConfiscation() {
    const run = this.state.run;
    const message = randomPoliceWarning();
    const target = this.targetNpc();
    if (target) {
      target.alerted = false;
      target.direction = "left";
    }

    const confiscated = this.confiscateRaidLoot();
    const playerX = run.playerX || 120;
    run.mode = "police";
    run.targetId = null;
    run.enemy = null;
    run.enemyHp = 0;
    run.enemyMaxHp = 0;
    run.policeTimer = 3.1;
    run.policeMessage = message;
    run.policeScene = {
      officers: [
        { x: playerX - 62, direction: "right" },
        { x: playerX + 62, direction: "left" }
      ]
    };
    addLog(this.state, `Policia no local: ${message}`);
    addLog(this.state, `Loot confiscado: R$ ${confiscated.money}, ${confiscated.items} item(ns), ${confiscated.xp} XP.`);
    this.hooks.onPolice?.(message);
  }

  confiscateRaidLoot() {
    const run = this.state.run;
    const player = this.state.player;
    const summary = run.summary || createRaidSummary(this.currentMap(), run.npcs?.length || 0);
    run.summary = summary;
    const confiscated = {
      money: summary.money || 0,
      xp: summary.xp || 0,
      items: summary.items?.length || 0
    };

    const snapshot = run.raidStartSnapshot;
    if (snapshot) {
      player.money = snapshot.money;
      player.level = snapshot.level;
      player.xp = snapshot.xp;
      player.nextXp = snapshot.nextXp;
      const safeUids = new Set(snapshot.itemUids || []);
      player.inventory = (player.inventory || []).map((item) => item && safeUids.has(item.uid) ? item : null);
      Object.keys(player.equipment || {}).forEach((slot) => {
        const item = player.equipment[slot];
        if (item && !safeUids.has(item.uid)) player.equipment[slot] = null;
      });
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
    this.enterCity();
    addLog(this.state, message);
    this.hooks.onToast?.(message);
    this.emit();
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

function randomAlertLine() {
  return NPC_ALERT_LINES[Math.floor(Math.random() * NPC_ALERT_LINES.length)] || "O que pensa que esta fazendo?";
}

function randomItemTheftLine() {
  return ITEM_THEFT_LINES[Math.floor(Math.random() * ITEM_THEFT_LINES.length)] || ITEM_THEFT_LINES[0];
}

function randomPoliceWarning() {
  return POLICE_WARNINGS[Math.floor(Math.random() * POLICE_WARNINGS.length)] || POLICE_WARNINGS[0];
}

function createRaidStartSnapshot(player) {
  const equipped = Object.values(player.equipment || {}).filter(Boolean);
  const inventory = player.inventory || [];
  return {
    money: player.money || 0,
    level: player.level || 1,
    xp: player.xp || 0,
    nextXp: player.nextXp || 100,
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
