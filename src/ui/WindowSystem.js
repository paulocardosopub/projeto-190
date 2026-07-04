import { MAPS, MAP_TIERS } from "../data/maps/index.js";
import { PLAYERS } from "../data/players/index.js";
import { EQUIPMENT_SLOTS, SLOT_LABELS } from "../data/equipment/index.js?v=gloves-1";
import { HIDEOUT_ITEM_TYPES, hideoutItemCost } from "../data/hideoutItems/index.js";
import { calculateStats, formatStat, statLabel } from "../systems/EquipmentSystem/index.js?v=equipment-2";
import {
  assetRequirementText,
  canUnlockAsset,
  getOfflineLimitHours,
  getPassiveIncomePerMinute,
  getStaminaRechargeCost,
  staminaPercent,
  staminaState
} from "../systems/StaminaSystem/index.js";
import { getCarConfig, getHouseConfig, getLandConfig } from "../data/balance/index.js";

const BACKPACK_PAGE_SIZE = 36;
const BACKPACK_PAGE_COUNT = 4;
const ITEM_DRAG_MIME = "application/x-projeto-190-item";

export function renderInventoryWindow(container, state, renderer, callbacks) {
  const player = state.player;
  const stats = calculateStats(player);
  const activeBackpackPage = normalizeBackpackPage(state);
  const pageStart = (activeBackpackPage - 1) * BACKPACK_PAGE_SIZE;
  const pageItems = player.inventory.slice(pageStart, pageStart + BACKPACK_PAGE_SIZE);
  const pageSlots = Array.from({ length: BACKPACK_PAGE_SIZE }, (_, offset) => ({
    item: pageItems[offset] || null,
    index: pageStart + offset
  }));
  const selectedItem = Number.isInteger(state.selectedInventoryIndex)
    ? player.inventory[state.selectedInventoryIndex]
    : null;

  container.innerHTML = `
    ${windowHeader("Equipamento/Mochila", "inventory", { config: true })}
    <div class="window-body">
      <div class="equipment-compact">
        <div class="equipment-summary">
          <div class="slot-list compact-slots">
            ${EQUIPMENT_SLOTS.map((slot) => slotTemplate(slot, player.equipment[slot])).join("")}
          </div>
          <div class="mini-profile">
            <canvas id="inventory-avatar" width="72" height="86"></canvas>
            <div class="mini-stats">
              ${statLine("Poder", stats.power)}
              ${statLine("HP", `${player.hp}/${stats.maxHp}`)}
              ${statLine("Atk", stats.attack)}
              ${statLine("Vel", `${stats.speed.toFixed(2)}x`)}
              ${statLine("Roubo", `${Math.round(stats.steal * 100)}%`)}
            </div>
          </div>
          <div class="selected-panel">
            ${selectedItem ? `
              <div class="selected-icon gear-square ${tierClass(selectedItem)}">
                ${gearIcon(selectedItem)}
                <small>${tierLabel(selectedItem)}</small>
              </div>
            ` : `<div class="selected-icon gear-square tier-empty"></div>`}
            <div class="selected-copy">
              <span class="eyebrow">Selecionado</span>
              <h3>${selectedItem ? selectedItem.name : "Nenhum item"}</h3>
              <p>${selectedItem ? itemStatsText(selectedItem) : "Toque em um item da mochila."}</p>
            </div>
          </div>
        </div>
        <div class="inventory-action-bar">
          <button class="item-action primary" id="equip-best">Equipar melhor</button>
          <button class="item-action" id="filter-inventory">Filtrar</button>
        </div>
        <div class="backpack-header">
          <div class="backpack-title">
            <span class="eyebrow">Mochila</span>
            <div class="backpack-pages" aria-label="Partes da mochila">
              ${[1, 2, 3, 4].map((page) => `<button type="button" class="${page === activeBackpackPage ? "active" : ""}" data-backpack-page="${page}">${page}</button>`).join("")}
            </div>
          </div>
          <strong>${pageItems.filter(Boolean).length} / ${BACKPACK_PAGE_SIZE}</strong>
        </div>
        <div class="inventory-grid compact-inventory" id="inventory-grid">
          ${pageSlots.map(({ item, index }) => inventoryCell(item, index, state.selectedInventoryIndex, player)).join("")}
        </div>
        ${masterTabs(callbacks.activeLeft, callbacks.activeRight)}
      </div>
    </div>
  `;

  renderer.drawActorPreview(container.querySelector("#inventory-avatar"), "players", playerRow(state), "front");

  bindClose(container, callbacks.close);
  container.querySelectorAll(".inventory-cell").forEach((cell) => {
    cell.addEventListener("click", () => callbacks.selectInventory(Number(cell.dataset.index)));
    cell.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      callbacks.equipFromInventory(Number(cell.dataset.index));
    });
    cell.addEventListener("dragstart", (event) => setItemDragData(event, "inventory", Number(cell.dataset.index)));
    cell.addEventListener("dragover", (event) => event.preventDefault());
    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = readItemDragData(event);
      if (callbacks.dropOnInventory) {
        callbacks.dropOnInventory(payload, Number(cell.dataset.index));
        return;
      }
      callbacks.moveInventory(payload?.index, Number(cell.dataset.index));
    });
  });

  container.querySelectorAll(".slot").forEach((slot) => {
    slot.addEventListener("dragover", (event) => event.preventDefault());
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = readItemDragData(event);
      if (payload?.source !== "inventory") return;
      callbacks.equipFromInventory(payload.index);
    });
    slot.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (slot.classList.contains("tier-empty")) return;
      callbacks.unequip(slot.dataset.slot, slot.dataset.accessoryIndex ? Number(slot.dataset.accessoryIndex) : null);
    });
    slot.addEventListener("dblclick", () => {
      callbacks.unequip(slot.dataset.slot, slot.dataset.accessoryIndex ? Number(slot.dataset.accessoryIndex) : null);
    });
  });

  container.querySelector("#equip-best")?.addEventListener("click", callbacks.equipBest);
  container.querySelector("#filter-inventory")?.addEventListener("click", callbacks.filterInventory);
  container.querySelector("[data-open-config]")?.addEventListener("click", callbacks.openConfig);
  bindBackpackPages(container, callbacks.selectBackpackPage);
  container.querySelectorAll("[data-master-tab]").forEach((button) => {
    button.addEventListener("click", () => callbacks.openTab(button.dataset.masterTab));
  });
}

