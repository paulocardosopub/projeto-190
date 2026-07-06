import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 4191);
const clients = new Map();
const cityPlayers = new Map();
const MOVE_MIN_INTERVAL_MS = 45;
const MAX_MOVE_SPEED = 260;
const INACTIVE_TIMEOUT_MS = 30_000;
const DEFAULT_PLAYER_ID = "menino_gordinho_brasil";

const shops = [
  { id: "mercearia", name: "Mercearia da Cidade", owner: "Sistema", status: "aberta" },
  { id: "oficina", name: "Oficina do Bairro", owner: "Sistema", status: "preparando estoque" },
  { id: "mercado-negro", name: "Mercado Negro", owner: "Sistema", status: "fechado" }
];

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({
    ok: true,
    name: "Projeto 190 Online",
    players: clients.size,
    cityPlayers: cityPlayers.size
  }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  const id = randomUUID();
  clients.set(id, {
    id,
    publicPlayerId: null,
    name: "Visitante",
    level: 1,
    area: "cidade",
    sessionToken: null,
    lastSeen: Date.now(),
    socket
  });

  send(socket, { type: "online:welcome", id, shops });
  broadcastPresence();

  socket.on("message", (raw) => {
    let message = null;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const client = clients.get(id);
    if (!client) return;
    client.lastSeen = Date.now();

    if (message.type === "player:hello") {
      client.publicPlayerId = sanitizeId(message.playerId) || client.publicPlayerId;
      client.sessionToken = sanitizeId(message.sessionToken) || client.sessionToken;
      client.name = sanitizeText(message.name, 24) || client.name;
      client.level = clampNumber(message.level, 1, 999, client.level);
      client.area = sanitizeText(message.area, 24) || "cidade";
      broadcastPresence();
      return;
    }

    if (message.type === "player:join_city") {
      joinCity(id, client, message);
      return;
    }

    if (message.type === "player:move") {
      moveCityPlayer(id, client, message);
      return;
    }

    if (message.type === "player:leave_city") {
      leaveCity(id);
      return;
    }

    if (message.type === "city:chat") {
      broadcast({
        type: "city:chat",
        from: client.name,
        text: sanitizeText(message.text, 180),
        at: Date.now()
      });
      return;
    }

    if (message.type === "city:shop:visit") {
      broadcast({
        type: "city:shop:activity",
        from: client.name,
        shopId: sanitizeText(message.shopId, 40),
        at: Date.now()
      });
    }
  });

  socket.on("close", () => {
    leaveCity(id);
    clients.delete(id);
    broadcastPresence();
  });
});

setInterval(removeInactiveCityPlayers, 5_000).unref();

server.listen(PORT, () => {
  console.log(`Projeto 190 online server listening on http://localhost:${PORT}`);
});

function joinCity(socketId, client, message) {
  const player = sanitizeCityPlayer({
    playerId: message.playerId || client.publicPlayerId || socketId,
    sessionToken: message.sessionToken || client.sessionToken || "",
    playerName: message.playerName || client.name,
    areaId: message.areaId || "cidade",
    scene: message.scene || "city",
    mapId: message.mapId || "",
    characterId: message.characterId || DEFAULT_PLAYER_ID,
    equippedPetId: message.equippedPetId || null,
    weaponRarity: message.weaponRarity || null,
    activeShop: message.activeShop || null,
    x: message.x,
    y: message.y,
    direction: message.direction || "right",
    isMoving: Boolean(message.isMoving),
    timestamp: Date.now()
  });
  if (!player.playerId || !player.sessionToken) {
    send(client.socket, { type: "online:error", reason: "Sessao invalida." });
    return;
  }

  client.publicPlayerId = player.playerId;
  client.sessionToken = player.sessionToken;
  client.name = player.playerName;
  client.area = player.areaId || "cidade";
  cityPlayers.set(socketId, {
    ...player,
    socketId,
    lastMoveAt: 0,
    lastSeen: Date.now()
  });

  send(client.socket, {
    type: "city:players_snapshot",
    players: citySnapshot().filter((candidate) => candidate.socketId !== socketId)
  });
  broadcastToOthers(socketId, { type: "city:player_joined", player: publicCityPlayer(cityPlayers.get(socketId)) });
  broadcastPresence();
}

