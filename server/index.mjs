import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 4191);
const clients = new Map();

const shops = [
  { id: "mercearia", name: "Mercearia da Cidade", owner: "Sistema", status: "aberta" },
  { id: "oficina", name: "Oficina do Bairro", owner: "Sistema", status: "preparando estoque" },
  { id: "mercado-negro", name: "Mercado Negro", owner: "Sistema", status: "fechado" }
];

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ ok: true, name: "Projeto 190 Online", players: clients.size }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  const id = randomUUID();
  clients.set(id, {
    id,
    name: "Visitante",
    level: 1,
    area: "cidade",
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

    const player = clients.get(id);
    if (!player) return;

    if (message.type === "player:hello") {
      player.name = message.name || player.name;
      player.level = Number(message.level || player.level);
      player.area = message.area || "cidade";
      player.lastSeen = Date.now();
      broadcastPresence();
    }

    if (message.type === "city:chat") {
      broadcast({
        type: "city:chat",
        from: player.name,
        text: String(message.text || "").slice(0, 180),
        at: Date.now()
      });
    }

    if (message.type === "city:shop:visit") {
      broadcast({
        type: "city:shop:activity",
        from: player.name,
        shopId: message.shopId,
        at: Date.now()
      });
    }
  });

  socket.on("close", () => {
    clients.delete(id);
    broadcastPresence();
  });
});

server.listen(PORT, () => {
  console.log(`Projeto 190 online server listening on http://localhost:${PORT}`);
});

function broadcastPresence() {
  broadcast({
    type: "city:presence",
    players: [...clients.values()].map(({ socket, ...player }) => player)
  });
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
