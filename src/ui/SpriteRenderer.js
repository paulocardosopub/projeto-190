import { ASSETS, SPRITES } from "../data/assets.js?v=petshop-portal-1";
import { CITY, HIDEOUTS, IDLE_MAPS, MAPS } from "../data/maps/index.js?v=shop-sync-2";
import { DEFAULT_PLAYER_ID, PLAYERS, PLAYER_POSES, getPlayerById } from "../data/players/index.js?v=players-16";
import { CITY_NPCS } from "../data/cityNpcs/index.js?v=zeca-actions-1";
import { CITY_DECORATIVE_NPCS } from "../data/decorativeNpcs/index.js?v=idle-npcs-1";
import { CITY_PORTALS, HIDEOUT_PORTALS, IDLE_PORTALS } from "../data/cityPortals/index.js?v=petshop-portal-1";
import { HIDEOUT_ITEM_TYPES, hideoutItemHeight, hideoutItemPlacementDefault } from "../data/hideoutItems/index.js?v=hideout-items-8";
import { PETS, PET_FRAME_BOUNDS, getEquippedPet, getPetById } from "../data/pets/index.js?v=shop-sync-2";

const CANONICAL_CANVAS_HEIGHT = 300;
const RARE_WEAPON_EFFECT_POSITION = { x: -0.125, y: 0.315, size: 1 };
const RARE_WEAPON_PLUS_ALPHA = 0.5;
const RARE_WEAPON_PULSE_SPEED = 5.6;
const MOTORCYCLE_SPRITE_VERSION = "motorcycle-sprites-5";
const MOTORCYCLE_HEIGHT_RATIO_BY_LEVEL = {
  1: 1.42,
  2: 1.48,
  3: 1.54,
  4: 1.6,
  5: 1.66
};
const PLAYER_MOTORCYCLE_SHEETS = {
  menino_gordinho_brasil: "01_menino_moto_sprites_transparente.png",
  menina_loira_flamengo: "02_menina_loira_moto_sprites_transparente.png",
  homem_forte_preto_branco: "03_homem_forte_pb_moto_sprites_transparente.png",
  homem_magro_verde_branco: "04_homem_magro_verde_moto_sprites_transparente.png",
  mulher_ruiva_brasil: "05_mulher_ruiva_moto_sprites_transparente.png",
  mulher_gordinha_time_azul: "06_mulher_gordinha_azul_moto_sprites_transparente.png",
  homem_velho_camisa_branca: "07_homem_velho_moto_sprites_transparente.png",
  mulher_morena_camisa_aleatoria: "08_mulher_morena_roxo_moto_sprites_transparente.png",
  homem_moreno_forte_camisa_aleatoria: "09_homem_moreno_roxo_moto_sprites_transparente.png",
  mendigo_blusa_rasgada_time: "10_mendigo_moto_sprites_transparente.png"
};