function moveCityPlayer(socketId, client, message) {
  const current = cityPlayers.get(socketId);
  if (!current) {
    joinCity(socketId, client, message);
    return;
  }

  const now = Date.now();
  if (now - current.lastMoveAt < MOVE_MIN_INTERVAL_MS) return;

  const nextX = clampNumber(message.x, 64, 1856, current.x);
  const nextY = clampNumber(message.y, -200, 400, current.y);
  const elapsedSeconds = Math.max(0.05, (now - (current.lastMoveAt || now - 100)) / 1000);
  const maxDistance = Math.max(35, MAX_MOVE_SPEED * elapsedSeconds + 60);
  const distance = Math.hypot(nextX - current.x, nextY - current.y);
  if (distance > maxDistance) return;

  current.x = Math.round(nextX);
  current.y = Math.round(nextY);
  current.areaId = sanitizeId(message.areaId) || current.areaId || "cidade";
  current.scene = sanitizeId(message.scene) || current.scene || "city";
  current.mapId = sanitizeId(message.mapId) || "";
  current.characterId = sanitizeId(message.characterId) || current.characterId;
  current.equippedPetId = sanitizeId(message.equippedPetId) || null;
  current.weaponRarity = sanitizeId(message.weaponRarity) || null;
  current.activeShop = sanitizeActiveShop(message.activeShop);
  current.direction = message.direction === "left" ? "left" : "right";
  current.isMoving = Boolean(message.isMoving);
  current.timestamp = Number(message.timestamp || now);
  current.lastMoveAt = now;
  current.lastSeen = now;
  client.area = current.areaId || client.area;

  broadcastToOthers(socketId, {
    type: current.isMoving ? "city:player_moved" : "city:player_stopped",
    player: publicCityPlayer(current)
  });
}

function leaveCity(socketId) {
  const player = cityPlayers.get(socketId);
  if (!player) return;
  cityPlayers.delete(socketId);
  broadcastToOthers(socketId, {
    type: "city:player_left",
    playerId: player.playerId,
    socketId
  });
  broadcastPresence();
}

function removeInactiveCityPlayers() {
  const now = Date.now();
  for (const [socketId, player] of cityPlayers.entries()) {
    if (now - player.lastSeen > INACTIVE_TIMEOUT_MS) {
      cityPlayers.delete(socketId);
      broadcast({
        type: "city:player_left",
        playerId: player.playerId,
        socketId
      });
    }
  }
  broadcastPresence();
}

function broadcastPresence() {
  broadcast({
    type: "city:presence",
    players: [...clients.values()].map(({ socket, sessionToken, ...player }) => player),
    cityPlayers: citySnapshot()
  });
}

function citySnapshot() {
  return [...cityPlayers.values()].map(publicCityPlayer);
}

function publicCityPlayer(player) {
  return {
    socketId: player.socketId,
    playerId: player.playerId,
    playerName: player.playerName,
    areaId: player.areaId,
    scene: player.scene,
    mapId: player.mapId,
    characterId: player.characterId,
    equippedPetId: player.equippedPetId,
    weaponRarity: player.weaponRarity,
    activeShop: player.activeShop,
    x: player.x,
    y: player.y,
    direction: player.direction,
    isMoving: Boolean(player.isMoving),
    timestamp: player.timestamp,
    lastSeen: player.lastSeen
  };
}

function broadcastToOthers(socketId, payload) {
  for (const [id, client] of clients.entries()) {
    if (id !== socketId) send(client.socket, payload);
  }
}

function broadcast(payload) {
  for (const client of clients.values()) {
    send(client.socket, payload);
  }
}

function send(socket, payload) {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(payload));
  }
}

function sanitizeCityPlayer(player) {
  return {
    playerId: sanitizeId(player.playerId),
    sessionToken: sanitizeId(player.sessionToken),
    playerName: sanitizeText(player.playerName, 24) || "Jogador",
    areaId: sanitizeId(player.areaId) || "cidade",
    scene: sanitizeId(player.scene) || "city",
    mapId: sanitizeId(player.mapId),
    characterId: sanitizeId(player.characterId) || DEFAULT_PLAYER_ID,
    equippedPetId: sanitizeId(player.equippedPetId) || null,
    weaponRarity: sanitizeId(player.weaponRarity) || null,
    activeShop: sanitizeActiveShop(player.activeShop),
    x: clampNumber(player.x, 64, 1856, 120),
    y: clampNumber(player.y, -200, 400, 0),
    direction: player.direction === "left" ? "left" : "right",
    isMoving: Boolean(player.isMoving),
    timestamp: Number(player.timestamp || Date.now())
  };
}

function sanitizeId(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return clean.replace(/[^\w:.-]/g, "").slice(0, 80);
}

function sanitizeText(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function sanitizeActiveShop(shop) {
  if (!shop || shop.active === false) return null;
  const listings = (Array.isArray(shop.listings) ? shop.listings : [])
    .map((listing) => ({
      drugType: sanitizeId(listing?.drugType),
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

  const shopId = sanitizeId(shop.shopId);
  const ownerPlayerId = sanitizeId(shop.ownerPlayerId);
  if (!shopId || !ownerPlayerId) return null;

  return {
    shopId,
    ownerPlayerId,
    ownerName: sanitizeText(shop.ownerName, 24) || "Jogador",
    shopName: sanitizeText(shop.shopName, 24) || "Lojinha",
    createdAt: Number(shop.createdAt || Date.now()),
    updatedAt: Number(shop.updatedAt || Date.now()),
    active: true,
    npcSlotId: sanitizeId(shop.npcSlotId),
    listings,
    grossSales: Math.max(0, Math.floor(Number(shop.grossSales || 0))),
    sellerRevenue: Math.max(0, Math.floor(Number(shop.sellerRevenue || 0))),
    salesCount: Math.max(0, Math.floor(Number(shop.salesCount || 0)))
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
