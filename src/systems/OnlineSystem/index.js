import { DEFAULT_PLAYER_ID } from "../../data/players/index.js?v=players-16";
import { EQUIPMENT_SLOTS } from "../../data/equipment/index.js?v=gloves-1";
import { itemPower } from "../EquipmentSystem/index.js?v=equipment-2";

const DEFAULT_URL = "ws://localhost:4191";
const SUPABASE_JS_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.0/+esm";
const CITY_CHANNEL = "projeto190:city:initial";
const MOVE_SEND_INTERVAL_MS = 120;
const PRESENCE_TRACK_INTERVAL_MS = 5000;
const RECONNECT_BASE_DELAY_MS = 3200;
const RECONNECT_MAX_DELAY_MS = 18000;
const PRESENCE_GRACE_MS = 6500;
const PLAYER_REMOVE_AFTER_MS = 35000;
const RECENT_LEAVE_KEEP_MS = 30000;
const REMOTE_LERP_SPEED = 12;
const REMOTE_SNAP_DISTANCE = 2200;
const OFFLINE_MESSAGE = "Xii, caiu a luz na favela! Segura ai";
const ONLINE_MESSAGE = "Tudo certo, ja fizemos um gato. Tamo online!";
const CITY_AREA_ID = "cidade";
const AWAY_AREA_ID = "fora";
const SOCIAL_IDLE_MAP_IDS = new Set(["fazenda-laboratorio", "petshop", "prisao", "hospital"]);

let supabaseModulePromise = null;

export class OnlineSystem {
  constructor(state, hooks = {}) {
    this.state = state;
    this.hooks = hooks;
    this.provider = "supabase";
    this.socket = null;
    this.supabase = null;
    this.channel = null;
    this.status = "offline";
    this.clientId = createClientId();
    this.players = [];
    this.cityPlayers = new Map();
    this.shops = [
      { id: "mercearia", name: "Mercearia da Cidade", owner: "Sistema", status: "online" },
      { id: "oficina", name: "Oficina do Bairro", owner: "Sistema", status: "preparando estoque" },
      { id: "mercado-negro", name: "Mercado Negro", owner: "Sistema", status: "fechado" }
    ];
    this.chat = [];
    this.activity = [];
    this.joinedCity = false;
    this.lastSentMoveAt = 0;
    this.lastPresenceTrackAt = 0;
    this.lastMoveSignature = "";
    this.manualDisconnect = false;
    this.reconnectConfig = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.offlineToastShown = false;
    this.recentCityLeaves = new Map();
  }

  connect(options = null) {
    if (this.socket || this.channel || this.status === "connecting") return;
    const config = this.resolveConnectionConfig(options);
    this.provider = config.provider;
    this.reconnectConfig = config;
    this.manualDisconnect = false;

    if (config.provider === "local") {
      this.connectLocal(config.localUrl);
      return;
    }

    this.connectSupabase(config);
  }