export function renderHideoutChestWindow(container, state, callbacks) {
  const player = state.player;
  const chest = player.hideoutChest || [];
  const activeChestPage = normalizeChestPage(state);
  const pageStart = (activeChestPage - 1) * BACKPACK_PAGE_SIZE;
  const pageItems = chest.slice(pageStart, pageStart + BACKPACK_PAGE_SIZE);
  const pageSlots = Array.from({ length: BACKPACK_PAGE_SIZE }, (_, offset) => ({
    item: pageItems[offset] || null,
    index: pageStart + offset
  }));
  const selectedChestItem = Number.isInteger(state.selectedChestIndex)
    ? chest[state.selectedChestIndex]
    : null;
  const selectedInventoryItem = Number.isInteger(state.selectedInventoryIndex)
    ? player.inventory[state.selectedInventoryIndex]
    : null;

  container.innerHTML = `
    ${windowHeader("Bau do Esconderijo", "hideout-chest")}
    <div class="window-body">
      <div class="storage-compact">
        <div class="selected-panel">
          ${selectedChestItem ? `
            <div class="selected-icon gear-square ${tierClass(selectedChestItem)}">
              ${gearIcon(selectedChestItem)}
              <small>${tierLabel(selectedChestItem)}</small>
            </div>
          ` : `<div class="selected-icon gear-square tier-empty"></div>`}
          <div class="selected-copy">
            <span class="eyebrow">No bau</span>
            <h3>${selectedChestItem ? selectedChestItem.name : "Nenhum item"}</h3>
            <p>${selectedChestItem ? itemStatsText(selectedChestItem) : "Selecione um item guardado."}</p>
          </div>
        </div>
        <div class="inventory-action-bar">
          <button class="item-action primary" data-store-selected ${selectedInventoryItem ? "" : "disabled"}>Guardar</button>
          <button class="item-action" data-take-selected ${selectedChestItem ? "" : "disabled"}>Pegar</button>
        </div>
        <div class="backpack-header">
          <div class="backpack-title">
            <span class="eyebrow">Bau</span>
            <div class="backpack-pages" aria-label="Partes do bau">
              ${[1, 2, 3, 4].map((page) => `<button type="button" class="${page === activeChestPage ? "active" : ""}" data-chest-page="${page}">${page}</button>`).join("")}
            </div>
          </div>
          <strong>${pageItems.filter(Boolean).length} / ${BACKPACK_PAGE_SIZE}</strong>
        </div>
        <div class="inventory-grid compact-inventory storage-grid" id="hideout-chest-grid">
          ${pageSlots.map(({ item, index }) => inventoryCell(item, index, state.selectedChestIndex, { inventory: chest })).join("")}
        </div>
      </div>
    </div>
  `;

  bindClose(container, callbacks.close);
  container.querySelectorAll(".inventory-cell").forEach((cell) => {
    cell.addEventListener("click", () => callbacks.selectChestItem(Number(cell.dataset.index)));
    cell.addEventListener("dragstart", (event) => setItemDragData(event, "chest", Number(cell.dataset.index)));
    cell.addEventListener("dragover", (event) => event.preventDefault());
    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      callbacks.dropOnChest(readItemDragData(event), Number(cell.dataset.index));
    });
  });
  container.querySelectorAll("[data-chest-page]").forEach((button) => {
    button.addEventListener("click", () => callbacks.selectChestPage(Number(button.dataset.chestPage)));
  });
  container.querySelector("[data-store-selected]")?.addEventListener("click", callbacks.storeSelected);
  container.querySelector("[data-take-selected]")?.addEventListener("click", callbacks.takeSelected);
}

