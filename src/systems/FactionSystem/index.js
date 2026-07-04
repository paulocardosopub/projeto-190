const FACTION_KEY = "projeto-190-factions-v1";

export function factionSnapshot(player) {
  const store = normalizeFactionStore(readFactionStore());
  const playerId = player?.playerId;
  const membership = store.members.find((member) => member.playerId === playerId) || null;
  const faction = membership
    ? store.factions.find((candidate) => candidate.id === membership.factionId) || null
    : null;

  return {
    factions: store.factions.map((factionEntry) => factionSummary(store, factionEntry)),
    membership,
    faction: faction ? factionSummary(store, faction) : null,
    members: faction ? store.members
      .filter((member) => member.factionId === faction.id)
      .sort((a, b) => roleSort(a.role) - roleSort(b.role) || a.playerName.localeCompare(b.playerName))
      : [],
    playerId,
    playerName: player?.displayName || "Jogador",
    playerRole: membership?.role || null
  };
}

export function createFaction(player, fields) {
  const store = normalizeFactionStore(readFactionStore());
  if (!player?.playerId) return { ok: false, reason: "Entre no jogo antes de criar uma faccao." };
  if (currentMember(store, player.playerId)) return { ok: false, reason: "Voce ja esta em uma faccao." };

  const validation = validateFactionFields(fields, store);
  if (!validation.ok) return validation;

  const now = Date.now();
  const faction = {
    id: createId("faction"),
    name: validation.name,
    tag: validation.tag,
    description: validation.description,
    leaderPlayerId: player.playerId,
    leaderName: player.displayName || "Lider",
    createdAt: now
  };

  store.factions.push(faction);
  store.members.push({
    id: createId("member"),
    factionId: faction.id,
    playerId: player.playerId,
    playerName: player.displayName || "Jogador",
    role: "leader",
    joinedAt: now
  });
  writeFactionStore(store);
  return { ok: true, message: "Faccao criada.", factionId: faction.id };
}

export function joinFaction(player, factionId) {
  const store = normalizeFactionStore(readFactionStore());
  if (!player?.playerId) return { ok: false, reason: "Entre no jogo antes de entrar em uma faccao." };
  if (currentMember(store, player.playerId)) return { ok: false, reason: "Voce ja esta em uma faccao." };
  const faction = store.factions.find((candidate) => candidate.id === factionId);
  if (!faction) return { ok: false, reason: "Faccao nao encontrada." };

  store.members.push({
    id: createId("member"),
    factionId: faction.id,
    playerId: player.playerId,
    playerName: player.displayName || "Jogador",
    role: "member",
    joinedAt: Date.now()
  });
  writeFactionStore(store);
  return { ok: true, message: `Voce entrou em ${faction.name}.`, factionId: faction.id };
}

export function leaveFaction(player) {
  const store = normalizeFactionStore(readFactionStore());
  const membership = currentMember(store, player?.playerId);
  if (!membership) return { ok: false, reason: "Voce nao esta em uma faccao." };
  const memberCount = store.members.filter((member) => member.factionId === membership.factionId).length;
  if (membership.role === "leader" && memberCount > 1) {
    return { ok: false, reason: "O lider precisa transferir lideranca antes de sair." };
  }

  store.members = store.members.filter((member) => member.id !== membership.id);
  if (membership.role === "leader") {
    store.factions = store.factions.filter((faction) => faction.id !== membership.factionId);
    store.members = store.members.filter((member) => member.factionId !== membership.factionId);
  }
  writeFactionStore(store);
  return { ok: true, message: "Voce saiu da faccao.", factionId: null };
}

export function editFaction(player, fields) {
  const store = normalizeFactionStore(readFactionStore());
  const membership = currentMember(store, player?.playerId);
  if (!membership) return { ok: false, reason: "Voce nao esta em uma faccao." };
  if (membership.role !== "leader") return { ok: false, reason: "Apenas o lider pode editar a faccao." };
  const faction = store.factions.find((candidate) => candidate.id === membership.factionId);
  if (!faction) return { ok: false, reason: "Faccao nao encontrada." };

  const validation = validateFactionFields(fields, store, faction.id);
  if (!validation.ok) return validation;

  faction.name = validation.name;
  faction.tag = validation.tag;
  faction.description = validation.description;
  faction.leaderName = player.displayName || faction.leaderName;
  writeFactionStore(store);
  return { ok: true, message: "Faccao atualizada.", factionId: faction.id };
}