  async connectSupabase(config) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      this.status = "missing-config";
      this.hooks.onToast?.("Configure o servidor online em Configs.");
      this.emit();
      return;
    }

    this.status = "connecting";
    this.emit();

    try {
      const { createClient } = await loadSupabaseModule();
      if (this.manualDisconnect) return;

      this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
        realtime: {
          params: {
            eventsPerSecond: 20
          }
        }
      });

      this.channel = this.supabase.channel(CITY_CHANNEL, {
        config: {
          broadcast: { self: false },
          presence: { key: this.clientId }
        }
      });

      const channel = this.channel;
      channel
        .on("presence", { event: "sync" }, () => this.syncSupabasePresence())
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          (leftPresences || []).forEach((presence) => this.markCityPlayerMissing(presence.clientId || presence.playerId));
        })
        .on("broadcast", { event: "city:player_moved" }, ({ payload }) => this.upsertCityPlayer(payload?.player || payload))
        .on("broadcast", { event: "city:player_stopped" }, ({ payload }) => this.upsertCityPlayer(payload?.player || payload))
        .on("broadcast", { event: "city:player_left" }, ({ payload }) => this.handleCityPlayerLeft(payload?.player || payload))
        .on("broadcast", { event: "city:chat" }, ({ payload }) => this.receiveChat(payload))
        .on("broadcast", { event: "city:shop:activity" }, ({ payload }) => this.receiveShopActivity(payload))
        .on("broadcast", { event: "friend:request" }, ({ payload }) => this.receiveFriendRequest(payload))
        .on("broadcast", { event: "friend:accepted" }, ({ payload }) => this.receiveFriendAccepted(payload))
        .subscribe((status) => this.handleSupabaseStatus(status, channel));
    } catch (error) {
      this.status = "offline";
      this.hooks.onToast?.("Nao foi possivel conectar a cidade online.");
      console.warn("Supabase online error", error);
      this.emit();
      this.scheduleReconnect();
    }
  }

  connectLocal(url = DEFAULT_URL) {
    if (!("WebSocket" in window)) {
      this.status = "unsupported";
      this.emit();
      return;
    }

    this.status = "connecting";
    this.emit();
    this.socket = new WebSocket(url || DEFAULT_URL);

    this.socket.addEventListener("open", () => {
      this.status = "online";
      this.reconnectAttempts = 0;
      this.offlineToastShown = false;
      this.sayHello();
      this.syncCityMembership();
      this.emit();
      this.hooks.onToast?.(ONLINE_MESSAGE);
    });

    this.socket.addEventListener("message", (event) => {
      this.receiveLocal(event.data);
    });

    this.socket.addEventListener("close", () => {
      this.socket = null;
      this.handleDisconnect();
    });

    this.socket.addEventListener("error", () => {
      this.status = "offline";
      this.emit();
    });
  }

  handleSupabaseStatus(status, channel = this.channel) {
    if (this.manualDisconnect) return;
    if (channel && this.channel && channel !== this.channel) return;
    if (status === "SUBSCRIBED") {
      const wasOnline = this.status === "online";
      this.status = "online";
      this.reconnectAttempts = 0;
      this.offlineToastShown = false;
      this.sayHello();
      this.syncCityMembership();
      this.emit();
      if (!wasOnline) this.hooks.onToast?.(ONLINE_MESSAGE);
      return;
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      this.disconnectSupabase({ keepManualFlag: true });
      this.handleDisconnect();
    }
  }

  disconnect() {
    this.manualDisconnect = true;
    this.clearReconnect();
    this.leaveCity();
    this.disconnectLocal();
    this.disconnectSupabase();
    this.status = "offline";
    this.reconnectAttempts = 0;
    this.players = [];
    this.cityPlayers.clear();
    this.syncStatePlayers();
    this.emit();
  }

  disconnectLocal() {
    this.socket?.close();
    this.socket = null;
  }

  disconnectSupabase() {
    const channel = this.channel;
    this.channel = null;
    this.joinedCity = false;
    if (channel) {
      try {
        channel.untrack?.();
        this.supabase?.removeChannel?.(channel);
      } catch {
        // Best-effort cleanup; Supabase will clear presence after disconnect too.
      }
    }
    this.supabase = null;
  }

  handleDisconnect() {
    this.joinedCity = false;
    this.markAllCityPlayersMissing();
    this.syncStatePlayers();
    const shouldReconnect = !this.manualDisconnect;
    this.status = "offline";
    this.emit();
    if (shouldReconnect) {
      if (!this.offlineToastShown) {
        this.hooks.onToast?.(OFFLINE_MESSAGE);
        this.offlineToastShown = true;
      }
      this.scheduleReconnect();
    }
  }

  update(dt) {
    this.interpolatePlayers(dt);
    if (this.status !== "online") return;
    this.syncCityMembership();
    if (this.joinedCity) this.sendMovement();
  }

  sayHello() {
    if (this.provider === "local") {
      this.sendLocal({
        type: "player:hello",
        playerId: this.localPlayerId(),
        sessionToken: this.sessionToken(),
        name: this.playerName(),
        level: this.state.player.level,
        area: this.currentSocialAreaId() || (this.localActiveShopPayload() ? "loja online" : "assalto")
      });
    }
  }

  sendChat(text) {
    const clean = String(text || "").trim();
    if (!clean) return;
    if (this.status !== "online") {
      this.chat.unshift({ from: "Sistema", text: "Conecte a cidade online para conversar.", at: Date.now() });
      this.emit();
      return;
    }

    const entry = {
      from: this.playerName(),
      text: clean.slice(0, 180),
      at: Date.now()
    };

    if (this.provider === "supabase") {
      this.channel?.send({ type: "broadcast", event: "city:chat", payload: entry });
      this.receiveChat(entry);
      return;
    }

    this.sendLocal({ type: "city:chat", text: clean });
  }

  visitShop(shopId) {
    const entry = {
      from: this.playerName(),
      shopId,
      at: Date.now()
    };

    if (this.status === "online" && this.provider === "supabase") {
      this.channel?.send({ type: "broadcast", event: "city:shop:activity", payload: entry });
    } else if (this.status === "online") {
      this.sendLocal({ type: "city:shop:visit", shopId });
    }

    this.receiveShopActivity(entry);
  }

  snapshot() {
    return {
      status: this.status,
      provider: this.provider,
      players: this.players,
      cityPlayers: [...this.cityPlayers.values()],
      playerShops: this.state.onlinePlayerShops || [],
      socialArea: this.currentSocialAreaId(),
      shops: this.shops,
      chat: this.chat,
      activity: this.activity,
      clientId: this.clientId
    };
  }

  receiveLocal(raw) {
    let message = null;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (message.type === "online:welcome") {
      this.clientId = message.id || this.clientId;
      this.shops = message.shops || this.shops;
    }

    if (message.type === "online:error") {
      this.hooks.onToast?.(message.reason || "Nao foi possivel entrar online.");
    }

    if (message.type === "city:presence") {
      this.players = message.players || [];
      (message.cityPlayers || []).forEach((player) => this.upsertCityPlayer(player));
    }

    if (message.type === "city:players_snapshot") {
      this.cityPlayers.clear();
      (message.players || []).forEach((player) => this.upsertCityPlayer(player));
    }

    if (message.type === "city:player_joined") {
      this.upsertCityPlayer(message.player);
    }

    if (message.type === "city:player_moved" || message.type === "city:player_stopped") {
      this.upsertCityPlayer(message.player);
    }

    if (message.type === "city:player_left") {
      this.handleCityPlayerLeft(message);
    }

    if (message.type === "city:chat") {
      this.receiveChat(message);
    }

    if (message.type === "city:shop:activity") {
      this.receiveShopActivity(message);
    }

    if (message.type === "friend:request") {
      this.receiveFriendRequest(message);
    }

    if (message.type === "friend:accepted") {
      this.receiveFriendAccepted(message);
    }

    this.syncStatePlayers();
    this.emit();
  }

  syncCityMembership() {
    if (this.shouldShareOnlinePresence()) {
      if (!this.joinedCity) this.joinCity();
      return;
    }
    if (this.joinedCity) this.leaveCity();
  }

  joinCity() {
    if (this.status !== "online") return;
    this.lastMoveSignature = "";

    if (this.provider === "supabase") {
      this.joinedCity = true;
      this.trackSupabasePresence(true);
      return;
    }

    const sent = this.sendLocal({
      type: "player:join_city",
      ...this.localCityPayload(),
      isMoving: this.isLocalMoving(),
      timestamp: Date.now()
    });
    if (sent) this.joinedCity = true;
  }

  leaveCity() {
    if (!this.joinedCity) return;

    if (this.provider === "supabase") {
      const player = {
        playerId: this.localPlayerId(),
        clientId: this.clientId,
        socketId: this.clientId,
        timestamp: Date.now()
      };
      this.channel?.send?.({ type: "broadcast", event: "city:player_left", payload: { player } });
      this.channel?.untrack?.();
    } else {
      this.sendLocal({ type: "player:leave_city", playerId: this.localPlayerId() });
    }

    this.joinedCity = false;
    this.cityPlayers.clear();
    this.syncStatePlayers();
  }

  sendMovement(force = false) {
    const now = performance.now();
    if (!force && now - this.lastSentMoveAt < MOVE_SEND_INTERVAL_MS) return;
    const payload = {
      ...this.localCityPayload(),
      isMoving: this.isLocalMoving(),
      timestamp: Date.now()
    };
    const signature = [
      payload.x,
      payload.y,
      payload.direction,
      payload.isMoving,
      payload.areaId,
      payload.characterId,
      payload.level,
      payload.equippedPetId || "",
      payload.weaponRarity || "",
      equipmentSignature(payload.equipment),
      activeShopSignature(payload.activeShop)
    ].join(":");
    if (!force && signature === this.lastMoveSignature) {
      if (this.provider === "supabase" && now - this.lastPresenceTrackAt > PRESENCE_TRACK_INTERVAL_MS) {
        this.trackSupabasePresence();
      }
      return;
    }

    this.lastSentMoveAt = now;
    if (this.provider === "supabase") {
      const event = payload.isMoving ? "city:player_moved" : "city:player_stopped";
      this.channel?.send({ type: "broadcast", event, payload: { player: payload } });
      if (!payload.isMoving || now - this.lastPresenceTrackAt > PRESENCE_TRACK_INTERVAL_MS) {
        this.trackSupabasePresence();
      }
      this.lastMoveSignature = signature;
      return;
    }

    if (this.sendLocal({ type: "player:move", ...payload })) this.lastMoveSignature = signature;
  }

  trackSupabasePresence(force = false) {
    const now = performance.now();
    if (!force && now - this.lastPresenceTrackAt < PRESENCE_TRACK_INTERVAL_MS) return;
    this.lastPresenceTrackAt = now;
    this.channel?.track?.({
      ...this.localCityPayload(),
      isMoving: this.isLocalMoving(),
      timestamp: Date.now(),
      lastSeen: Date.now()
    });
  }

  syncSupabasePresence() {
    if (!this.channel) return;
    const presenceState = this.channel.presenceState?.() || {};
    const activeKeys = new Set();
    const now = Date.now();

    Object.entries(presenceState).forEach(([presenceKey, presences]) => {
      (presences || []).forEach((presence) => {
        const player = {
          ...presence,
          socketId: presence.clientId || presence.socketId || presenceKey
        };
        const key = this.playerKey(player);
        if (key) activeKeys.add(key);
        this.upsertCityPlayer(player);
      });
    });

    for (const [key, player] of this.cityPlayers.entries()) {
      if (player.provider === "supabase" && !activeKeys.has(key)) {
        player.missingSince ||= now;
      }
    }

    this.players = [...this.cityPlayers.values()].map((player) => ({
      id: player.playerId,
      name: player.playerName,
      area: player.areaId || CITY_AREA_ID,
      level: 1,
      lastSeen: player.lastSeen
    }));
    this.syncStatePlayers();
    this.emit();
  }

  localCityPayload() {
    return {
      provider: this.provider,
      socketId: this.clientId,
      clientId: this.clientId,
      playerId: this.localPlayerId(),
      sessionToken: this.sessionToken(),
      playerName: this.playerName(),
      areaId: this.currentSocialAreaId() || AWAY_AREA_ID,
      scene: this.state.scene || "city",
      mapId: this.state.scene === "idle" ? this.state.currentMapId || "" : "",
      characterId: this.state.selectedPlayerId || this.state.player.characterId || DEFAULT_PLAYER_ID,
      level: Math.max(1, Math.floor(Number(this.state.player.level || 1))),
      equippedPetId: this.state.player.equippedPetId || null,
      weaponRarity: this.state.player.equipment?.weapon?.rarity || null,
      equipment: this.localEquipmentPayload(),
      activeShop: this.localActiveShopPayload(),
      x: Math.round(Number(this.state.run?.playerX || 120)),
      y: 0,
      direction: this.state.run?.playerDirection || "right"
    };
  }

  upsertCityPlayer(raw) {
    if (!raw) return;
    const key = this.playerKey(raw);
    const playerId = String(raw.playerId || "");
    if (!key || raw.clientId === this.clientId || raw.socketId === this.clientId || playerId === this.localPlayerId()) return;

    const existing = this.cityPlayers.get(key);
    const targetX = Number(raw.x || 120);
    const targetY = Number(raw.y || 0);
    const areaId = String(raw.areaId || raw.area || CITY_AREA_ID);
    const sameArea = existing?.areaId === areaId;
    const timestamp = Number(raw.timestamp || Date.now());
    if (this.wasRecentlyLeft(raw, timestamp)) return;
    if (existing?.lastRemoteTimestamp && timestamp < existing.lastRemoteTimestamp - 120) return;
    if (!this.removeOlderPlayerDuplicates(key, playerId, timestamp)) return;

    this.cityPlayers.set(key, {
      provider: raw.provider || this.provider,
      socketId: raw.socketId || raw.clientId || key,
      clientId: raw.clientId || raw.socketId || key,
      playerId,
      playerName: String(raw.playerName || "Jogador"),
      areaId,
      scene: String(raw.scene || "city"),
      mapId: raw.mapId ? String(raw.mapId) : "",
      characterId: String(raw.characterId || DEFAULT_PLAYER_ID),
      level: Math.max(1, Math.min(999, Math.floor(Number(raw.level || 1)))),
      equippedPetId: raw.equippedPetId ? String(raw.equippedPetId) : null,
      weaponRarity: raw.weaponRarity ? String(raw.weaponRarity) : null,
      equipment: normalizeEquipmentSummary(raw.equipment),
      activeShop: normalizeActiveShop(raw.activeShop),
      x: existing && sameArea ? existing.x : targetX,
      y: existing && sameArea ? existing.y : targetY,
      targetX,
      targetY,
      direction: raw.direction === "left" ? "left" : "right",
      isMoving: Boolean(raw.isMoving),
      timestamp,
      lastRemoteTimestamp: timestamp,
      missingSince: null,
      lastSeen: Date.now()
    });
  }

  removeOlderPlayerDuplicates(currentKey, playerId, timestamp) {
    if (!playerId) return true;
    for (const [key, player] of this.cityPlayers.entries()) {
      if (key === currentKey || player.playerId !== playerId) continue;
      if (Number(player.lastRemoteTimestamp || 0) > Number(timestamp || 0) + 120) return false;
      this.cityPlayers.delete(key);
    }
    return true;
  }

  handleCityPlayerLeft(raw) {
    if (!raw) return;
    this.rememberCityLeave(raw);
    [
      raw.clientId,
      raw.socketId,
      raw.playerId
    ].filter(Boolean).forEach((identifier) => this.removeCityPlayer(identifier));
    this.emit();
  }

  removeCityPlayer(identifier) {
    const id = String(identifier || "");
    for (const [key, player] of this.cityPlayers.entries()) {
      if (key === id || player.socketId === id || player.clientId === id || player.playerId === id) {
        this.cityPlayers.delete(key);
      }
    }
    this.syncStatePlayers();
  }

  rememberCityLeave(raw) {
    const now = Date.now();
    this.pruneRecentCityLeaves(now);
    const leftAt = Number(raw?.timestamp || now);
    [
      raw?.clientId,
      raw?.socketId,
      raw?.playerId
    ].filter(Boolean).forEach((identifier) => {
      this.recentCityLeaves.set(String(identifier), { leftAt, observedAt: now });
    });
  }

  wasRecentlyLeft(raw, timestamp) {
    this.pruneRecentCityLeaves();
    const identifiers = [
      raw?.clientId,
      raw?.socketId,
      raw?.playerId
    ].filter(Boolean).map(String);
    const lastLeftAt = Math.max(
      0,
      ...identifiers.map((identifier) => Number(this.recentCityLeaves.get(identifier)?.leftAt || 0))
    );
    return Boolean(lastLeftAt && Number(timestamp || 0) <= lastLeftAt + 80);
  }

  pruneRecentCityLeaves(now = Date.now()) {
    for (const [identifier, leave] of this.recentCityLeaves.entries()) {
      if (now - Number(leave?.observedAt || 0) > RECENT_LEAVE_KEEP_MS) this.recentCityLeaves.delete(identifier);
    }
  }

  markCityPlayerMissing(identifier) {
    const id = String(identifier || "");
    const now = Date.now();
    for (const [key, player] of this.cityPlayers.entries()) {
      if (key === id || player.socketId === id || player.clientId === id || player.playerId === id) {
        player.missingSince ||= now;
        player.isMoving = false;
      }
    }
    this.syncStatePlayers();
  }

  markAllCityPlayersMissing() {
    const now = Date.now();
    for (const player of this.cityPlayers.values()) {
      player.missingSince ||= now;
      player.isMoving = false;
    }
  }

  receiveChat(entry) {
    if (!entry?.text) return;
    this.chat.unshift({
      from: String(entry.from || "Jogador"),
      text: String(entry.text || "").slice(0, 180),
      at: Number(entry.at || Date.now())
    });
    this.chat = this.chat.slice(0, 10);
    this.emit();
  }

  receiveShopActivity(entry) {
    if (!entry?.shopId) return;
    this.activity.unshift({
      from: String(entry.from || "Jogador"),
      shopId: String(entry.shopId || ""),
      at: Number(entry.at || Date.now())
    });
    this.activity = this.activity.slice(0, 8);
    this.emit();
  }

  sendFriendRequest(targetPlayer) {
    if (this.status !== "online") return { ok: false, reason: "Conecte a cidade online para adicionar amigos." };
    const target = normalizeFriendTarget(targetPlayer);
    if (!target.playerId && !target.clientId) return { ok: false, reason: "Jogador nao encontrado." };
    const payload = {
      type: "friend:request",
      requestId: createRequestId(),
      fromPlayerId: this.localPlayerId(),
      fromClientId: this.clientId,
      fromName: this.playerName(),
      fromCharacterId: this.state.selectedPlayerId || this.state.player.characterId || DEFAULT_PLAYER_ID,
      fromLevel: Math.max(1, Math.floor(Number(this.state.player.level || 1))),
      toPlayerId: target.playerId,
      toClientId: target.clientId,
      toName: target.playerName,
      at: Date.now()
    };

    if (this.provider === "supabase") {
      this.channel?.send({ type: "broadcast", event: "friend:request", payload });
    } else {
      this.sendLocal(payload);
    }
    return { ok: true, message: `Convite enviado para ${target.playerName || "jogador"}.`, request: payload };
  }

  sendFriendAccepted(request) {
    if (this.status !== "online" || !request) return false;
    const payload = {
      type: "friend:accepted",
      requestId: request.requestId || createRequestId(),
      fromPlayerId: this.localPlayerId(),
      fromClientId: this.clientId,
      fromName: this.playerName(),
      fromCharacterId: this.state.selectedPlayerId || this.state.player.characterId || DEFAULT_PLAYER_ID,
      fromLevel: Math.max(1, Math.floor(Number(this.state.player.level || 1))),
      toPlayerId: request.fromPlayerId,
      toClientId: request.fromClientId,
      toName: request.fromName,
      at: Date.now()
    };
    if (this.provider === "supabase") {
      this.channel?.send({ type: "broadcast", event: "friend:accepted", payload });
      return true;
    }
    return this.sendLocal(payload);
  }

  receiveFriendRequest(payload) {
    const request = normalizeFriendRequest(payload);
    if (!request || !this.isFriendMessageForLocal(request) || request.fromPlayerId === this.localPlayerId()) return;
    this.hooks.onFriendRequest?.(request);
  }

  receiveFriendAccepted(payload) {
    const accepted = normalizeFriendRequest(payload);
    if (!accepted || !this.isFriendMessageForLocal(accepted) || accepted.fromPlayerId === this.localPlayerId()) return;
    this.hooks.onFriendAccepted?.(accepted);
  }

  isFriendMessageForLocal(message) {
    const localPlayerId = this.localPlayerId();
    return Boolean(
      (message.toPlayerId && message.toPlayerId === localPlayerId) ||
      (message.toClientId && message.toClientId === this.clientId)
    );
  }

  interpolatePlayers(dt) {
    const now = Date.now();
    const amount = 1 - Math.exp(-REMOTE_LERP_SPEED * Math.max(0, dt));
    for (const [key, player] of this.cityPlayers.entries()) {
      if (
        now - player.lastSeen > PLAYER_REMOVE_AFTER_MS ||
        (player.missingSince && now - player.missingSince > PRESENCE_GRACE_MS)
      ) {
        this.cityPlayers.delete(key);
        continue;
      }
      if (Math.abs(player.targetX - player.x) > REMOTE_SNAP_DISTANCE) player.x = player.targetX;
      if (Math.abs(player.targetY - player.y) > REMOTE_SNAP_DISTANCE) player.y = player.targetY;
      player.x += (player.targetX - player.x) * amount;
      player.y += (player.targetY - player.y) * amount;
      if (Math.abs(player.targetX - player.x) < 0.25) player.x = player.targetX;
      if (Math.abs(player.targetY - player.y) < 0.25) player.y = player.targetY;
    }
    this.syncStatePlayers();
  }

  syncStatePlayers() {
    const socialAreaId = this.currentSocialAreaId();
    const players = [...this.cityPlayers.values()];
    this.state.onlineCityPlayers = socialAreaId
      ? players.filter((player) => player.areaId === socialAreaId)
      : [];
    this.state.onlinePlayerShops = players
      .map((player) => normalizeActiveShop(player.activeShop))
      .filter(Boolean);
  }

  isInCity() {
    return Boolean(this.currentSocialAreaId());
  }

  shouldShareOnlinePresence() {
    return Boolean(this.currentSocialAreaId() || this.localActiveShopPayload());
  }

  currentSocialAreaId() {
    if (this.state?.scene === "city" && this.state?.run?.mode === "city") return CITY_AREA_ID;
    if (
      this.state?.scene === "idle" &&
      SOCIAL_IDLE_MAP_IDS.has(this.state.currentMapId) &&
      ["idle", "temporary"].includes(this.state.run?.mode)
    ) {
      return this.state.currentMapId;
    }
    return null;
  }

  isLocalMoving() {
    const target = this.state?.run?.cityTargetX;
    return Number.isFinite(target) && Math.abs(target - Number(this.state.run?.playerX || 0)) > 2;
  }

  sendLocal(payload) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  playerName() {
    return this.state.player.displayName || `Player NV ${this.state.player.level}`;
  }

  localPlayerId() {
    return this.state.player.playerId || "local-player";
  }

  sessionToken() {
    return this.state.player.sessionToken || this.state.player.playerId || "local-session";
  }

  localActiveShopPayload() {
    const playerId = this.localPlayerId();
    const shop = (this.state.playerShops?.shops || [])
      .find((candidate) => candidate?.active && !candidate.remoteOnline && candidate.ownerPlayerId === playerId);
    if (!shop) return null;
    return normalizeActiveShop({
      shopId: shop.shopId,
      ownerPlayerId: playerId,
      ownerName: shop.ownerName || this.playerName(),
      shopName: shop.shopName,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt || Date.now(),
      active: true,
      npcSlotId: shop.npcSlotId,
      listings: shop.listings,
      grossSales: shop.grossSales,
      sellerRevenue: shop.sellerRevenue,
      salesCount: shop.salesCount
    });
  }

  localEquipmentPayload() {
    const equipment = {};
    for (const slot of EQUIPMENT_SLOTS) {
      const item = this.state.player.equipment?.[slot];
      if (!item) continue;
      equipment[slot] = normalizeEquipmentSummaryItem(item, slot);
    }
    return equipment;
  }

  playerKey(player) {
    return String(player?.clientId || player?.socketId || player?.playerId || "");
  }

  resolveConnectionConfig(options) {
    const settings = this.state.settings || {};
    const globalConfig = window.PROJETO190_SUPABASE || {};
    const input = typeof options === "object" && options ? options : {};
    const localUrl = typeof options === "string" ? options : (input.localUrl || settings.onlineUrl || DEFAULT_URL);
    const supabaseUrl = input.supabaseUrl || settings.supabaseUrl || globalConfig.url || "";
    const supabaseKey = input.supabaseKey || settings.supabaseKey || globalConfig.key || "";
    const provider = input.provider || settings.onlineProvider || (supabaseUrl && supabaseKey ? "supabase" : "local");
    return {
      provider: provider === "local" ? "local" : "supabase",
      localUrl,
      supabaseUrl,
      supabaseKey
    };
  }

  scheduleReconnect() {
    this.clearReconnect();
    const delay = Math.min(
      RECONNECT_MAX_DELAY_MS,
      RECONNECT_BASE_DELAY_MS * Math.max(1, this.reconnectAttempts + 1)
    );
    this.reconnectAttempts += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.manualDisconnect && !this.socket && !this.channel && this.status !== "online") {
        this.connect(this.reconnectConfig);
      }
    }, delay);
  }

  clearReconnect() {
    if (!this.reconnectTimer) return;
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  emit() {
    this.hooks.onChange?.();
  }
}