function bindBackpackPages(container, selectBackpackPage) {
  const buttons = [...container.querySelectorAll("[data-backpack-page]")];
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const page = Number(button.dataset.backpackPage);
      selectBackpackPage?.(page);
    });
  });
}

function normalizeBackpackPage(state) {
  const page = Number(state.backpackPage || 1);
  return Math.min(BACKPACK_PAGE_COUNT, Math.max(1, Number.isFinite(page) ? Math.round(page) : 1));
}

function normalizeChestPage(state) {
  const page = Number(state.chestPage || 1);
  return Math.min(BACKPACK_PAGE_COUNT, Math.max(1, Number.isFinite(page) ? Math.round(page) : 1));
}

function setItemDragData(event, source, index) {
  const payload = JSON.stringify({ source, index });
  event.dataTransfer.setData(ITEM_DRAG_MIME, payload);
  event.dataTransfer.setData("text/plain", String(index));
}

function readItemDragData(event) {
  const raw = event.dataTransfer.getData(ITEM_DRAG_MIME);
  if (raw) {
    try {
      const payload = JSON.parse(raw);
      if (Number.isInteger(payload.index)) return payload;
    } catch {
      return null;
    }
  }
  const fallbackIndex = Number(event.dataTransfer.getData("text/plain"));
  return Number.isInteger(fallbackIndex) ? { source: "inventory", index: fallbackIndex } : null;
}

export function renderPanel(container, type, state, renderer, callbacks) {
  const titles = {
    assaults: "Assaltos",
    city: "Cidade",
    hideout: "Esconderijo",
    faction: "Faccao"
  };

  container.innerHTML = `
    ${windowHeader(titles[type] || "Painel", type)}
    <div class="window-body">
      ${panelBody(type, state, callbacks.onlineSnapshot?.())}
    </div>
  `;

  bindClose(container, callbacks.close);
  attachScrollControls(container);

  if (type === "assaults") {
    container.querySelectorAll("[data-assault-tier]").forEach((button) => {
      button.addEventListener("click", () => callbacks.selectAssaultTier(Number(button.dataset.assaultTier)));
    });
    container.querySelectorAll("[data-enter-map]").forEach((button) => {
      button.addEventListener("click", () => callbacks.enterMap(button.dataset.enterMap));
    });
    container.querySelectorAll(".map-thumb").forEach((canvas) => {
      renderer.drawMapThumb(canvas, MAPS.find((map) => map.id === canvas.dataset.mapId));
    });
  }

  container.querySelector("[data-return-city]")?.addEventListener("click", callbacks.enterCity);
  container.querySelector("[data-online-connect]")?.addEventListener("click", callbacks.onlineConnect);
  container.querySelector("[data-online-disconnect]")?.addEventListener("click", callbacks.onlineDisconnect);
  container.querySelectorAll("[data-shop-visit]").forEach((button) => {
    button.addEventListener("click", () => callbacks.visitShop(button.dataset.shopVisit));
  });
  container.querySelectorAll("[data-buy-hideout-item]").forEach((button) => {
    button.addEventListener("click", () => callbacks.buyHideoutItem(button.dataset.buyHideoutItem));
  });
  if (callbacks.openChest) {
    container.querySelector("[data-hideout-chest]")?.addEventListener("click", callbacks.openChest);
  }
  if (callbacks.openVault) {
    container.querySelector("[data-hideout-vault]")?.addEventListener("click", callbacks.openVault);
  }
  container.querySelector("[data-hideout-rest]")?.addEventListener("click", callbacks.restNow);
  container.querySelector("[data-vault-collect]")?.addEventListener("click", callbacks.collectVault);
  container.querySelector("#city-chat-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = container.querySelector("#city-chat-input");
    callbacks.sendChat(input.value);
    input.value = "";
  });
}

