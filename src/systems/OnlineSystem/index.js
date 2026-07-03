const DEFAULT_URL = "ws://localhost:4191";

export class OnlineSystem {
  constructor(state, hooks = {}) {
    this.state = state;
    this.hooks = hooks;
    this.socket = null;
    this.status = "offline";
    this.clientId = null;
    this.players = [];
    this.shops = [
      { id: "mercearia", name: "Mercearia da Cidade", owner: "Sistema", status: "offline" },
      { id: "oficina", name: "Oficina do Bairro", owner: "Sistema", status: "offline" },
      { id: "mercado-negro", name: "Mercado Negro", owner: "Sistema", status: "offline" }
    ];
    this.chat = [];
    this.activity = [];
  }

  connect(url = DEFAULT_URL) {
    if (this.socket || this.status === "connecting") return;
    if (!("WebSocket" in window)) {
      this.status = "unsupported";
      this.emit();
      return;
    }

    this.status = "connecting";
    this.emit();
    this.socket = new WebSocket(url);

    this.socket.addEventListener("open", () => {
      this.status = "online";
      this.sayHello();
      this.emit();
      this.hooks.onToast?.("Cidade online conectada.");
    });

    this.socket.addEventListener("message", (event) => {
      this.receive(event.data);
    });

    this.socket.addEventListener("close", () => {
      this.socket = null;
      this.status = "offline";
      this.players = [];
      this.emit();
    });

    this.socket.addEventListener("error", () => {
      this.status = "offline";
      this.hooks.onToast?.("Servidor online nao encontrado. O jogo continua offline.");
      this.emit();
    });
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.status = "offline";
    this.players = [];
    this.emit();
  }

  sayHello() {
    this.send({
      type: "player:hello",
      name: this.playerName(),
      level: this.state.player.level,
      area: this.state.scene === "city" ? "cidade" : "assalto"
    });
  }

  sendChat(text) {
    const clean = String(text || "").trim();
    if (!clean) return;
    if (this.status !== "online") {
      this.chat.unshift({ from: "Sistema", text: "Conecte a cidade online para conversar.", at: Date.now() });
      this.emit();
      return;
    }
    this.send({ type: "city:chat", text: clean });
  }

  visitShop(shopId) {
    if (this.status === "online") this.send({ type: "city:shop:visit", shopId });
    this.activity.unshift({
      from: this.playerName(),
      shopId,
      at: Date.now()
    });
    this.activity = this.activity.slice(0, 8);
    this.emit();
  }

  snapshot() {
    return {
      status: this.status,
      players: this.players,
      shops: this.shops,
      chat: this.chat,
      activity: this.activity,
      clientId: this.clientId
    };
  }

  receive(raw) {
    let message = null;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (message.type === "online:welcome") {
      this.clientId = message.id;
      this.shops = message.shops || this.shops;
    }

    if (message.type === "city:presence") {
      this.players = message.players || [];
    }

    if (message.type === "city:chat") {
      this.chat.unshift(message);
      this.chat = this.chat.slice(0, 10);
    }

    if (message.type === "city:shop:activity") {
      this.activity.unshift(message);
      this.activity = this.activity.slice(0, 8);
    }

    this.emit();
  }

  send(payload) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  emit() {
    this.hooks.onChange?.();
  }

  playerName() {
    return `Player NV ${this.state.player.level}`;
  }
}