export function kickFactionMember(player, targetPlayerId) {
  const store = normalizeFactionStore(readFactionStore());
  const membership = currentMember(store, player?.playerId);
  if (!membership) return { ok: false, reason: "Voce nao esta em uma faccao." };
  if (membership.role !== "leader") return { ok: false, reason: "Apenas o lider pode expulsar membros." };
  if (targetPlayerId === player.playerId) return { ok: false, reason: "O lider nao pode expulsar a si mesmo." };

  const target = store.members.find((member) => (
    member.factionId === membership.factionId && member.playerId === targetPlayerId
  ));
  if (!target) return { ok: false, reason: "Membro nao encontrado." };
  if (target.role === "leader") return { ok: false, reason: "Nao e possivel expulsar o lider." };

  store.members = store.members.filter((member) => member.id !== target.id);
  writeFactionStore(store);
  return { ok: true, message: `${target.playerName} saiu da faccao.` };
}

function validateFactionFields(fields, store, currentFactionId = null) {
  const name = String(fields?.name || "").trim().replace(/\s+/g, " ");
  const tag = String(fields?.tag || "").trim().toUpperCase();
  const description = String(fields?.description || "").trim().replace(/\s+/g, " ").slice(0, 100);

  if (!name) return { ok: false, reason: "Informe o nome da faccao." };
  if ([...name].length > 24) return { ok: false, reason: "O nome pode ter no maximo 24 caracteres." };
  if (!/^[\p{L}\p{N} _.-]+$/u.test(name)) {
    return { ok: false, reason: "Use um nome de faccao mais simples." };
  }
  if (tag.length < 2 || tag.length > 5) return { ok: false, reason: "A sigla precisa ter de 2 a 5 caracteres." };
  if (!/^[A-Z0-9]+$/.test(tag)) return { ok: false, reason: "A sigla deve usar letras e numeros." };

  const duplicateName = store.factions.some((faction) => (
    faction.id !== currentFactionId && faction.name.toLowerCase() === name.toLowerCase()
  ));
  if (duplicateName) return { ok: false, reason: "Ja existe uma faccao com esse nome." };

  const duplicateTag = store.factions.some((faction) => (
    faction.id !== currentFactionId && faction.tag.toLowerCase() === tag.toLowerCase()
  ));
  if (duplicateTag) return { ok: false, reason: "Ja existe uma faccao com essa sigla." };

  return { ok: true, name, tag, description };
}

function factionSummary(store, faction) {
  const members = store.members.filter((member) => member.factionId === faction.id);
  return {
    ...faction,
    memberCount: members.length,
    members
  };
}

function currentMember(store, playerId) {
  if (!playerId) return null;
  return store.members.find((member) => member.playerId === playerId) || null;
}

function roleSort(role) {
  return role === "leader" ? 0 : 1;
}

function readFactionStore() {
  try {
    const raw = localStorage.getItem(FACTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeFactionStore(store) {
  localStorage.setItem(FACTION_KEY, JSON.stringify(normalizeFactionStore(store)));
}

function normalizeFactionStore(store) {
  const factions = Array.isArray(store?.factions) ? store.factions : [];
  const members = Array.isArray(store?.members) ? store.members : [];
  return {
    version: 1,
    factions: factions.map((faction) => ({
      id: String(faction.id || createId("faction")),
      name: String(faction.name || "Faccao"),
      tag: String(faction.tag || "FX").toUpperCase(),
      description: String(faction.description || ""),
      leaderPlayerId: String(faction.leaderPlayerId || ""),
      leaderName: String(faction.leaderName || "Lider"),
      createdAt: Number(faction.createdAt || Date.now())
    })),
    members: members.map((member) => ({
      id: String(member.id || createId("member")),
      factionId: String(member.factionId || ""),
      playerId: String(member.playerId || ""),
      playerName: String(member.playerName || "Jogador"),
      role: member.role === "leader" ? "leader" : "member",
      joinedAt: Number(member.joinedAt || Date.now())
    })).filter((member) => member.factionId && member.playerId)
  };
}

function createId(prefix) {
  if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