export function renderConfigWindow(container, state, callbacks) {
  const visual = state.settings.visual || {};
  const preview = previewVisualValues(state, visual);
  container.innerHTML = `
    ${windowHeader("Configs", "configs")}
    <div class="window-body">
      <div class="inventory-tools">
        <button class="panel-action" id="config-save">Salvar</button>
        <button class="panel-action" id="config-reset">Novo jogo</button>
      </div>
      ${state.settings.visualPreview ? `
        <section class="log-panel visual-tuner">
          <h3>Ajuste visual do mapa</h3>
          <p class="tuner-note">Esses controles existem so no preview. O jogo normal usa o ajuste salvo, sem mostrar este menu.</p>
          <div class="tuner-group">
            <span class="eyebrow">Mapa</span>
            <div class="tuner-buttons">
              ${MAPS.map((map) => `
                <button class="item-action ${state.currentMapId === map.id ? "active" : ""}" data-preview-map="${map.id}">
                  ${map.code}
                </button>
              `).join("")}
            </div>
          </div>
          <div class="tuner-group">
            <span class="eyebrow">Personagem</span>
            <div class="tuner-buttons">
              ${PLAYERS.map((player) => `
                <button class="item-action ${state.selectedPlayerId === player.id ? "active" : ""}" data-preview-player="${player.id}">
                  ${player.name}
                </button>
              `).join("")}
            </div>
          </div>
          ${rangeControl("playerHeight", "Tamanho do player", preview.playerHeight, 48, 130)}
          ${rangeControl("npcHeight", "Tamanho dos NPCs", preview.npcHeight, 48, 145)}
          ${rangeControl("groundY", `Chao deste mapa (${preview.mapLabel})`, preview.groundY, 190, 298)}
          ${rangeControl("playerYOffset", "Ajuste vertical do player", preview.playerYOffset, -40, 40)}
          ${rangeControl("npcYOffset", "Ajuste vertical dos NPCs", preview.npcYOffset, -40, 40)}
          ${rangeControl("cameraLead", "Distancia da camera", preview.cameraLead, 120, 520)}
        </section>
      ` : ""}
    </div>
  `;

  bindClose(container, callbacks.close);
  attachScrollControls(container);
  container.querySelector("#config-save").addEventListener("click", callbacks.save);
  container.querySelector("#config-reset").addEventListener("click", callbacks.reset);
  container.querySelectorAll("[data-visual-control]").forEach((input) => {
    input.addEventListener("input", () => callbacks.updateVisual(input.dataset.visualControl, Number(input.value)));
  });
  container.querySelectorAll("[data-preview-map]").forEach((button) => {
    button.addEventListener("click", () => callbacks.previewMap(button.dataset.previewMap));
  });
  container.querySelectorAll("[data-preview-player]").forEach((button) => {
    button.addEventListener("click", () => callbacks.previewPlayer(button.dataset.previewPlayer));
  });
}