function loadSupabaseModule() {
  supabaseModulePromise ||= import(SUPABASE_JS_URL);
  return supabaseModulePromise;
}

function createClientId() {
  if (crypto?.randomUUID) return `client-${crypto.randomUUID()}`;
  return `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function normalizeActiveShop(shop) {
  if (!shop || shop.active === false) return null;
  const listings = (Array.isArray(shop.listings) ? shop.listings : [])
    .map((listing) => ({
      drugType: cleanId(listing?.drugType),
      quantity: Math.max(0, Math.floor(Number(listing?.quantity || 0))),
      pricePerUnit: Math.max(0, Math.floor(Number(listing?.pricePerUnit || 0))),
      suggestedPrice: Math.max(0, Math.floor(Number(listing?.suggestedPrice || listing?.pricePerUnit || 0))),
      originalQuantity: Math.max(0, Math.floor(Number(listing?.originalQuantity || listing?.quantity || 0))),
      soldQuantity: Math.max(0, Math.floor(Number(listing?.soldQuantity || 0))),
      reservedStock: Math.max(0, Math.floor(Number(listing?.reservedStock || 0))),
      reservedInventory: Math.max(0, Math.floor(Number(listing?.reservedInventory || 0)))
    }))
    .filter((listing) => listing.drugType && listing.quantity > 0 && listing.pricePerUnit > 0)
    .slice(0, 4);
  if (!listings.length) return null;

  const shopId = cleanId(shop.shopId);
  const ownerPlayerId = cleanId(shop.ownerPlayerId);
  if (!shopId || !ownerPlayerId) return null;

  return {
    shopId,
    ownerPlayerId,
    ownerName: cleanText(shop.ownerName, 24) || "Jogador",
    shopName: cleanText(shop.shopName, 24) || "Lojinha",
    createdAt: safeTimestamp(shop.createdAt),
    updatedAt: safeTimestamp(shop.updatedAt),
    active: true,
    npcSlotId: cleanId(shop.npcSlotId),
    listings,
    grossSales: Math.max(0, Math.floor(Number(shop.grossSales || 0))),
    sellerRevenue: Math.max(0, Math.floor(Number(shop.sellerRevenue || 0))),
    salesCount: Math.max(0, Math.floor(Number(shop.salesCount || 0)))
  };
}

function activeShopSignature(shop) {
  return shop ? JSON.stringify(shop) : "";
}

function equipmentSignature(equipment) {
  return equipment ? JSON.stringify(equipment) : "";
}

function normalizeEquipmentSummary(equipment) {
  if (!equipment || typeof equipment !== "object") return {};
  return Object.fromEntries(
    EQUIPMENT_SLOTS
      .map((slot) => [slot, normalizeEquipmentSummaryItem(equipment[slot], slot)])
      .filter(([, item]) => item)
  );
}

function normalizeEquipmentSummaryItem(item, fallbackSlot = "") {
  if (!item || typeof item !== "object") return null;
  const slot = cleanId(item.slot || fallbackSlot);
  if (!EQUIPMENT_SLOTS.includes(slot)) return null;
  return {
    id: cleanId(item.id),
    slot,
    name: cleanText(item.name, 42) || "Item",
    rarity: cleanId(item.rarity) || "comum",
    tier: Math.max(1, Math.min(9, Math.floor(Number(item.tier || 1)))),
    power: Math.max(0, Math.min(999999, Math.floor(Number(item.power || itemPower(item) || 0))))
  };
}

function normalizeFriendTarget(target) {
  return {
    playerId: cleanId(target?.playerId),
    clientId: cleanId(target?.clientId || target?.socketId),
    playerName: cleanText(target?.playerName, 24) || "Jogador"
  };
}

function normalizeFriendRequest(payload) {
  if (!payload || typeof payload !== "object") return null;
  const fromPlayerId = cleanId(payload.fromPlayerId);
  const fromClientId = cleanId(payload.fromClientId);
  const toPlayerId = cleanId(payload.toPlayerId);
  const toClientId = cleanId(payload.toClientId);
  if ((!fromPlayerId && !fromClientId) || (!toPlayerId && !toClientId)) return null;
  return {
    requestId: cleanId(payload.requestId) || createRequestId(),
    fromPlayerId,
    fromClientId,
    fromName: cleanText(payload.fromName, 24) || "Jogador",
    fromCharacterId: cleanId(payload.fromCharacterId) || DEFAULT_PLAYER_ID,
    fromLevel: Math.max(1, Math.min(999, Math.floor(Number(payload.fromLevel || 1)))),
    toPlayerId,
    toClientId,
    toName: cleanText(payload.toName, 24) || "Jogador",
    at: safeTimestamp(payload.at)
  };
}

function createRequestId() {
  if (crypto?.randomUUID) return `friend-${crypto.randomUUID()}`;
  return `friend-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function cleanId(value) {
  return String(value || "").trim().replace(/[^\w:.-]/g, "").slice(0, 80);
}

function cleanText(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function safeTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Date.now();
}