export class SpriteRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.images = {};
    this.actorBounds = {};
    this.hideoutItemBounds = {};
    this.lastHideoutItemBounds = [];
    this.lastOnlinePlayerBounds = [];
    this.playerAnimations = {};
    this.playerMotorcycleAnimations = {};
    this.playerAnimationState = {};
    this.petFrames = [];
    this.petAnimationState = {};
    this.ctx.imageSmoothingEnabled = false;
  }

  async load() {
    const entries = Object.entries(ASSETS);
    const loaded = await Promise.all(entries.map(async ([key, src]) => [key, await loadImage(src)]));
    this.images = Object.fromEntries(loaded);
    this.actorBounds.enemies = buildActorBounds(this.images.enemies, actorSheet("enemies"));
    this.actorBounds.enemies2 = buildActorBounds(this.images.enemies2, actorSheet("enemies2"));
    this.actorBounds.enemies3 = buildActorBounds(this.images.enemies3, actorSheet("enemies3"));
    this.playerAnimations = await loadPlayerAnimations();
    this.playerMotorcycleAnimations = await loadPlayerMotorcycleAnimations();
    this.petFrames = buildPetFrames(this.images.pets);
    HIDEOUT_ITEM_TYPES.forEach((item) => {
      const config = SPRITES.hideoutItems[item.id];
      this.hideoutItemBounds[item.id] = buildGridBounds(this.images[config.sheet], config);
    });
  }

  draw(state, playerRow) {
    this.syncCanvasSize();
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    const map = currentSceneMap(state);
    const visual = scaleVisualForCanvas(getVisualSettings(state), height);
    const cameraWorld = this.cameraWorld(state, visual);

    this.drawBackground(map?.backgroundSheet || "backgrounds", map?.backgroundRow || 0, cameraWorld);
    this.drawGroundShade();
    this.drawHideoutItems(state, cameraWorld);
    this.drawHideoutPortals(state, cameraWorld, visual);
    this.drawIdlePortals(state, cameraWorld, visual);
    this.drawCityPortals(state, cameraWorld, visual);

    const npcs = state.run.npcTest
      ? state.run.npcs || []
      : state.scene === "city"
        ? CITY_NPCS
        : state.run.npcs || [];

    this.drawDecorativeNpcs(state, cameraWorld, visual);

    for (const npc of npcs) {
      if (npc.hidden) continue;
      if (npc.done && !npc.robbed) continue;
      const screenX = this.worldToScreen(npc.x, cameraWorld);
      if (screenX < -110 || screenX > width + 110) continue;
      const npcFeetY = visual.groundY + visual.npcYOffset;
      this.drawActor(
        npc.sheet || "enemies",
        npc.row,
        npc.direction,
        screenX,
        npcFeetY,
        visual.npcHeight * Number(npc.heightScale || 1),
        npc.alerted ? 1.05 : 1,
        { columnOffset: Number(npc.columnOffset || 0) }
      );
      if (npc.alerted) this.drawSpeech(screenX, npcFeetY - visual.npcHeight - 18, npc.alertLine);
      if (npc.role === "player_shop") this.drawNameplate(screenX, npcFeetY - visual.npcHeight - 8, npc.shopName || npc.name);
    }
    this.drawRaidDogs(state, cameraWorld, visual);
    this.drawAmbientPets(state, cameraWorld, visual);
    this.drawItemTheftChats(state, cameraWorld, visual);
    this.drawGroundLoots(state, cameraWorld, visual);
    this.drawOnlinePlayers(state, cameraWorld, visual);

    const playerScreenX = this.worldToScreen(state.run.playerX || 120, cameraWorld);
    const playerFeetY = visual.groundY + visual.playerYOffset;
    const motorcycleLevel = activeMotorcycleLevel(state);
    const motorcycleAnimation = motorcycleLevel ? this.playerMotorcycleAnimationFor(state.selectedPlayerId || state.player?.characterId) : null;
    const drewMotorcycle = Boolean(motorcycleLevel && motorcycleAnimation);
    if (!drewMotorcycle) this.drawPlayerPet(state, cameraWorld, visual, playerScreenX, playerFeetY);
    if (drewMotorcycle) {
      this.drawMotorcyclePlayer(motorcycleAnimation, state, playerScreenX, playerFeetY, visual.playerHeight, motorcycleLevel);
    } else {
      const playerAnimation = this.playerAnimationFor(state.selectedPlayerId || state.player?.characterId);
      if (playerAnimation) {
        this.drawAnimatedPlayer(playerAnimation, state, playerScreenX, playerFeetY, visual.playerHeight, 1);
      }
    }
    if (drewMotorcycle) this.drawPlayerPet(state, cameraWorld, visual, playerScreenX, playerFeetY);
    if (!drewMotorcycle) this.drawWeaponHandEffect(state, playerScreenX, playerFeetY, visual.playerHeight);

    if (state.run.mode === "stealing") {
      this.drawProgressBubble(playerScreenX + 34, Math.max(40, playerFeetY - visual.playerHeight - 44), Math.max(0, 1 - state.run.timer / 1.05));
    }

    if (state.run.mode === "police") {
      this.drawPoliceScene(state, cameraWorld, visual);
    }

    if (state.run.mode === "combat") {
      this.drawCombatFlash();
      this.drawEnemyHp(state.run.enemyHp, state.run.enemyMaxHp);
    }

    this.drawDamageNumbers(state, cameraWorld, visual);
  }

  syncCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(this.canvas.clientWidth || rect.width || this.canvas.width));
    const height = Math.max(1, Math.round(this.canvas.clientHeight || rect.height || this.canvas.height));
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
  }

  drawBackground(sheetKey, row, cameraWorld = 0) {
    const source = backgroundSheet(sheetKey);
    const image = this.images[sheetKey] || this.images.backgrounds;
    const sourceHeight = source.height;
    const sourceY = row * source.height;
    const viewportWidth = this.canvas.width;
    const viewportHeight = this.canvas.height;
    const startX = positiveModulo(Math.round(cameraWorld), source.width);
    const firstWidth = Math.min(viewportWidth, source.width - startX);

    this.ctx.drawImage(
      image,
      startX,
      sourceY,
      firstWidth,
      sourceHeight,
      0,
      0,
      firstWidth,
      viewportHeight
    );

    if (firstWidth < viewportWidth) {
      const remaining = viewportWidth - firstWidth;
      this.ctx.drawImage(
        image,
        0,
        sourceY,
        remaining,
        sourceHeight,
        firstWidth,
        0,
        remaining,
        viewportHeight
      );
    }
  }

  drawGroundShade() {
    const ctx = this.ctx;
    const h = this.canvas.height;
    const gradient = ctx.createLinearGradient(0, h * 0.66, 0, h);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.58)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, h * 0.62, this.canvas.width, h * 0.38);
  }

  drawAnimatedPlayer(animation, state, x, feetY, height, pulse = 1) {
    const action = playerAction(state);
    const animationState = this.animationStateFor(state.selectedPlayerId || "player", action);
    const frames = animation.actions[action] || animation.actions.walk;
    const frame = frames[playerFrameIndex(action, frames.length, state, animationState)] || frames[0];
    if (!frame) return;

    const actionReferenceHeight = animation.actionReferenceHeights?.[action] || animation.referenceHeight;
    const scaleBasis = frame.referenceHeight || (action === "idle" || action === "walk"
      ? frame.bodyHeight
      : action === "steal"
        ? frame.referenceHeight || frame.bodyHeight
        : actionReferenceHeight);
    const scale = (height * pulse) / scaleBasis;
    const drawWidth = frame.width * scale;
    const drawHeight = frame.height * scale;
    const mirrored = state.run.playerDirection === "left";
    const drawX = Math.round(x - (mirrored ? frame.width - frame.anchorX : frame.anchorX) * scale);
    const drawY = Math.round(feetY - frame.anchorY * scale);
    const sourceImage = frame.image || animation.image;

    this.drawContactShadow(x, feetY, Math.max(18, frame.footWidth * scale * 0.72));

    if (mirrored) {
      this.ctx.save();
      this.ctx.translate(drawX + drawWidth, drawY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(sourceImage, frame.x, frame.y, frame.width, frame.height, 0, 0, drawWidth, drawHeight);
      this.ctx.restore();
    } else {
      this.ctx.drawImage(
        sourceImage,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
    }
  }

  drawMotorcyclePlayer(animation, state, x, feetY, playerHeight, level) {
    const action = motorcyclePlayerAction(state);
    const frameSet = animation[level] || animation[1];
    const frame = frameSet?.[action] || frameSet?.move;
    if (!frame) return;

    const visualCalibration = motorcycleVisualCalibration(state, level);
    const targetHeight = playerHeight * (MOTORCYCLE_HEIGHT_RATIO_BY_LEVEL[level] || MOTORCYCLE_HEIGHT_RATIO_BY_LEVEL[1]) * visualCalibration.scale;
    const scale = targetHeight / Math.max(1, frame.referenceHeight || frame.bodyHeight || frame.height);
    const drawWidth = frame.width * scale;
    const drawHeight = frame.height * scale;
    const mirrored = state.run.playerDirection === "left";
    const time = performance.now() / 1000;
    const engineShakeX = Math.sin(time * 14.5 + level) * 0.42 + Math.sin(time * 23.2) * 0.18;
    const engineShakeY = Math.sin(time * 18.5 + level * 0.4) * 0.24;
    const calibratedFeetY = feetY + visualCalibration.y;
    const drawX = Math.round(x - (mirrored ? frame.width - frame.anchorX : frame.anchorX) * scale + engineShakeX);
    const drawY = Math.round(calibratedFeetY - frame.anchorY * scale + engineShakeY);

    this.drawContactShadow(x, calibratedFeetY, Math.max(36, frame.footWidth * scale * 0.74));
    this.drawMotorcycleExhaustSmoke(drawX, drawY, drawWidth, drawHeight, mirrored, level, time);
    if (mirrored) {
      this.ctx.save();
      this.ctx.translate(drawX + drawWidth, drawY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(frame.image, frame.x, frame.y, frame.width, frame.height, 0, 0, drawWidth, drawHeight);
      this.ctx.restore();
      return;
    }

    this.ctx.drawImage(
      frame.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  drawMotorcycleExhaustSmoke(drawX, drawY, width, height, mirrored, level, time) {
    const ctx = this.ctx;
    const driftDirection = mirrored ? 1 : -1;
    const exhaustX = drawX + width * (mirrored ? 0.82 : 0.18);
    const exhaustY = drawY + height * (level === 2 ? 0.68 : 0.72);

    ctx.save();
    for (let index = 0; index < 6; index += 1) {
      const phase = (time * 0.72 + index * 0.18) % 1;
      const wave = Math.sin(time * 2.2 + index * 1.75);
      const x = exhaustX + driftDirection * (phase * 34 + wave * 2.4);
      const y = exhaustY - phase * 15 + Math.cos(time * 1.8 + index) * 1.6;
      const radius = (2.5 + phase * 6.8 + (index % 2) * 1.1) * Math.max(0.78, height / 168);
      ctx.globalAlpha = 0.15 * (1 - phase);
      ctx.fillStyle = index % 2 ? "#b7b7b2" : "#83837f";
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.5, radius * 0.72, -0.22 + wave * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  playerAnimationFor(playerId) {
    const id = getPlayerById(playerId).id;
    return this.playerAnimations[id] || this.playerAnimations[DEFAULT_PLAYER_ID];
  }

  playerMotorcycleAnimationFor(playerId) {
    const id = getPlayerById(playerId).id;
    return this.playerMotorcycleAnimations[id] || this.playerMotorcycleAnimations[DEFAULT_PLAYER_ID];
  }

  drawPlayerPet(state, cameraWorld, visual, fallbackPlayerX, playerFeetY) {
    const pet = getEquippedPet(state.player);
    if (!pet || petHiddenInScene(state)) return;
    const petState = state.run?.pet || {};
    const rowFrames = this.petFrames[pet.row] || [];
    if (!rowFrames.length) return;

    const action = petAction(state);
    const frameIndexes = SPRITES.petFrames.actions[action] || SPRITES.petFrames.actions.walk;
    const animationState = this.petAnimationStateFor(pet.id, action);
    const frameIndex = petFrameIndex(action, frameIndexes.length, state, animationState);
    const frame = rowFrames[frameIndexes[frameIndex] ?? 0] || rowFrames[0];
    if (!frame) return;

    const petWorldX = Number.isFinite(petState.x)
      ? petState.x
      : (state.run?.playerX || 120) + (state.run?.playerDirection === "left" ? 36 : -36);
    const x = this.worldToScreen(petWorldX, cameraWorld);
    if (x < -120 || x > this.canvas.width + 120) return;

    const direction = petState.direction || state.run?.playerDirection || state.player?.lastPetFollowDirection || "right";
    const mirrored = direction === "left";
    const height = visual.playerHeight * Number(pet.heightRatio || 0.55);
    const scale = height / Math.max(1, frame.referenceHeight || frame.bodyHeight || frame.height);
    const drawWidth = frame.width * scale;
    const drawHeight = frame.height * scale;
    const drawX = Math.round(x - (mirrored ? frame.width - frame.anchorX : frame.anchorX) * scale);
    const drawY = Math.round(playerFeetY + 2 - frame.anchorY * scale);

    this.drawContactShadow(x, playerFeetY + 2, Math.max(18, frame.footWidth * scale * 0.82));
    if (mirrored) {
      this.ctx.save();
      this.ctx.translate(drawX + drawWidth, drawY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.images.pets, frame.x, frame.y, frame.width, frame.height, 0, 0, drawWidth, drawHeight);
      this.ctx.restore();
      return;
    }

    this.ctx.drawImage(
      this.images.pets,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  drawAmbientPets(state, cameraWorld, visual) {
    const pets = ambientPetsForState(state);
    if (!pets.length) return;

    const time = performance.now() / 1000;
    const feetY = visual.groundY + visual.playerYOffset + 2;
    pets.forEach(({ pet, baseX, range, phase }, index) => {
      const speed = 0.45 + (index % 4) * 0.08;
      const wave = Math.sin(time * speed + phase);
      const drift = Math.cos(time * speed + phase);
      const worldX = baseX + wave * range;
      const x = this.worldToScreen(worldX, cameraWorld);
      if (x < -120 || x > this.canvas.width + 120) return;
      const direction = drift >= 0 ? "right" : "left";
      const height = visual.playerHeight * Number(pet.heightRatio || 0.55) * 0.96;
      this.drawPetSprite(pet, "walk", `ambient-${state.scene}-${state.currentMapId || "hideout"}-${pet.id}-${index}`, x, feetY, height, direction);
    });
  }

  drawRaidDogs(state, cameraWorld, visual) {
    if (state.scene !== "map" || !Array.isArray(state.run?.raidDogs) || !state.run.raidDogs.length) return;

    const feetY = visual.groundY + visual.playerYOffset + 3;
    state.run.raidDogs.forEach((dog, index) => {
      if (!dog || dog.done) return;
      const pet = getPetById(dog.petId) || getPetById("boxer");
      if (!pet) return;
      const x = this.worldToScreen(Number(dog.x || 0), cameraWorld);
      if (x < -130 || x > this.canvas.width + 130) return;
      const action = dog.state === "attacking" ? "attack" : dog.state === "idle" || dog.state === "hearts" ? "idle" : "walk";
      const height = visual.playerHeight * Number(pet.heightRatio || 0.55) * (dog.state === "attacking" ? 1.05 : 0.98);
      this.drawPetSprite(pet, action, `raid-dog-${dog.id || index}`, x, feetY, height, dog.direction || "right");
      if (dog.state === "hearts") this.drawPetHearts(x, feetY - height * 0.95, Number(dog.heartsTimer || 0));
    });
  }

  drawPetHearts(x, y, timer) {
    const pulse = 1 + Math.sin(performance.now() / 120) * 0.12;
    const lift = (1.25 - Math.max(0, Math.min(1.25, timer))) * 18;
    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0.15, Math.min(1, timer / 0.35));
    [
      [-12, 0, 3.5],
      [0, -8, 4.5],
      [13, -2, 3.8]
    ].forEach(([offsetX, offsetY, radius]) => {
      this.ctx.fillStyle = "#ff6f93";
      this.ctx.beginPath();
      this.ctx.arc(x + offsetX, y + offsetY - lift, radius * pulse, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(x + offsetX + radius * 1.1, y + offsetY - lift, radius * pulse, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(x + offsetX - radius * 0.9, y + offsetY - lift + radius * 0.7);
      this.ctx.lineTo(x + offsetX + radius * 2, y + offsetY - lift + radius * 0.7);
      this.ctx.lineTo(x + offsetX + radius * 0.55, y + offsetY - lift + radius * 2.5);
      this.ctx.closePath();
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  drawPetSprite(pet, action, animationKey, x, feetY, height, direction) {
    const rowFrames = this.petFrames[pet.row] || [];
    if (!rowFrames.length) return;
    const frameIndexes = SPRITES.petFrames.actions[action] || SPRITES.petFrames.actions.walk;
    const animationState = this.petAnimationStateFor(animationKey, action);
    const frameIndex = petLoopFrameIndex(action, frameIndexes.length, animationState);
    const frame = rowFrames[frameIndexes[frameIndex] ?? 0] || rowFrames[0];
    if (!frame) return;

    const mirrored = direction === "left";
    const scale = height / Math.max(1, frame.referenceHeight || frame.bodyHeight || frame.height);
    const drawWidth = frame.width * scale;
    const drawHeight = frame.height * scale;
    const drawX = Math.round(x - (mirrored ? frame.width - frame.anchorX : frame.anchorX) * scale);
    const drawY = Math.round(feetY - frame.anchorY * scale);

    this.drawContactShadow(x, feetY, Math.max(18, frame.footWidth * scale * 0.82));
    if (mirrored) {
      this.ctx.save();
      this.ctx.translate(drawX + drawWidth, drawY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.images.pets, frame.x, frame.y, frame.width, frame.height, 0, 0, drawWidth, drawHeight);
      this.ctx.restore();
      return;
    }

    this.ctx.drawImage(
      this.images.pets,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  drawActor(imageOrSheet, row, direction, x, feetY, height, pulse = 1, options = {}) {
    const sheetName = typeof imageOrSheet === "string" ? imageOrSheet : "enemies";
    const image = typeof imageOrSheet === "string" ? this.images[sheetName] : imageOrSheet;
    const actor = actorSheet(sheetName);
    const directionIndex = (actor.direction[direction] ?? actor.direction.right) + Number(options.columnOffset || 0);
    const trim = this.actorBounds[sheetName]?.[row]?.[directionIndex] || {
      x: 0,
      y: 0,
      width: actor.cellWidth,
      height: actor.cellHeight
    };
    const sourceX = Number.isFinite(trim.sourceX) ? trim.sourceX : directionIndex * actor.cellWidth + trim.x;
    const sourceY = Number.isFinite(trim.sourceY) ? trim.sourceY : row * actor.cellHeight + trim.y;
    const drawHeight = height * pulse;
    const drawWidth = drawHeight * (trim.width / trim.height);
    const drawX = Math.round(x - drawWidth / 2);
    const drawY = Math.round(feetY - drawHeight);

    this.drawContactShadow(x, feetY, drawWidth * 0.42);

    this.ctx.drawImage(
      image,
      sourceX,
      sourceY,
      trim.width,
      trim.height,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  drawOnlinePlayers(state, cameraWorld, visual) {
    const areaId = onlineAreaId(state);
    this.lastOnlinePlayerBounds = [];
    if (!areaId) return;
    const players = Array.isArray(state.onlineCityPlayers) ? state.onlineCityPlayers : [];
    if (!players.length) return;

    const feetY = visual.groundY + visual.playerYOffset;
    players
      .filter((player) => player?.playerId && player.playerId !== state.player?.playerId && (!player.areaId || player.areaId === areaId))
      .sort((a, b) => Number(a.x || 0) - Number(b.x || 0))
      .forEach((player) => {
        const x = this.worldToScreen(Number(player.x || 120), cameraWorld);
        if (x < -110 || x > this.canvas.width + 110) return;
        const playerHeight = visual.playerHeight * 0.98;
        this.lastOnlinePlayerBounds.push({
          player,
          x: x - playerHeight * 0.34,
          y: feetY - playerHeight - 10,
          width: playerHeight * 0.68,
          height: playerHeight + 28,
          centerX: x,
          feetY
        });
        const animation = this.playerAnimationFor(player.characterId);
        const direction = player.direction === "left" ? "left" : "right";
        const fakeState = {
          scene: state.scene,
          currentMapId: state.currentMapId,
          selectedPlayerId: `online-${player.playerId}`,
          player: {
            equipment: {
              weapon: player.weaponRarity ? { rarity: player.weaponRarity } : null
            }
          },
          run: {
            mode: "city",
            playerX: Number(player.x || 120),
            playerDirection: direction,
            cityTargetX: player.isMoving
              ? Number(player.x || 120) + (direction === "left" ? -10 : 10)
              : null
          }
        };

        this.ctx.save();
        this.ctx.globalAlpha = 0.96;
        this.drawOnlinePlayerPet(state, player, x, feetY, visual.playerHeight * 0.98);
        if (animation) {
          this.drawAnimatedPlayer(animation, fakeState, x, feetY, visual.playerHeight * 0.98, 1);
        }
        this.drawWeaponHandEffect(fakeState, x, feetY, visual.playerHeight * 0.98);
        this.drawNameplate(x, feetY - visual.playerHeight - 8, player.playerName || "Jogador");
        this.ctx.restore();
      });
  }

  hitTestOnlinePlayer(screenX, screenY) {
    return [...(this.lastOnlinePlayerBounds || [])]
      .filter((entry) => (
        screenX >= entry.x &&
        screenX <= entry.x + entry.width &&
        screenY >= entry.y &&
        screenY <= entry.y + entry.height
      ))
      .sort((a, b) => (
        Math.hypot(screenX - a.centerX, screenY - a.feetY) -
        Math.hypot(screenX - b.centerX, screenY - b.feetY)
      ))[0]?.player || null;
  }

  drawOnlinePlayerPet(state, player, playerX, feetY, playerHeight) {
    if (petHiddenInScene(state)) return;
    const pet = getPetById(player?.equippedPetId);
    if (!pet) return;
    const direction = player.direction === "left" ? "left" : "right";
    const petX = playerX + (direction === "left" ? 36 : -36);
    const action = player.isMoving ? "walk" : "idle";
    this.drawPetSprite(
      pet,
      action,
      `online-${player.playerId || player.clientId || "player"}-${pet.id}`,
      petX,
      feetY + 2,
      playerHeight * Number(pet.heightRatio || 0.55),
      direction
    );
  }

  drawDecorativeNpcs(state, cameraWorld, visual) {
    const npcs = state.scene === "city"
      ? CITY_DECORATIVE_NPCS
      : state.run?.decorativeNpcs || [];
    if (!npcs.length) return;

    const feetY = visual.groundY + visual.npcYOffset;
    for (const npc of npcs) {
      if (npc.done) continue;
      const screenX = this.worldToScreen(npc.x, cameraWorld);
      if (screenX < -110 || screenX > this.canvas.width + 110) continue;
      this.drawActor(
        npc.sheet || "enemies3",
        npc.row || 0,
        npc.direction || "front",
        screenX,
        feetY,
        visual.npcHeight * Number(npc.heightScale || 0.96),
        1,
        { columnOffset: Number(npc.columnOffset || 0) }
      );
    }
  }

  drawHideoutItems(state, cameraWorld) {
    this.lastHideoutItemBounds = [];
    if (state.scene !== "hideout") return;

    const editor = state.settings?.hideoutEditor || {};
    HIDEOUT_ITEM_TYPES.forEach((item) => {
      const ownedTier = hideoutItemOwnedTier(state, item.id);
      const previewTier = editor.previewTiers?.[item.id];
      const tier = state.settings?.visualPreview ? (previewTier || ownedTier || 1) : ownedTier;
      if (!tier) return;

      const placement = scaleHideoutItemPlacementForCanvas(hideoutItemPlacement(state, item.id, tier), this.canvas.height);
      const selected = state.settings?.visualPreview && editor.selectedType === item.id;
      this.drawHideoutItem(item.id, tier, placement, cameraWorld, selected);
      if (item.id === "house" && state.run?.hideoutRestHint) {
        const screenX = this.worldToScreen(placement.x, cameraWorld);
        this.drawHideoutRestHint(screenX, placement.y + 13, state.run.hideoutRestHint);
      }
    });
  }

  drawHideoutRestHint(x, y, hint) {
    const ctx = this.ctx;
    const text = hint.near ? "Repousando..." : "Aproxime-se para repousar";
    const width = 184;
    const height = 20;
    ctx.save();
    ctx.fillStyle = hint.near ? "rgba(24, 74, 34, 0.9)" : "rgba(87, 28, 20, 0.92)";
    ctx.strokeStyle = hint.near ? "#8dff9d" : "#ffba5d";
    ctx.lineWidth = 1;
    ctx.fillRect(Math.round(x - width / 2), Math.round(y), width, height);
    ctx.strokeRect(Math.round(x - width / 2), Math.round(y), width, height);
    ctx.fillStyle = "#fff0bd";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y + 13);
    ctx.restore();
  }

  drawCityPortals(state, cameraWorld, visual) {
    if (state.scene !== "city") return;

    CITY_PORTALS.forEach((portal) => {
      if (portal.action === "hideout" && !playerHasOwnedLand(state.player)) return;
      const x = this.worldToScreen(portal.x, cameraWorld);
      if (x < -portal.width || x > this.canvas.width + portal.width) return;
      const feetY = visual.groundY + visual.npcYOffset + Number(portal.yOffset || 0);
      if (portal.type === "assailant") {
        this.drawAssailantPortal(portal, x, feetY);
      } else if (portal.type === "smoke" || portal.action === "hideout") {
        this.drawHideoutSmokePortal(portal, x, feetY);
      } else if (portal.type === "door") {
        this.drawHideoutDoor(portal, x, feetY);
      } else {
        this.drawAssaultPortal(portal, x, feetY);
      }
    });
  }

  drawAssailantPortal(portal, x, feetY) {
    const image = this.images.assaultPortal;
    if (!image) {
      this.drawAssaultPortal(portal, x, feetY);
      return;
    }

    const ctx = this.ctx;
    const time = performance.now() / 1000;
    const engineShake = Math.sin(time * 9) * 0.22 + Math.sin(time * 13) * 0.12;
    const smokePulse = (Math.sin(time * 2.6) + 1) / 2;
    const height = Number(portal.height || 94) * (1 + Math.sin(time * 8) * 0.0009);
    const width = height * (image.width / image.height);
    const drawX = Math.round(x - width / 2 + engineShake * 0.35);
    const drawY = Math.round(feetY - height + Math.sin(time * 10) * 0.12);

    ctx.save();
    this.drawContactShadow(x, feetY + 3, width * 0.46);
    this.drawAssailantSmoke(drawX, drawY, width, height, time);

    const glow = ctx.createRadialGradient(x, feetY - height * 0.38, 8, x, feetY - height * 0.38, width * 0.72);
    glow.addColorStop(0, `rgba(255, 204, 84, ${0.11 + smokePulse * 0.025})`);
    glow.addColorStop(0.58, "rgba(187, 50, 38, 0.1)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(drawX - 18, drawY - 12, width + 36, height + 28);

    ctx.drawImage(image, drawX, drawY, width, height);
    ctx.restore();
  }

  drawAssailantSmoke(drawX, drawY, width, height, time) {
    const ctx = this.ctx;
    const exhaustX = drawX + width * 0.88;
    const exhaustY = drawY + height * 0.72;

    ctx.save();
    for (let index = 0; index < 6; index += 1) {
      const phase = (time * 0.62 + index * 0.17) % 1;
      const wave = Math.sin(time * 2.1 + index * 1.9);
      const x = exhaustX + phase * 34 + wave * 2.6;
      const y = exhaustY - phase * 18 + Math.cos(time * 1.8 + index) * 2;
      const radius = 3.5 + phase * 8 + (index % 2) * 1.4;
      ctx.globalAlpha = 0.18 * (1 - phase);
      ctx.fillStyle = index % 2 ? "#b7b7b2" : "#83837f";
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.45, radius * 0.72, -0.24 + wave * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHideoutPortals(state, cameraWorld, visual) {
    if (state.scene !== "hideout") return;

    HIDEOUT_PORTALS.forEach((portal) => {
      const x = this.worldToScreen(portal.x, cameraWorld);
      if (x < -portal.width || x > this.canvas.width + portal.width) return;
      const feetY = visual.groundY + visual.npcYOffset + Number(portal.yOffset || 0);
      if (portal.type === "assailant") {
        this.drawAssailantPortal(portal, x, feetY);
      } else if (portal.type === "smoke") {
        this.drawHideoutSmokePortal(portal, x, feetY);
      } else {
        this.drawAssaultPortal(portal, x, feetY);
      }
    });
  }

  drawIdlePortals(state, cameraWorld, visual) {
    if (state.scene !== "idle") return;

    IDLE_PORTALS
      .filter((portal) => portal.mapId === state.currentMapId)
      .forEach((portal) => {
        const x = this.worldToScreen(portal.x, cameraWorld);
        if (x < -portal.width || x > this.canvas.width + portal.width) return;
        const feetY = visual.groundY + visual.npcYOffset + Number(portal.yOffset || 0);
        if (portal.type === "assailant") {
          this.drawAssailantPortal(portal, x, feetY);
        } else {
          this.drawAssaultPortal(portal, x, feetY);
        }
      });
  }

  drawHideoutSmokePortal(portal, x, feetY) {
    const ctx = this.ctx;
    const time = performance.now() / 1000;
    const width = portal.width;
    const height = portal.height;
    const baseY = feetY - 2;

    ctx.save();
    this.drawContactShadow(x, feetY + 2, width * 1.12);
    ctx.globalCompositeOperation = "source-over";

    const glow = ctx.createRadialGradient(x, baseY - height * 0.22, 6, x, baseY - height * 0.22, width * 1.24);
    glow.addColorStop(0, "rgba(188, 190, 187, 0.15)");
    glow.addColorStop(0.58, "rgba(86, 84, 82, 0.1)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - width * 1.35, baseY - height - 12, width * 2.7, height + 24);

    for (let index = 0; index < 9; index += 1) {
      const phase = (time * (0.22 + index * 0.015) + index * 0.21) % 1;
      const wave = Math.sin(time * 0.92 + index * 1.2);
      const drift = Math.cos(time * 0.7 + index) * width * 0.18;
      const puffX = x + (index - 4) * width * 0.075 + drift + wave * 2;
      const puffY = baseY - phase * height * 0.72 - Math.abs(wave) * 4;
      const radius = (7.5 + (index % 4) * 2.5) * (1.05 + phase * 0.25);
      ctx.globalAlpha = 0.14 * (1 - phase * 0.42);
      ctx.fillStyle = index % 3 === 0 ? "#c9c9c4" : index % 3 === 1 ? "#8b8a86" : "#5e5e60";
      ctx.beginPath();
      ctx.ellipse(puffX, puffY, radius * 1.35, radius * 0.82, wave * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.28 + Math.sin(time * 2.6) * 0.07;
    ctx.strokeStyle = "rgba(215, 211, 198, 0.52)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, baseY - height * 0.18, width * 0.58, height * 0.34, Math.sin(time) * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawHideoutDoor(portal, x, feetY) {
    const ctx = this.ctx;
    const width = portal.width;
    const height = portal.height;
    const leftX = Math.round(x - width / 2);
    const topY = Math.round(feetY - height);
    const time = performance.now() / 1000;
    const pulse = (Math.sin(time * 2.4) + 1) / 2;

    ctx.save();
    this.drawContactShadow(x, feetY + 2, width * 0.9);

    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.fillRect(leftX - 5, topY + 5, width + 10, height - 2);

    const frame = ctx.createLinearGradient(leftX, topY, leftX + width, topY);
    frame.addColorStop(0, "#3a2414");
    frame.addColorStop(0.5, "#9b642b");
    frame.addColorStop(1, "#2a190e");
    ctx.fillStyle = frame;
    ctx.fillRect(leftX, topY, width, height);

    const inner = ctx.createLinearGradient(leftX + 6, topY + 7, leftX + width - 7, topY + height);
    inner.addColorStop(0, "#392114");
    inner.addColorStop(0.55, "#20130c");
    inner.addColorStop(1, "#110b08");
    ctx.fillStyle = inner;
    ctx.fillRect(leftX + 6, topY + 7, width - 12, height - 7);

    ctx.strokeStyle = "#d09744";
    ctx.lineWidth = 2;
    ctx.strokeRect(leftX + 4, topY + 5, width - 8, height - 5);

    ctx.fillStyle = `rgba(255, 205, 92, ${0.55 + pulse * 0.32})`;
    ctx.fillRect(leftX + width - 14, topY + height * 0.48, 4, 4);

    ctx.strokeStyle = `rgba(255, 205, 92, ${0.22 + pulse * 0.2})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(leftX - 2, topY - 2, width + 4, height + 4);
    ctx.restore();
  }

  drawAssaultPortal(portal, x, feetY) {
    const ctx = this.ctx;
    const time = performance.now() / 1000;
    const pulse = (Math.sin(time * 3) + 1) / 2;
    const rotation = time * 1.9;
    const width = portal.width;
    const height = portal.height;
    const topY = feetY - height;
    const leftX = x - width / 2;
    const centerY = topY + height * 0.52;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    this.drawContactShadow(x, feetY + 2, width * 0.78);

    const aura = ctx.createRadialGradient(x, centerY, 8, x, centerY, width * 0.82);
    aura.addColorStop(0, `rgba(98, 218, 255, ${0.4 + pulse * 0.14})`);
    aura.addColorStop(0.52, "rgba(92, 94, 255, 0.22)");
    aura.addColorStop(1, "rgba(20, 8, 46, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(leftX - 24, topY - 16, width + 48, height + 36);

    const body = ctx.createLinearGradient(x, topY, x, feetY);
    body.addColorStop(0, "rgba(36, 18, 92, 0.88)");
    body.addColorStop(0.5, "rgba(54, 38, 157, 0.86)");
    body.addColorStop(1, "rgba(13, 8, 36, 0.92)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(x, centerY, width * 0.36, height * 0.49, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let index = 0; index < 3; index += 1) {
      const offset = index * Math.PI * 0.66;
      ctx.strokeStyle = `rgba(${index === 1 ? "255, 225, 126" : "102, 230, 255"}, ${0.24 + pulse * 0.15})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(x, centerY, width * (0.18 + index * 0.06), height * 0.46, rotation + offset, -Math.PI * 0.72, Math.PI * 0.72);
      ctx.stroke();
    }

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#63d9ff";
    ctx.beginPath();
    ctx.ellipse(x, centerY, width * 0.4, height * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255, 225, 126, ${0.42 + pulse * 0.32})`;
    ctx.beginPath();
    ctx.ellipse(x, centerY, width * 0.47, height * 0.56, rotation * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    for (let index = 0; index < 8; index += 1) {
      const phase = (time * 0.85 + index / 8) % 1;
      const angle = phase * Math.PI * 2 + index * 0.7;
      const particleX = x + Math.cos(angle) * width * (0.42 + 0.06 * Math.sin(time + index));
      const particleY = centerY + Math.sin(angle) * height * 0.5 - phase * 4;
      ctx.fillStyle = index % 2 ? "rgba(255, 225, 126, 0.78)" : "rgba(111, 230, 255, 0.82)";
      ctx.fillRect(Math.round(particleX), Math.round(particleY), 2, 2);
    }

    ctx.restore();
  }

  drawItemTheftChats(state, cameraWorld, visual) {
    const chats = state.run?.itemTheftChats || [];
    if (!chats.length) return;
    const feetY = visual.groundY + visual.npcYOffset;

    chats.forEach((chat) => {
      const x = this.worldToScreen(chat.x, cameraWorld);
      if (x < -110 || x > this.canvas.width + 110) return;
      const progress = Math.min(1, (chat.age || 0) / (chat.duration || 1));
      const alpha = Math.max(0, 1 - Math.max(0, progress - 0.72) / 0.28);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      if (chat.actorHidden !== false) {
        this.drawActor(
          chat.sheet || "enemies",
          chat.row || 0,
          chat.direction || "left",
          x,
          feetY,
          visual.npcHeight * Number(chat.heightScale || 1),
          1.04,
          { columnOffset: Number(chat.columnOffset || 0) }
        );
      }
      this.drawSpeech(x, feetY - visual.npcHeight - 18, chat.line);
      this.ctx.restore();
    });
  }

  drawGroundLoots(state, cameraWorld, visual) {
    const drops = state.run?.groundLoots || [];
    if (!drops.length) return;
    const ctx = this.ctx;
    const feetY = visual.groundY + visual.npcYOffset;
    const time = performance.now() / 1000;

    drops.forEach((drop, index) => {
      const x = this.worldToScreen(drop.x, cameraWorld);
      if (x < -48 || x > this.canvas.width + 48) return;
      const color = drop.color || lootRarityColor(drop.rarity);
      const age = Math.max(0, Number(drop.age || 0));
      const fall = Math.max(0, 1 - age / 0.45);
      const bounce = Math.sin(time * 6 + index) * 2.2;
      const y = feetY - 13 - fall * fall * 34 + bounce;
      const pulse = 0.75 + Math.sin(time * 5.8 + index) * 0.25;
      const radius = 5.4 + pulse * 1.7;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(x, y, 1, x, y, radius * 4.8);
      glow.addColorStop(0, hexToRgba(color, 0.9));
      glow.addColorStop(0.34, hexToRgba(color, 0.36));
      glow.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 4.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.88;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.96;
      ctx.fillStyle = "#fff8d8";
      ctx.beginPath();
      ctx.arc(x - radius * 0.28, y - radius * 0.34, Math.max(1.2, radius * 0.32), 0, Math.PI * 2);
      ctx.fill();

      for (let spark = 0; spark < 4; spark += 1) {
        const phase = time * (1.6 + spark * 0.2) + spark * 1.9 + index;
        const sparkX = x + Math.cos(phase) * radius * (2.2 + spark * 0.18);
        const sparkY = y + Math.sin(phase * 1.15) * radius * 1.7;
        ctx.globalAlpha = 0.4 + Math.sin(phase) * 0.22;
        ctx.fillStyle = spark % 2 ? color : "#fff6bd";
        ctx.fillRect(Math.round(sparkX), Math.round(sparkY), 2, 2);
      }

      ctx.restore();
    });
  }

  drawHideoutItem(typeId, tier, placement, cameraWorld, selected = false) {
    const config = SPRITES.hideoutItems[typeId];
    const image = this.images[config.sheet];
    if (!config || !image) return;

    const safeTier = Math.max(1, Math.min(config.tiers || 9, tier));
    const row = Math.floor((safeTier - 1) / config.cols);
    const col = (safeTier - 1) % config.cols;
    const trim = this.hideoutItemBounds[typeId]?.[row]?.[col] || {
      x: 0,
      y: 0,
      width: config.cellWidth,
      height: config.cellHeight
    };
    const sourceX = col * config.cellWidth + trim.x;
    const sourceY = row * config.cellHeight + trim.y;
    const height = placement.height;
    const width = height * (trim.width / trim.height);
    const screenX = this.worldToScreen(placement.x, cameraWorld);
    const drawX = Math.round(screenX - width / 2);
    const drawY = Math.round(placement.y - height);

    this.ctx.drawImage(
      image,
      sourceX,
      sourceY,
      trim.width,
      trim.height,
      drawX,
      drawY,
      width,
      height
    );

    const bounds = {
      typeId,
      tier: safeTier,
      x: drawX,
      y: drawY,
      width,
      height,
      anchorX: screenX,
      anchorY: placement.y
    };
    this.lastHideoutItemBounds.push(bounds);

    if (selected) {
      this.ctx.save();
      this.ctx.strokeStyle = "#ffd45f";
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 4]);
      this.ctx.strokeRect(Math.round(drawX - 3), Math.round(drawY - 3), Math.round(width + 6), Math.round(height + 6));
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = "#ffd45f";
      this.ctx.fillRect(Math.round(screenX - 3), Math.round(placement.y - 3), 6, 6);
      this.ctx.restore();
    }
  }

  hitTestHideoutItem(screenX, screenY) {
    for (let index = this.lastHideoutItemBounds.length - 1; index >= 0; index -= 1) {
      const bounds = this.lastHideoutItemBounds[index];
      if (
        screenX >= bounds.x &&
        screenX <= bounds.x + bounds.width &&
        screenY >= bounds.y &&
        screenY <= bounds.y + bounds.height
      ) {
        return bounds;
      }
    }
    return null;
  }

  drawSpeech(x, y, text = "O que pensa que esta fazendo?") {
    const ctx = this.ctx;
    const lines = wrapSpeech(text, 28);
    const width = 220;
    const height = 18 + lines.length * 12;
    ctx.fillStyle = "rgba(18, 14, 10, 0.92)";
    ctx.strokeStyle = "#e0ad45";
    ctx.lineWidth = 2;
    ctx.fillRect(x - width / 2, y - height, width, height);
    ctx.strokeRect(x - width / 2, y - height, width, height);
    ctx.fillStyle = "#ffe6a7";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y - height + 13 + index * 12);
    });
  }

  drawContactShadow(x, feetY, width) {
    this.ctx.fillStyle = "rgba(0,0,0,0.2)";
    this.ctx.fillRect(Math.round(x - width / 2), Math.round(feetY - 2), Math.round(width), 2);
  }

  drawNameplate(x, y, text) {
    const ctx = this.ctx;
    const label = String(text || "Jogador").slice(0, 18);
    ctx.save();
    ctx.font = "bold 10px Arial";
    const width = Math.min(118, Math.max(42, ctx.measureText(label).width + 16));
    const left = Math.round(x - width / 2);
    const top = Math.round(y - 16);
    ctx.fillStyle = "rgba(7, 7, 7, 0.78)";
    ctx.strokeStyle = "rgba(241, 213, 138, 0.82)";
    ctx.lineWidth = 1;
    ctx.fillRect(left, top, width, 15);
    ctx.strokeRect(left, top, width, 15);
    ctx.fillStyle = "#fff1b2";
    ctx.textAlign = "center";
    ctx.fillText(label, x, top + 11);
    ctx.restore();
  }

  drawProgressBubble(x, y, progress) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(10, 10, 10, 0.9)";
    ctx.strokeStyle = "#e1a536";
    ctx.lineWidth = 2;
    ctx.fillRect(x - 45, y, 90, 18);
    ctx.strokeRect(x - 45, y, 90, 18);
    ctx.fillStyle = "#c1352a";
    ctx.fillRect(x - 41, y + 4, 82 * progress, 10);
    ctx.fillStyle = "#fff0bd";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ROUBANDO", x, y - 4);
  }

  drawCombatFlash() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(155, 36, 31, 0.08)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawEnemyHp(current, max) {
    if (!max) return;
    const ctx = this.ctx;
    const width = 170;
    const x = this.canvas.width / 2 - width / 2;
    const y = 52;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(x, y, width, 12);
    ctx.strokeStyle = "#5a4531";
    ctx.strokeRect(x, y, width, 12);
    ctx.fillStyle = "#bd2f28";
    ctx.fillRect(x + 1, y + 1, (width - 2) * Math.max(0, current / max), 10);
  }

  drawDamageNumbers(state, cameraWorld, visual) {
    const numbers = state.run?.damageNumbers || [];
    if (!numbers.length) return;
    const ctx = this.ctx;
    const groundY = visual.groundY + visual.playerYOffset;
    const hidePlayerDamage = Boolean(activeMotorcycleLevel(state));
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 17px Arial";
    numbers.forEach((number) => {
      if (hidePlayerDamage && (number.type === "player" || number.type === "blocked")) return;
      const progress = Math.min(1, number.lift || 0);
      const alpha = Math.max(0, 1 - progress);
      const x = this.worldToScreen(number.worldX || 0, cameraWorld);
      const y = groundY - 76 - progress * 32;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.fillStyle = damageNumberColor(number.type);
      const text = String(Math.round(number.value || 0));
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    });
    ctx.restore();
  }

  drawPoliceScene(state, cameraWorld, visual) {
    const ctx = this.ctx;
    const officers = state.run.policeScene?.officers || [];
    const feetY = visual.groundY + visual.npcYOffset;
    const pulse = (Math.sin(performance.now() / 120) + 1) / 2;

    officers.forEach((officer, index) => {
      const x = this.worldToScreen(officer.x, cameraWorld);
      this.drawPoliceLight(x, feetY - visual.npcHeight * 0.74, index === 0 ? "#236cff" : "#ff2f2f", index === 0 ? pulse : 1 - pulse);
    });

    officers.forEach((officer) => {
      const x = this.worldToScreen(officer.x, cameraWorld);
      this.drawActor("enemies2", 3, officer.direction || "front", x, feetY, visual.npcHeight * 1.08, 1.05);
    });

    this.drawPoliceWarning(state.run.policeMessage || "Loot confiscado.");
  }

  drawPoliceLight(x, y, color, pulse) {
    const ctx = this.ctx;
    const radius = 58 + pulse * 28;
    const gradient = ctx.createRadialGradient(x, y, 4, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = 0.18 + pulse * 0.18;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPoliceWarning(text) {
    const ctx = this.ctx;
    const lines = wrapSpeech(text, 42).slice(0, 3);
    const width = Math.min(560, this.canvas.width - 52);
    const height = 20 + lines.length * 14;
    const x = this.canvas.width / 2;
    const y = 34;
    ctx.save();
    ctx.fillStyle = "rgba(8, 8, 10, 0.92)";
    ctx.strokeStyle = "#ffdf80";
    ctx.lineWidth = 2;
    ctx.fillRect(x - width / 2, y, width, height);
    ctx.strokeRect(x - width / 2, y, width, height);
    ctx.fillStyle = "#ffe6a7";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + 16 + index * 14);
    });
    ctx.restore();
  }

  drawWeaponHandEffect(state, playerX, feetY, playerHeight) {
    const weapon = state.player?.equipment?.weapon;
    const config = weaponEffectConfig(weapon?.rarity);
    if (!config) return;
    const action = playerAction(state);
    if (action !== "idle" && action !== "walk") return;

    const ctx = this.ctx;
    const direction = state.run?.playerDirection || "right";
    const side = direction === "left" ? -1 : 1;
    const effectScale = 1.8 * RARE_WEAPON_EFFECT_POSITION.size;
    const glowX = playerX + side * playerHeight * RARE_WEAPON_EFFECT_POSITION.x;
    const glowY = feetY - playerHeight * RARE_WEAPON_EFFECT_POSITION.y;
    const time = performance.now() / 1000;
    const actionBoost = 1;
    const pulseWave = (Math.sin(time * RARE_WEAPON_PULSE_SPEED) + 1) / 2;
    const pulse = 1 + (pulseWave * 2 - 1) * config.pulse;
    const auraRadius = config.auraRadius * effectScale * pulse * (1 + pulseWave * 0.18) * actionBoost;
    const coreRadius = config.coreRadius * effectScale * (0.88 + pulseWave * 0.36) * actionBoost;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = config.color;
    ctx.shadowBlur = config.blur * effectScale * (1.15 + pulseWave * 1.25);

    const aura = ctx.createRadialGradient(glowX, glowY, 1, glowX, glowY, auraRadius);
    aura.addColorStop(0, hexToRgba(config.core, Math.min(0.9, config.alpha + 0.24 + pulseWave * 0.18)));
    aura.addColorStop(0.32, hexToRgba(config.color, Math.min(0.78, config.alpha * (0.78 + pulseWave * 0.38))));
    aura.addColorStop(1, hexToRgba(config.color, 0));
    ctx.fillStyle = aura;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(glowX, glowY, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    if (config.starRadius) {
      ctx.strokeStyle = hexToRgba(config.core, RARE_WEAPON_PLUS_ALPHA);
      ctx.lineWidth = 0.9 * effectScale * (1 + pulseWave * 0.2) * actionBoost;
      const starRadius = config.starRadius * effectScale;
      ctx.beginPath();
      ctx.moveTo(glowX - starRadius, glowY);
      ctx.lineTo(glowX + starRadius, glowY);
      ctx.moveTo(glowX, glowY - starRadius);
      ctx.lineTo(glowX, glowY + starRadius);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = config.core;
    ctx.globalAlpha = Math.min(0.92, config.alpha + 0.34 + pulseWave * 0.16);
    ctx.beginPath();
    ctx.arc(glowX, glowY, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = Math.min(0.68, config.alpha + 0.12 + pulseWave * 0.16);
    ctx.beginPath();
    ctx.arc(glowX - side * coreRadius * 0.22, glowY - coreRadius * 0.18, Math.max(0.8, coreRadius * 0.32), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawActorPreview(canvas, sheetName, row, direction = "front") {
    const ctx = canvas.getContext("2d");
    const image = this.images[sheetName];
    const actor = actorSheet(sheetName);
    if (!image || !actor) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const directionIndex = actor.direction[direction] ?? actor.direction.front;
    const trim = this.actorBounds[sheetName]?.[row]?.[directionIndex] || {
      x: 0,
      y: 0,
      width: actor.cellWidth,
      height: actor.cellHeight
    };
    const drawHeight = canvas.height * 0.95;
    const drawWidth = drawHeight * (trim.width / trim.height);
    ctx.drawImage(
      image,
      Number.isFinite(trim.sourceX) ? trim.sourceX : directionIndex * actor.cellWidth + trim.x,
      Number.isFinite(trim.sourceY) ? trim.sourceY : row * actor.cellHeight + trim.y,
      trim.width,
      trim.height,
      (canvas.width - drawWidth) / 2,
      canvas.height - drawHeight,
      drawWidth,
      drawHeight
    );
  }

  drawPlayerPreview(canvas, playerId, pose = "front") {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const animation = this.playerAnimationFor(playerId);
    const action = pose === "front" ? "front" : pose === "hurt" ? "hurt" : pose === "attack" ? "attack" : "idle";
    const frame = animation?.actions?.[action]?.[0] || animation?.actions?.front?.[0] || animation?.actions?.idle?.[0];
    if (!frame) return;

    const scale = Math.min(
      canvas.width * 0.82 / frame.width,
      canvas.height * 0.84 / Math.max(1, frame.anchorY || frame.referenceHeight || frame.bodyHeight || frame.height)
    );
    const feetX = canvas.width * 0.5;
    const feetY = canvas.height * 0.92;

    ctx.drawImage(
      frame.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      Math.round(feetX - frame.anchorX * scale),
      Math.round(feetY - frame.anchorY * scale),
      frame.width * scale,
      frame.height * scale
    );
  }

  drawPetPreview(canvas, petId) {
    const pet = getPetById(petId);
    const frame = pet ? this.petFrames[pet.row]?.[0] : null;
    const image = this.images.pets;
    if (!canvas || !frame || !image) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    const scale = Math.min(canvas.width * 0.82 / frame.width, canvas.height * 0.82 / (frame.referenceHeight || frame.bodyHeight || frame.height));
    const feetX = canvas.width * 0.5;
    const feetY = canvas.height * 0.9;
    ctx.drawImage(
      image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      Math.round(feetX - frame.anchorX * scale),
      Math.round(feetY - frame.anchorY * scale),
      frame.width * scale,
      frame.height * scale
    );
  }

  drawAnimatedPreview(canvas, animation) {
    const ctx = canvas.getContext("2d");
    const frame = animation.actions.walk[0];
    if (!frame) return;

    const scale = Math.min(canvas.width * 0.82 / frame.width, canvas.height * 0.92 / animation.referenceHeight);
    const feetX = canvas.width * 0.5;
    const feetY = canvas.height * 0.96;
    ctx.drawImage(
      animation.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      Math.round(feetX - frame.anchorX * scale),
      Math.round(feetY - frame.anchorY * scale),
      frame.width * scale,
      frame.height * scale
    );
  }

  drawMapThumb(canvas, mapOrRow, sheetKey = "backgrounds") {
    const ctx = canvas.getContext("2d");
    const map = typeof mapOrRow === "object" ? mapOrRow : null;
    const source = backgroundSheet(map?.backgroundSheet || sheetKey);
    const row = map ? map.backgroundRow : mapOrRow;
    const image = this.images[map?.backgroundSheet || sheetKey] || this.images.backgrounds;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      0,
      row * source.height,
      source.width,
      source.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  worldToScreen(worldX, cameraWorld) {
    return Math.round(worldX - cameraWorld);
  }

  screenToWorld(screenX, state) {
    return Math.round(screenX + this.cameraWorld(state));
  }

  cameraWorld(state, visual = getVisualSettings(state)) {
    return cameraWorldForState(state, visual, this.canvas.width);
  }

  animationStateFor(key, action) {
    const now = performance.now();
    const current = this.playerAnimationState[key];
    if (!current || current.action !== action) {
      this.playerAnimationState[key] = {
        action,
        startedAt: now
      };
    }
    return this.playerAnimationState[key];
  }

  petAnimationStateFor(key, action) {
    const now = performance.now();
    const stateKey = `pet-${key}`;
    const current = this.petAnimationState[stateKey];
    if (!current || current.action !== action) {
      this.petAnimationState[stateKey] = {
        action,
        startedAt: now
      };
    }
    return this.petAnimationState[stateKey];
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function loadPlayerAnimations() {
  const entries = await Promise.all(PLAYERS.map(async (player) => {
    const frames = {};
    await Promise.all(Object.values(PLAYER_POSES).map(async (pose) => {
      frames[pose] = await loadImage(`${player.assetPath}/${pose}.png?v=players-17`);
    }));
    return [player.id, buildPlayerAnimationFromFrames(frames)];
  }));
  return Object.fromEntries(entries);
}

async function loadPlayerMotorcycleAnimations() {
  const entries = await Promise.all(PLAYERS.map(async (player) => {
    const sheetName = PLAYER_MOTORCYCLE_SHEETS[player.id];
    const sheet = await loadImage(`./src/hideout/${sheetName}?v=${MOTORCYCLE_SPRITE_VERSION}`);
    return [player.id, buildMotorcycleAnimationFromSheet(sheet)];
  }));
  return Object.fromEntries(entries);
}

function buildMotorcycleAnimationFromSheet(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
  const cellWidth = Math.floor(image.width / 5);
  const cellHeight = Math.floor(image.height / 2);
  const animation = {};

  for (let level = 1; level <= 5; level += 1) {
    const col = level - 1;
    const sourceX = col * cellWidth;
    const sourceWidth = col === 4 ? image.width - sourceX : cellWidth;
    const move = buildMotorcycleFrame(pixels, image, {
      x: sourceX,
      y: 0,
      width: sourceWidth,
      height: cellHeight
    });
    const attack = buildMotorcycleFrame(pixels, image, {
      x: sourceX,
      y: cellHeight,
      width: sourceWidth,
      height: image.height - cellHeight
    });
    const referenceHeight = median([move?.bodyHeight, attack?.bodyHeight]) || move?.bodyHeight || attack?.bodyHeight || 1;
    if (move) move.referenceHeight = referenceHeight;
    if (attack) attack.referenceHeight = referenceHeight;
    animation[level] = { move, attack };
  }

  return animation;
}

function buildMotorcycleFrame(pixels, image, rect) {
  const sourceX = Math.max(0, rect.x);
  const sourceY = Math.max(0, rect.y);
  const sourceRight = Math.min(image.width - 1, rect.x + rect.width - 1);
  const sourceBottom = Math.min(image.height - 1, rect.y + rect.height - 1);
  let minX = sourceRight;
  let minY = sourceBottom;
  let maxX = sourceX;
  let maxY = sourceY;

  for (let y = sourceY; y <= sourceBottom; y += 1) {
    for (let x = sourceX; x <= sourceRight; x += 1) {
      if (alphaAt(pixels, image.width, x, y) > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return null;

  const padding = 10;
  minX = Math.max(sourceX, minX - padding);
  minY = Math.max(sourceY, minY - padding);
  maxX = Math.min(sourceRight, maxX + padding);
  maxY = Math.min(sourceBottom, maxY + padding);
  const foot = findFootAnchor(pixels, image.width, minX, maxX, minY, maxY);

  return {
    image,
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    anchorX: foot.x - minX,
    anchorY: maxY + 1 - minY,
    bodyHeight: maxY - minY + 1,
    footWidth: foot.width
  };
}

function buildPlayerAnimationFromFrames(frames) {
  const sideIdle = buildStandalonePlayerFrame(frames[PLAYER_POSES.sideIdle]);
  const frontIdle = buildStandalonePlayerFrame(frames[PLAYER_POSES.frontIdle]);
  const walk1 = buildStandalonePlayerFrame(frames[PLAYER_POSES.walk1]);
  const walk2 = buildStandalonePlayerFrame(frames[PLAYER_POSES.walk2]);
  const attack = buildStandalonePlayerFrame(frames[PLAYER_POSES.attack]);
  const hurt = buildStandalonePlayerFrame(frames[PLAYER_POSES.hurt]);
  const referenceHeight = median([sideIdle, frontIdle, walk1, walk2].map((frame) => frame?.bodyHeight)) || sideIdle?.bodyHeight || 1;

  [sideIdle, frontIdle, walk1, walk2, attack, hurt].filter(Boolean).forEach((frame) => {
    frame.referenceHeight = referenceHeight;
  });

  const actions = {
    idle: [sideIdle].filter(Boolean),
    front: [frontIdle].filter(Boolean),
    walk: [walk1, walk2].filter(Boolean),
    attack: [attack].filter(Boolean),
    hurt: [hurt].filter(Boolean),
    steal: [attack].filter(Boolean)
  };

  return {
    actions,
    actionReferenceHeights: {
      idle: referenceHeight,
      front: referenceHeight,
      walk: referenceHeight,
      attack: referenceHeight,
      hurt: referenceHeight,
      steal: referenceHeight
    },
    referenceHeight
  };
}

function buildStandalonePlayerFrame(image) {
  if (!image) return null;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, image.width, image.height).data;

  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (alphaAt(pixels, image.width, x, y) > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return {
      image,
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
      anchorX: image.width / 2,
      anchorY: image.height,
      bodyHeight: image.height,
      footWidth: image.width * 0.34
    };
  }

  const foot = findFootAnchor(pixels, image.width, minX, maxX, minY, maxY);
  return {
    image,
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
    anchorX: foot.x,
    anchorY: maxY + 1,
    bodyHeight: maxY - minY + 1,
    footWidth: foot.width
  };
}

function buildActorBounds(image, actor) {
  if (actor.manualBounds) return actor.manualBounds;

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const bounds = [];

  for (let row = 0; row < actor.rows; row += 1) {
    bounds[row] = [];
    for (let col = 0; col < actor.cols; col += 1) {
      bounds[row][col] = actor.scanPadding
        ? findExpandedVisibleBounds(ctx, image, col * actor.cellWidth, row * actor.cellHeight, actor.cellWidth, actor.cellHeight, actor.scanPadding)
        : findVisibleBounds(ctx, col * actor.cellWidth, row * actor.cellHeight, actor.cellWidth, actor.cellHeight);
    }
  }

  return bounds;
}

function findExpandedVisibleBounds(ctx, image, cellX, cellY, cellWidth, cellHeight, padding) {
  const scanX = Math.max(0, cellX - padding);
  const scanY = Math.max(0, cellY - padding);
  const scanRight = Math.min(image.width, cellX + cellWidth + padding);
  const scanBottom = Math.min(image.height, cellY + cellHeight + padding);
  const scanWidth = Math.max(1, scanRight - scanX);
  const scanHeight = Math.max(1, scanBottom - scanY);
  const bounds = findVisibleBounds(ctx, scanX, scanY, scanWidth, scanHeight);
  return {
    x: scanX + bounds.x - cellX,
    y: scanY + bounds.y - cellY,
    width: bounds.width,
    height: bounds.height
  };
}

function buildGridBounds(image, config) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const bounds = [];

  for (let row = 0; row < config.rows; row += 1) {
    bounds[row] = [];
    for (let col = 0; col < config.cols; col += 1) {
      bounds[row][col] = config.manualBounds?.[row]?.[col] ||
        findVisibleBounds(ctx, col * config.cellWidth, row * config.cellHeight, config.cellWidth, config.cellHeight);
    }
  }

  return bounds;
}

function buildPetFrames(image) {
  if (!image) return [];
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, image.width, image.height).data;

  return PET_FRAME_BOUNDS.map((row) => {
    const frames = row
      .map((rect) => buildExplicitAnimationFrame(pixels, image.width, image.height, rect, "foot"))
      .filter(Boolean);
    const referenceHeight = median(frames.slice(0, 4).map((frame) => frame.bodyHeight)) || median(frames.map((frame) => frame.bodyHeight));
    return frames.map((frame) => ({
      ...frame,
      referenceHeight
    }));
  });
}

function buildExplicitAnimationFrame(pixels, imageWidth, imageHeight, rect, anchorMode = "foot") {
  const sourceX = Math.max(0, rect.x);
  const sourceY = Math.max(0, rect.y);
  const sourceRight = Math.min(imageWidth - 1, rect.x + rect.width - 1);
  const sourceBottom = Math.min(imageHeight - 1, rect.y + rect.height - 1);
  let minX = sourceRight;
  let minY = sourceBottom;
  let maxX = sourceX;
  let maxY = sourceY;

  for (let y = sourceY; y <= sourceBottom; y += 1) {
    for (let x = sourceX; x <= sourceRight; x += 1) {
      if (alphaAt(pixels, imageWidth, x, y) > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return null;

  const foot = findFootAnchor(pixels, imageWidth, minX, maxX, minY, maxY);
  const centerAnchorX = (minX + maxX) / 2 - sourceX;
  const fallbackAnchorX = anchorMode === "center" ? centerAnchorX : foot.x - sourceX;
  return {
    x: sourceX,
    y: sourceY,
    width: sourceRight - sourceX + 1,
    height: sourceBottom - sourceY + 1,
    anchorX: Number.isFinite(rect.anchorX) ? rect.anchorX : fallbackAnchorX,
    anchorY: Number.isFinite(rect.anchorY) ? rect.anchorY : maxY + 1 - sourceY,
    bodyHeight: maxY - minY + 1,
    footWidth: foot.width
  };
}

function findFootAnchor(pixels, imageWidth, minX, maxX, minY, maxY) {
  const height = maxY - minY + 1;
  let bandTop = Math.max(minY, maxY - Math.max(18, Math.round(height * 0.22)));
  let foot = footBounds(pixels, imageWidth, minX, maxX, bandTop, maxY);
  if (!foot) {
    bandTop = Math.max(minY, maxY - Math.max(30, Math.round(height * 0.34)));
    foot = footBounds(pixels, imageWidth, minX, maxX, bandTop, maxY);
  }

  if (!foot) {
    return { x: (minX + maxX) / 2, width: maxX - minX + 1 };
  }

  return {
    x: (foot.minX + foot.maxX) / 2,
    width: foot.maxX - foot.minX + 1
  };
}

function footBounds(pixels, imageWidth, minX, maxX, minY, maxY) {
  let footMinX = maxX;
  let footMaxX = minX;
  let found = false;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (alphaAt(pixels, imageWidth, x, y) > 8) {
        footMinX = Math.min(footMinX, x);
        footMaxX = Math.max(footMaxX, x);
        found = true;
      }
    }
  }
  return found ? { minX: footMinX, maxX: footMaxX } : null;
}

function findVisibleBounds(ctx, cellX, cellY, cellWidth, cellHeight) {
  const pixels = ctx.getImageData(cellX, cellY, cellWidth, cellHeight).data;
  let minX = cellWidth;
  let minY = cellHeight;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < cellWidth; x += 1) {
      const alpha = pixels[(y * cellWidth + x) * 4 + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width: cellWidth, height: cellHeight };
  }

  const margin = 3;
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = Math.min(cellWidth - 1, maxX + margin);
  maxY = Math.min(cellHeight - 1, maxY + margin);

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

function wrapSpeech(text, maxLength) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

function actorSheet(sheetName) {
  return SPRITES.actorSheets?.[sheetName] || SPRITES.actor;
}

function playerHasOwnedLand(player) {
  return Array.isArray(player?.terrenosComprados) && player.terrenosComprados.length > 0;
}

function damageNumberColor(type) {
  if (type === "crit") return "#ffef7a";
  if (type === "player") return "#ff5656";
  if (type === "blocked") return "#ff9a52";
  return "#fff0bd";
}

function lootRarityColor(rarity) {
  return {
    comum: "#c8c8c8",
    incomum: "#55d66b",
    raro: "#52a8ff",
    epico: "#c777ff",
    lendario: "#ffd45f",
    mestre: "#f8f5c4"
  }[rarity] || "#fff0bd";
}

function hexToRgba(hex, alpha) {
  const value = String(hex || "#fff0bd").replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((char) => char + char).join("")
    : value.padEnd(6, "f").slice(0, 6);
  const number = Number.parseInt(normalized, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function weaponEffectConfig(rarity) {
  return {
    raro: {
      color: "#52a8ff",
      core: "#c7e6ff",
      auraRadius: 6.6,
      coreRadius: 1.7,
      blur: 6,
      alpha: 0.5,
      pulse: 0.36,
      starRadius: 5
    },
    epico: {
      color: "#b65cff",
      core: "#f0d2ff",
      auraRadius: 6.8,
      coreRadius: 1.75,
      blur: 7,
      alpha: 0.5,
      pulse: 0.36,
      starRadius: 5
    },
    lendario: {
      color: "#ffd45f",
      core: "#fff0a6",
      auraRadius: 7.1,
      coreRadius: 1.85,
      blur: 8,
      alpha: 0.5,
      pulse: 0.36,
      starRadius: 5
    },
    mestre: {
      color: "#aefcff",
      core: "#f6e4ff",
      auraRadius: 7.3,
      coreRadius: 1.95,
      blur: 9,
      alpha: 0.5,
      pulse: 0.36,
      starRadius: 5
    }
  }[rarity] || null;
}

function currentSceneMap(state) {
  if (state.scene === "map") {
    const map = MAPS.find((candidate) => candidate.id === state.currentMapId) || MAPS[0];
    if (state.run?.afkRaid) {
      return {
        ...map,
        code: "AFK",
        name: "Roubo AFK",
        backgroundSheet: state.run.afkBackgroundSheet || map.backgroundSheet,
        backgroundRow: Number.isFinite(Number(state.run.afkBackgroundRow)) ? Number(state.run.afkBackgroundRow) : map.backgroundRow
      };
    }
    return map;
  }
  if (state.scene === "idle") {
    return IDLE_MAPS.find((candidate) => candidate.id === state.currentMapId) || IDLE_MAPS[0];
  }
  if (state.scene === "hideout") {
    const tier = Math.max(1, Math.min(HIDEOUTS.length, state.player?.hideoutTier || 1));
    return HIDEOUTS[tier - 1] || HIDEOUTS[0];
  }
  return CITY;
}

function hideoutItemOwnedTier(state, typeId) {
  if (typeId === "house") {
    const house = Number(state.player?.casaAtual || 0);
    return house > 0 ? Math.max(1, Math.min(9, Math.floor(house))) : 0;
  }
  if (typeId === "vehicle") {
    const equipped = Number(state.player?.equippedMotorcycleLevel || state.player?.motoAtual || 0);
    if (equipped > 0) return Math.max(1, Math.min(5, Math.floor(equipped)));
  }
  return 0;
}

function backgroundSheet(sheetKey) {
  return SPRITES.backgroundSheets?.[sheetKey] || SPRITES.background;
}

function playerAction(state) {
  const run = state.run || {};
  if (run.mode === "stealing" || run.mode === "afk-stealing") return "steal";
  if (run.mode === "combat" && (run.playerAction === "attack" || run.playerAction === "hurt")) {
    return run.playerAction;
  }
  return isPlayerWalking(state) ? "walk" : "idle";
}

function motorcyclePlayerAction(state) {
  const run = state.run || {};
  return run.mode === "combat" && run.playerAction === "attack" ? "attack" : "move";
}

function petAction(state) {
  const action = state.run?.pet?.action;
  if (action === "attack") return "attack";
  if (action === "returnToPlayer") return "returnToPlayer";
  return isPlayerWalking(state) ? "walk" : "idle";
}

function playerFrameIndex(action, length, state, animationState) {
  if (!length) return 0;
  if (action === "idle") return 0;
  if (action === "attack" || action === "hurt") {
    const duration = state.run.playerActionDuration || 0.4;
    const remaining = state.run.playerActionTimer || 0;
    const progress = clamp((duration - remaining) / duration, 0, 0.999);
    return Math.min(length - 1, Math.floor(progress * length));
  }
  if (action === "steal") {
    const duration = state.run.mode === "afk-stealing" ? 0.85 : 1.05;
    const remaining = state.run.timer ?? duration;
    const progress = clamp((duration - remaining) / duration, 0, 0.999);
    return Math.min(length - 1, Math.floor(progress * length));
  }
  if (!isPlayerWalking(state)) return 0;
  const speed = state.scene === "map" ? 7.5 : 4.5;
  const elapsed = (performance.now() - animationState.startedAt) / 1000;
  return Math.floor(elapsed * speed) % length;
}

function petFrameIndex(action, length, state, animationState) {
  if (!length) return 0;
  if (action === "attack") {
    const duration = state.run?.pet?.actionDuration || 0.46;
    const remaining = state.run?.pet?.actionTimer || 0;
    const progress = clamp((duration - remaining) / duration, 0, 0.999);
    return Math.min(length - 1, Math.floor(progress * length));
  }
  const speed = action === "idle" ? 1.7 : 5.2;
  const elapsed = (performance.now() - animationState.startedAt) / 1000;
  return Math.floor(elapsed * speed) % length;
}

function petLoopFrameIndex(action, length, animationState) {
  if (!length) return 0;
  const speed = action === "idle" ? 1.7 : 4.6;
  const elapsed = (performance.now() - animationState.startedAt) / 1000;
  return Math.floor(elapsed * speed) % length;
}

function ambientPetsForState(state) {
  if (state.scene === "idle" && state.currentMapId === "petshop") {
    return PETS.map((pet, index) => ({
      pet,
      baseX: 320 + index * 135,
      range: 22 + (index % 3) * 8,
      phase: index * 0.9
    }));
  }

  if (state.scene === "hideout") {
    const equippedId = state.player?.equippedPetId || null;
    const owned = Array.isArray(state.player?.petsOwned) ? state.player.petsOwned : [];
    return owned
      .filter((id) => id !== equippedId)
      .map((id) => getPetById(id))
      .filter(Boolean)
      .map((pet, index) => ({
        pet,
        baseX: 360 + index * 118,
        range: 18 + (index % 3) * 7,
        phase: index * 1.1
      }));
  }

  return [];
}

function petHiddenInScene(state) {
  return state.scene === "idle" && state.currentMapId === "prisao";
}

function onlineAreaId(state) {
  if (state?.scene === "city") return "cidade";
  if (state?.scene === "idle" && ["fazenda-laboratorio", "petshop", "prisao", "hospital"].includes(state.currentMapId)) {
    return state.currentMapId;
  }
  return null;
}

function isPlayerWalking(state) {
  const run = state.run || {};
  if (state.scene === "city" || state.scene === "hideout" || state.scene === "idle") {
    return Number.isFinite(run.cityTargetX) && Math.abs(run.cityTargetX - (run.playerX || 0)) > 2;
  }
  return run.mode === "approaching" ||
    run.mode === "seeking" ||
    run.mode === "collectingLoot" ||
    run.mode === "fleeing" ||
    run.mode === "afk-seeking" ||
    run.mode === "afk-approaching";
}

function activeMotorcycleLevel(state) {
  if (state?.run?.afkRaid) return 0;
  if (state?.scene !== "map") return 0;
  const player = state.player || {};
  const level = Number(player.equippedMotorcycleLevel || player.motoAtual || player.carroAtual || 0);
  if (!player.hasMotorcycleEquipped && !level) return 0;
  const owned = Array.isArray(player.ownedMotorcycles) ? player.ownedMotorcycles : player.ownedCars;
  if (Array.isArray(owned) && owned.length && !owned.includes(level)) return 0;
  return Math.max(1, Math.min(5, Math.floor(level)));
}

function motorcycleVisualCalibration(state, level) {
  const playerId = getPlayerById(state.selectedPlayerId || state.player?.characterId || DEFAULT_PLAYER_ID).id;
  const legacyEntry = state.settings?.visual?.motorcycles?.[playerId]?.[String(Math.max(1, Math.min(5, Math.floor(Number(level || 1)))))] || {};
  const entry = state.settings?.visual?.motorcycleMount || legacyEntry;
  const y = Number(entry.y || 0);
  const scale = Number(entry.scale || 1);
  return {
    y: Math.max(-80, Math.min(80, Number.isFinite(y) ? y : 0)),
    scale: Math.max(0.7, Math.min(1.35, Number.isFinite(scale) && scale > 0 ? scale : 1))
  };
}

function alphaAt(pixels, imageWidth, x, y) {
  return pixels[(y * imageWidth + x) * 4 + 3];
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cameraWorldForState(state, visual, viewportWidth) {
  const playerX = state.run?.playerX || 0;
  if (state.run?.afkRaid) {
    return Math.round(Math.max(0, playerX - viewportWidth * 0.5));
  }
  if (state.scene === "city" || state.scene === "idle") {
    return Math.round(clamp(playerX - viewportWidth * 0.5, 0, SPRITES.background.width - viewportWidth));
  }
  return Math.round(Math.max(0, playerX - visual.cameraLead));
}

function getVisualSettings(state) {
  const visual = state.settings?.visual || {};
  const mapKey = state.scene === "map" || state.scene === "idle"
    ? state.currentMapId
    : state.scene === "hideout"
      ? `esconderijo-${state.player?.hideoutTier || 1}`
      : "cidade";
  const mapVisual = visual.maps?.[mapKey] || {};
  const playerVisual = visual.players?.[state.selectedPlayerId] || {};
  return {
    playerHeight: Number(visual.playerHeight || 78),
    npcHeight: Number(visual.npcHeight || 82),
    groundY: Number(mapVisual.groundY ?? visual.groundY ?? 274),
    playerYOffset: Number(playerVisual.y ?? visual.playerYOffset ?? 0),
    npcYOffset: Number(visual.npcYOffset ?? 0),
    cameraLead: Number(visual.cameraLead || 280)
  };
}

function scaleVisualForCanvas(visual, canvasHeight) {
  const scale = canvasVerticalScale(canvasHeight);
  if (Math.abs(scale - 1) < 0.01) return visual;
  return {
    ...visual,
    playerHeight: visual.playerHeight * scale,
    npcHeight: visual.npcHeight * scale,
    groundY: visual.groundY * scale,
    playerYOffset: visual.playerYOffset * scale,
    npcYOffset: visual.npcYOffset * scale
  };
}

function scaleHideoutItemPlacementForCanvas(placement, canvasHeight) {
  const scale = canvasVerticalScale(canvasHeight);
  if (Math.abs(scale - 1) < 0.01) return placement;
  return {
    ...placement,
    y: placement.y * scale,
    height: placement.height * scale
  };
}

function canvasVerticalScale(canvasHeight) {
  const height = Number(canvasHeight || CANONICAL_CANVAS_HEIGHT);
  const scale = height / CANONICAL_CANVAS_HEIGHT;
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function hideoutItemPlacement(state, typeId, tier) {
  const mapKey = `esconderijo-${state.player?.hideoutTier || 1}`;
  const placement = state.settings?.visual?.hideoutItems?.[mapKey]?.[typeId];
  const defaults = hideoutItemPlacementDefault(typeId, state.player?.hideoutTier || 1);
  return {
    ...defaults,
    ...(placement || {}),
    height: typeId === "vehicle" ? hideoutItemHeight(typeId, tier) : placement?.heights?.[tier] || hideoutItemHeight(typeId, tier)
  };
}

function positiveModulo(value, length) {
  return ((value % length) + length) % length;
}