export function renderCharacterSelect(container, renderer, onSelect) {
  container.innerHTML = PLAYERS.map((player) => `
    <button class="character-card" data-player="${player.id}">
      <canvas width="150" height="150" data-row="${player.row}"></canvas>
      <h3>${player.name}</h3>
      <p><strong>${player.title}</strong><br>${player.description}</p>
    </button>
  `).join("");

  container.querySelectorAll("canvas").forEach((canvas) => {
    renderer.drawActorPreview(canvas, "players", Number(canvas.dataset.row), "front");
  });

  container.querySelectorAll("[data-player]").forEach((button) => {
    button.addEventListener("click", () => onSelect(button.dataset.player));
  });
}

function panelBody(type, state, online) {
  if (type === "assaults") {
    const activeTier = state.activeAssaultTier || 1;
    const maps = MAPS.filter((map) => map.tier === activeTier);
    const highestUnlocked = state.player.highestMapUnlocked || 1;
    return `
      <div class="tier-selector">
        ${MAP_TIERS.map((tier) => `
          <button class="item-action ${tier === activeTier ? "active" : ""}" data-assault-tier="${tier}">
            Tier ${tier}
          </button>
        `).join("")}
      </div>
      <div class="map-list">
        ${maps.map((map) => {
          const locked = map.index > highestUnlocked;
          return `
          <article class="map-row">
            <canvas class="map-thumb" width="108" height="84" data-map-id="${map.id}"></canvas>
            <div>
              <h3>${map.code} ${map.name}</h3>
              <p>HP ${formatNumber(map.enemyHp)} | Dano ${formatNumber(map.enemyDamage)} | Drop ${map.chanceDropEquipamento}% | Sta ${map.staminaCost}</p>
            </div>
            <button class="panel-action" data-enter-map="${map.id}" ${locked ? "disabled" : ""}>${locked ? "Bloqueado" : "Entrar"}</button>
          </article>
        `;
        }).join("")}
      </div>
    `;
  }

  if (type === "city") {
    return `
      ${onlineCityPanel(online)}
      <div class="future-grid">
        ${futureCard("Comercio", "Compra e venda geral em breve.")}
        ${futureCard("Veiculos", "Transporte e rotas futuras.")}
        ${futureCard("Imoveis", "Casas e alugueis futuros.")}
        ${futureCard("Mercado Negro", "Itens raros e troca futura.")}
        ${futureCard("NPCs", "Missoes urbanas futuras.")}
        ${futureCard("Eventos", "Eventos temporarios futuros.")}
      </div>
      <div class="inventory-tools"><button class="panel-action" data-return-city>Voltar para cidade</button></div>
    `;
  }

  if (type === "hideout") {
    return `
      ${hideoutProgressPanel(state)}
      <div class="hideout-upgrade-list">
        ${HIDEOUT_ITEM_TYPES.map((item) => hideoutUpgradeRow(item, state)).join("")}
      </div>
      <div class="future-grid">
        ${futureCard("Upgrades", "Melhorias permanentes da base.")}
        ${futureCard("Cofre", "Guarde dinheiro com seguranca.")}
        ${futureCard("Inventario Extra", "Mais espaco para loot.")}
        ${futureCard("Craft", "Receitas preparadas para expansao.")}
        ${futureCard("Recuperacao", "Cure vida entre assaltos.")}
        ${futureCard("Melhorias", "Decoracao e bonus futuros.")}
      </div>
    `;
  }

  return `
    <div class="future-grid">
      ${futureCard("Tropa do Fundao", "Crie uma faccao ou entre em uma.")}
      ${futureCard("Membros", "Lista de participantes futura.")}
      ${futureCard("Boss da Faccao", "Chefe cooperativo futuro.")}
      ${futureCard("Doacoes", "Contribuicoes para upgrades.")}
      ${futureCard("Ranking", "Disputa de poder online.")}
      ${futureCard("Chat", "Canal da faccao preparado.")}
    </div>
  `;
}

function onlineCityPanel(online) {
  const snapshot = online || {
    status: "offline",
    players: [],
    shops: [],
    chat: [],
    activity: []
  };
  const isOnline = snapshot.status === "online";
  return `
    <section class="online-panel">
      <div class="online-header">
        <div>
          <span class="eyebrow">Cidade online</span>
          <h3>${onlineStatusLabel(snapshot.status)}</h3>
          <p>${isOnline ? `${snapshot.players.length} jogador(es) na cidade.` : "A cidade roda offline ate conectar o servidor."}</p>
        </div>
        <button class="panel-action" ${isOnline ? "data-online-disconnect" : "data-online-connect"}>
          ${isOnline ? "Sair" : "Conectar"}
        </button>
      </div>
      <div class="online-grid">
        <article>
          <h4>Players</h4>
          <ul>${listOrEmpty(snapshot.players.map((player) => `${player.name} - NV ${player.level}`), "Nenhum player conectado.")}</ul>
        </article>
        <article>
          <h4>Lojas</h4>
          <ul>
            ${snapshot.shops.map((shop) => `
              <li>
                <span>${shop.name}<small>${shop.status}</small></span>
                <button class="item-action" data-shop-visit="${shop.id}">Visitar</button>
              </li>
            `).join("") || "<li>Nenhuma loja registrada.</li>"}
          </ul>
        </article>
      </div>
      <form class="chat-form" id="city-chat-form">
        <input id="city-chat-input" maxlength="120" placeholder="Mensagem da cidade">
        <button class="item-action">Enviar</button>
      </form>
      <ul class="city-chat">
        ${listOrEmpty(snapshot.chat.map((entry) => `${entry.from}: ${entry.text}`), "Chat vazio.")}
      </ul>
    </section>
  `;
}

function onlineStatusLabel(status) {
  return {
    online: "Conectado",
    connecting: "Conectando",
    offline: "Offline",
    unsupported: "Indisponivel"
  }[status] || "Offline";
}

function listOrEmpty(items, empty) {
  return items.length ? items.map((item) => `<li>${item}</li>`).join("") : `<li>${empty}</li>`;
}

function windowHeader(title, name, actions = {}) {
  return `
    <header class="window-header">
      <h2>${title}</h2>
      <div class="window-actions">
        ${actions.config ? `<button type="button" class="config-button" data-open-config aria-label="Abrir configuracoes" title="Configuracoes">&#9881;</button>` : ""}
        <button class="close-button" data-close-window="${name}" aria-label="Fechar">X</button>
      </div>
    </header>
  `;
}

function masterTabs(activeLeft, activeRight) {
  return `
    <nav class="master-tabs" aria-label="Menus da mochila">
      ${masterTab("assaults", "Assaltos", activeLeft, activeRight)}
      ${masterTab("city", "Cidade", activeLeft, activeRight)}
      ${masterTab("hideout", "Esconderijo", activeLeft, activeRight)}
      ${masterTab("faction", "Faccao", activeLeft, activeRight)}
    </nav>
  `;
}

function masterTab(id, label, activeLeft, activeRight) {
  const active = activeLeft === id || activeRight === id ? " active" : "";
  return `<button type="button" class="master-tab${active}" data-master-tab="${id}">${label}</button>`;
}

function slotTemplate(slot, item, accessoryIndex = null) {
  const label = slot === "accessory"
    ? `${SLOT_LABELS[slot]} ${accessoryIndex + 1}`
    : SLOT_LABELS[slot];
  return `
    <div class="slot gear-square ${item ? tierClass(item) : "tier-empty"}" title="${item ? `${label}: ${item.name}` : `${label}: Vazio`}" data-slot="${slot}" ${accessoryIndex !== null ? `data-accessory-index="${accessoryIndex}"` : ""}>
      ${gearIcon(item || slot)}
      <small>${item ? tierLabel(item) : shortSlotLabel(slot, accessoryIndex)}</small>
    </div>
  `;
}

function inventoryCell(item, index, selectedIndex, player) {
  if (!item) return `<div class="inventory-cell gear-square empty tier-empty" data-index="${index}"></div>`;
  const count = craftCountForItem(player, item);
  return `
    <div class="inventory-cell gear-square ${selectedIndex === index ? "selected" : ""} ${tierClass(item)}" title="${item.name}" data-index="${index}" data-rarity="${item.rarity}" draggable="true">
      ${gearIcon(item)}
      <small>${tierLabel(item)}</small>
      ${count >= 2 ? `<em class="craft-count">${Math.min(count, 4)}/4</em>` : ""}
    </div>
  `;
}

function gearIcon(itemOrSlot) {
  const item = typeof itemOrSlot === "object" ? itemOrSlot : null;
  const slot = item?.slot || itemOrSlot;
  if (item?.iconPath) {
    return `<img class="gear-icon-image" src="${item.iconPath}" alt="" draggable="false">`;
  }
  return `<span class="gear-glyph icon-${slot}" aria-hidden="true"></span>`;
}

function tierClass(item) {
  const tier = Math.max(1, Math.min(4, item?.tier || 1));
  return `rarity-${item?.rarity || "comum"} tier-${tier}`;
}

function shortSlotLabel(slot, index = null) {
  if (slot === "weapon") return "AR";
  if (slot === "body") return "AM";
  if (slot === "hands") return "LU";
  if (slot === "feet") return "PE";
  if (slot === "head") return "CA";
  if (slot === "face") return "RO";
  if (slot === "accessory") return `A${(index ?? 0) + 1}`;
  return "";
}

function tierLabel(item) {
  return `t${Math.max(1, Math.min(4, Number(item?.tier) || 1))}`;
}

function itemStatsText(item) {
  if (item.slot === "weapon") return `Dano +${formatNumber(item.danoBonus)}`;
  if (item.slot === "body") return `HP +${formatNumber(item.hpBonus)}`;
  if (item.slot === "hands") return `Furto +${formatPercent(item.furtoBonus)}`;
  return Object.entries(item.stats || {})
    .map(([key, value]) => `${statLabel(key)} ${formatStat(key, value)}`)
    .join(" | ");
}

function craftPreviewLine(preview) {
  if (!preview.result) return `<p class="craft-preview">Item no maximo de fusao.</p>`;
  return `
    <p class="craft-preview">
      Fundir: ${preview.count}/${preview.needed} -> ${preview.result.name} | Custo ${money(preview.cost)}
    </p>
  `;
}

function craftCountForItem(player, item) {
  if (!player || !item) return 0;
  return player.inventory.filter((candidate) => (
    candidate &&
    candidate.slot === item.slot &&
    candidate.rarity === item.rarity &&
    Number(candidate.tier) === Number(item.tier) &&
    !candidate.favorite
  )).length;
}

function statLine(label, value) {
  return `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function futureCard(title, text) {
  return `<article class="future-card"><h3>${title}</h3><p>${text}</p></article>`;
}

function hideoutUpgradeRow(item, state) {
  const currentTier = state.player.hideoutItems?.[item.id] || 0;
  const nextTier = Math.min(9, currentTier + 1);
  const maxed = currentTier >= 9;
  const price = hideoutItemCost(item.id, nextTier);
  const canBuy = !maxed && state.player.money >= price;
  return `
    <article class="hideout-upgrade-row">
      <div>
        <h3>${item.name}</h3>
        <p>Tier atual ${currentTier || 0} / 9</p>
      </div>
      <button class="panel-action" data-buy-hideout-item="${item.id}" ${canBuy ? "" : "disabled"}>
        ${maxed ? "Max" : `T${nextTier} ${price}`}
      </button>
    </article>
  `;
}

function hideoutProgressPanel(state) {
  const player = state.player;
  const house = getHouseConfig(player.casaAtual);
  const car = getCarConfig(player.carroAtual);
  const land = getLandConfig(player.terrenoAtual);
  const rechargeCost = getStaminaRechargeCost(player);
  const vault = Math.floor(player.passiveVault?.amount || 0);
  const percent = Math.round(staminaPercent(player));
  const stateLabel = staminaState(player).label;
  return `
    <section class="hideout-status-grid">
      <article>
        <span class="eyebrow">Stamina</span>
        <h3>${Math.floor(player.staminaAtual)} / ${player.staminaMax}</h3>
        <p>${stateLabel} | ${percent}% | Regen ${formatPercentless(player.staminaRegenPorMinuto)}/min</p>
        <button class="panel-action" data-hideout-rest ${house && rechargeCost > 0 && player.money >= rechargeCost ? "" : "disabled"}>
          Descansar ${rechargeCost ? money(rechargeCost) : ""}
        </button>
      </article>
      <article>
        <span class="eyebrow">Casa</span>
        <h3>${house?.name || "Sem casa"}</h3>
        <p>${house ? `+${house.staminaMaxBonus} stamina | +${formatPercentless(house.staminaRegenBonus)}/min` : "Compre uma casa com Seu Zeca."}</p>
        <button class="panel-action" data-hideout-chest ${house ? "" : "disabled"}>Bau</button>
      </article>
      <article>
        <span class="eyebrow">Carro</span>
        <h3>${car?.name || "Sem carro"}</h3>
        <p>${car ? `Furto +${formatPercent(car.furtoBonus)} | Renda ${money(car.passiveIncomePerMinute)}/min` : "Compre um carro com Seu Zeca."}</p>
      </article>
      <article>
        <span class="eyebrow">Terreno</span>
        <h3>${land?.name || "Lote Abandonado"}</h3>
        <p>Renda x${formatPercentless(land?.passiveIncomeMultiplier || 1)} | Offline ${formatPercentless(getOfflineLimitHours(player))}h</p>
      </article>
      <article>
        <span class="eyebrow">Cofre</span>
        <h3>${money(vault)}</h3>
        <p>Renda ${money(getPassiveIncomePerMinute(player))}/min acumulada no esconderijo.</p>
        <button class="panel-action" data-hideout-vault data-vault-collect ${vault > 0 ? "" : "disabled"}>Coletar</button>
      </article>
    </section>
  `;
}

function rangeControl(key, label, value, min, max) {
  return `
    <label class="range-control">
      <span>${label}<strong>${value}</strong></span>
      <input type="range" min="${min}" max="${max}" value="${value}" data-visual-control="${key}">
    </label>
  `;
}

function money(value) {
  return `R$ ${Math.round(value || 0).toLocaleString("pt-BR")}`;
}

function formatNumber(value) {
  return Math.round(value || 0).toLocaleString("pt-BR");
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("pt-BR")}%`;
}

function formatPercentless(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function previewVisualValues(state, visual) {
  const currentMap = MAPS.find((map) => map.id === state.currentMapId) || MAPS[0];
  const mapVisual = visual.maps?.[currentMap.id] || {};
  const playerVisual = visual.players?.[state.selectedPlayerId] || {};
  return {
    mapLabel: currentMap.code,
    playerHeight: Number(visual.playerHeight ?? 78),
    npcHeight: Number(visual.npcHeight ?? 82),
    groundY: Number(mapVisual.groundY ?? visual.groundY ?? 274),
    playerYOffset: Number(playerVisual.y ?? visual.playerYOffset ?? 0),
    npcYOffset: Number(visual.npcYOffset ?? 0),
    cameraLead: Number(visual.cameraLead ?? 280)
  };
}

function logPanel(state) {
  return `
    <section class="log-panel">
      <h3>Ultimos eventos</h3>
      <ul class="event-log">${state.log.map((entry) => `<li>${entry}</li>`).join("")}</ul>
    </section>
  `;
}

function bindClose(container, close) {
  container.querySelectorAll("[data-close-window]").forEach((button) => {
    button.addEventListener("click", close);
  });
}

function attachScrollControls(container) {
  const body = container.querySelector(".window-body");
  if (!body) return;

  container.querySelector(".window-scroll-controls")?.remove();
  const controls = document.createElement("div");
  controls.className = "window-scroll-controls";
  controls.innerHTML = `
    <button type="button" data-scroll-dir="-1" aria-label="Rolar para cima">^</button>
    <button type="button" data-scroll-dir="1" aria-label="Rolar para baixo">v</button>
  `;
  container.append(controls);

  const update = () => {
    const maxScroll = body.scrollHeight - body.clientHeight;
    controls.classList.toggle("hidden-scroll", maxScroll <= 2);
    controls.querySelector('[data-scroll-dir="-1"]').disabled = body.scrollTop <= 2;
    controls.querySelector('[data-scroll-dir="1"]').disabled = body.scrollTop >= maxScroll - 2;
  };

  controls.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = Number(button.dataset.scrollDir);
      body.scrollBy({ top: direction * Math.max(90, body.clientHeight * 0.72), behavior: "smooth" });
      setTimeout(update, 220);
    });
  });

  body.addEventListener("scroll", update);
  requestAnimationFrame(update);
}

function playerRow(state) {
  return PLAYERS.find((player) => player.id === state.selectedPlayerId)?.row || 0;
}
