import { IDLE_MAPS, MAPS, MAP_TIERS } from "../data/maps/index.js?v=petshop-portal-1";
import { DEFAULT_PLAYER_ID, PLAYERS } from "../data/players/index.js?v=players-15";
import { EQUIPMENT_SLOTS, SLOT_LABELS } from "../data/equipment/index.js?v=gloves-1";
import { HIDEOUT_ITEM_TYPES, hideoutItemCost } from "../data/hideoutItems/index.js";
import { calculateStats, formatStat, statLabel } from "../systems/EquipmentSystem/index.js?v=equipment-2";
import { ITEM_STACK_LIMIT, itemQuantity } from "../systems/InventorySystem/index.js?v=stack-1";
import { PETS, PET_UNLOCK_LEVEL, petsUnlocked } from "../data/pets/index.js?v=pets-1";
import {
  assetRequirementText,
  canUnlockAsset,
  getOfflineLimitHours,
  getPassiveIncomePerMinute,
  getStaminaRechargeCost,
  hideoutRestCooldown,
  staminaPercent,
  staminaState
} from "../systems/StaminaSystem/index.js?v=asset-lock-1";
import { getCarConfig, getHouseConfig, getLandConfig } from "../data/balance/index.js?v=asset-lock-1";

const BACKPACK_PAGE_SIZE = 36;
const BACKPACK_PAGE_COUNT = 4;

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
  const selectedEquipmentSlot = state.selectedEquipmentSlot || null;
  const selectedInventoryItem = Number.isInteger(state.selectedInventoryIndex)
    ? player.inventory[state.selectedInventoryIndex]
    : null;
  const selectedEquipmentItem = selectedEquipmentSlot ? player.equipment?.[selectedEquipmentSlot] : null;
  const selectedItem = selectedInventoryItem || selectedEquipmentItem;

  container.innerHTML = `
    ${windowHeader("Equipamento/Mochila", "inventory", { config: true, pets: true })}
    <div class="window-body">
      <div class="equipment-compact">
        <div class="equipment-summary">
          <div class="slot-list compact-slots">
            ${EQUIPMENT_SLOTS.map((slot) => slotTemplate(slot, player.equipment[slot], null, selectedEquipmentSlot)).join("")}
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
                ${lockBadge(selectedItem)}
              </div>
            ` : `<div class="selected-icon gear-square tier-empty"></div>`}
            <div class="selected-copy">
              <span class="eyebrow">Selecionado</span>
              <h3>${selectedItem ? selectedItem.name : "Nenhum item"}</h3>
              <p>${selectedItem ? itemStatsText(selectedItem) : "Toque em um item da mochila."}</p>
            </div>
          </div>
        </div>
        <div class="inventory-action-bar ${selectedItem?.slot === "drug" ? "has-drug-action" : ""}">
          <button class="item-action primary" id="equip-best">Equipar melhor</button>
          <button class="item-action" id="filter-inventory">Filtrar</button>
          ${selectedItem?.slot === "drug" ? `<button class="item-action primary" data-use-selected-drug>Usar</button>` : ""}
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

  renderer.drawPlayerPreview(container.querySelector("#inventory-avatar"), state.selectedPlayerId, "front");

  bindClose(container, callbacks.close);
  container.querySelectorAll(".inventory-cell").forEach((cell) => {
    cell.addEventListener("click", (event) => {
      const index = Number(cell.dataset.index);
      if (event.altKey && player.inventory[index]) {
        event.preventDefault();
        callbacks.toggleInventoryLock(index);
        return;
      }
      callbacks.selectInventory(index);
    });
    cell.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const index = Number(cell.dataset.index);
      if (callbacks.activeRight === "vault" && callbacks.storeInventoryItem) {
        callbacks.storeInventoryItem(index);
        return;
      }
      if (player.inventory[index]?.slot === "drug" && callbacks.useInventoryDrug) {
        callbacks.useInventoryDrug(index);
        return;
      }
      callbacks.equipFromInventory(index);
    });
    cell.addEventListener("dblclick", () => {
      const index = Number(cell.dataset.index);
      if (player.inventory[index]?.slot === "drug" && callbacks.useInventoryDrug) callbacks.useInventoryDrug(index);
    });
    cell.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", cell.dataset.index));
    cell.addEventListener("dragover", (event) => event.preventDefault());
    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      callbacks.moveInventory(Number(event.dataTransfer.getData("text/plain")), Number(cell.dataset.index));
    });
  });

  container.querySelectorAll(".slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      if (slot.classList.contains("tier-empty")) return;
      callbacks.selectEquipment?.(slot.dataset.slot);
    });
    slot.addEventListener("dragover", (event) => event.preventDefault());
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      callbacks.equipFromInventory(Number(event.dataTransfer.getData("text/plain")));
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
  container.querySelector("[data-use-selected-drug]")?.addEventListener("click", () => callbacks.useInventoryDrug?.(state.selectedInventoryIndex));
  container.querySelector("[data-open-config]")?.addEventListener("click", callbacks.openConfig);
  container.querySelector("[data-open-pets]")?.addEventListener("click", callbacks.openPets);
  bindBackpackPages(container, callbacks.selectBackpackPage);
  container.querySelectorAll("[data-master-tab]").forEach((button) => {
    button.addEventListener("click", () => callbacks.openTab(button.dataset.masterTab));
  });
}

export function renderVaultWindow(container, state, callbacks) {
  const player = state.player;
  const vault = player.personalVault || { money: 0, items: [] };
  const items = vault.items || [];
  const selectedItem = Number.isInteger(state.selectedVaultIndex)
    ? items[state.selectedVaultIndex]
    : null;
  const vaultMoney = Math.floor(vault.money || 0);
  const walletMoney = Math.floor(player.money || 0);

  container.innerHTML = `
    ${windowHeader("Cofre do Jogador", "vault")}
    <div class="window-body vault-window-body">
      <div class="vault-layout">
        <section class="vault-money-panel">
          <div class="vault-money-values">
            <div>
              <span class="eyebrow">Carteira</span>
              <strong>${money(walletMoney)}</strong>
            </div>
            <div>
              <span class="eyebrow">Cofre</span>
              <strong>${money(vaultMoney)}</strong>
            </div>
          </div>
          <div class="vault-money-form">
            <input id="vault-money-input" type="number" min="1" step="1" inputmode="numeric" placeholder="Valor">
            <button type="button" class="panel-action" data-vault-deposit ${walletMoney > 0 ? "" : "disabled"}>Depositar</button>
            <button type="button" class="panel-action" data-vault-withdraw ${vaultMoney > 0 ? "" : "disabled"}>Sacar</button>
            <button type="button" class="panel-action" data-vault-deposit-all ${walletMoney > 0 ? "" : "disabled"}>Tudo</button>
          </div>
        </section>

        <section class="selected-panel vault-selected">
          ${selectedItem ? `
            <div class="selected-icon gear-square ${tierClass(selectedItem)}">
              ${gearIcon(selectedItem)}
              <small>${tierLabel(selectedItem)}</small>
              ${lockBadge(selectedItem)}
            </div>
          ` : `<div class="selected-icon gear-square tier-empty"></div>`}
          <div class="selected-copy">
            <span class="eyebrow">Selecionado</span>
            <h3>${selectedItem ? selectedItem.name : "Nenhum item"}</h3>
            <p>${selectedItem ? itemStatsText(selectedItem) : "Cofre vazio ou sem selecao."}</p>
          </div>
        </section>

        <div class="backpack-header vault-header">
          <span class="eyebrow">Itens</span>
          <strong>${items.filter(Boolean).length} / ${items.length}</strong>
        </div>
        <div class="inventory-grid compact-inventory vault-grid">
          ${items.map((item, index) => vaultCell(item, index, state.selectedVaultIndex)).join("")}
        </div>
      </div>
    </div>
  `;

  bindClose(container, callbacks.close);

  const moneyInput = container.querySelector("#vault-money-input");
  container.querySelector("[data-vault-deposit]")?.addEventListener("click", () => {
    callbacks.depositVaultMoney(Number(moneyInput?.value || 0));
  });
  container.querySelector("[data-vault-withdraw]")?.addEventListener("click", () => {
    callbacks.withdrawVaultMoney(Number(moneyInput?.value || 0));
  });
  container.querySelector("[data-vault-deposit-all]")?.addEventListener("click", () => {
    callbacks.depositVaultMoney(walletMoney);
  });

  container.querySelectorAll(".vault-cell").forEach((cell) => {
    cell.addEventListener("click", () => callbacks.selectVaultItem(Number(cell.dataset.vaultIndex)));
    cell.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      callbacks.withdrawVaultItem(Number(cell.dataset.vaultIndex));
    });
    cell.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", `vault:${cell.dataset.vaultIndex}`);
    });
    cell.addEventListener("dragover", (event) => event.preventDefault());
    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = event.dataTransfer.getData("text/plain");
      const targetIndex = Number(cell.dataset.vaultIndex);
      if (payload.startsWith("vault:")) {
        callbacks.moveVaultItem(Number(payload.slice(6)), targetIndex);
        return;
      }
      callbacks.storeInventoryItem(Number(payload), targetIndex);
    });
  });
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

export function renderPanel(container, type, state, renderer, callbacks) {
  const titles = {
    assaults: "Assaltos",
    city: "Cidade",
    hideout: "Esconderijo",
    pets: "Pets",
    faction: "Faccao"
  };
  const preservedControls = capturePanelControls(container);

  container.innerHTML = `
    ${windowHeader(titles[type] || "Painel", type)}
    <div class="window-body">
      ${panelBody(type, state, callbacks.onlineSnapshot?.(), callbacks.factionSnapshot?.())}
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
  container.querySelectorAll("[data-idle-map-thumb]").forEach((canvas) => {
    renderer.drawMapThumb(canvas, IDLE_MAPS.find((map) => map.id === canvas.dataset.idleMapThumb));
  });

  container.querySelector("[data-return-city]")?.addEventListener("click", callbacks.enterCity);
  container.querySelectorAll("[data-enter-idle-map]").forEach((button) => {
    button.addEventListener("click", () => callbacks.enterIdleMap(button.dataset.enterIdleMap));
  });
  container.querySelector("[data-online-connect]")?.addEventListener("click", callbacks.onlineConnect);
  container.querySelector("[data-online-disconnect]")?.addEventListener("click", callbacks.onlineDisconnect);
  container.querySelectorAll("[data-shop-visit]").forEach((button) => {
    button.addEventListener("click", () => callbacks.visitShop(button.dataset.shopVisit));
  });
  container.querySelectorAll("[data-buy-hideout-item]").forEach((button) => {
    button.addEventListener("click", () => callbacks.buyHideoutItem(button.dataset.buyHideoutItem));
  });
  container.querySelector("[data-hideout-rest]")?.addEventListener("click", callbacks.restNow);
  container.querySelector("[data-vault-collect]")?.addEventListener("click", callbacks.collectVault);
  container.querySelector("#city-chat-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = container.querySelector("#city-chat-input");
    callbacks.sendChat(input.value);
    input.value = "";
  });
  if (type === "faction") bindFactionControls(container, callbacks);
  if (type === "pets") bindPetControls(container, renderer, callbacks);
  restorePanelControls(container, preservedControls);
}

export function renderConfigWindow(container, state, callbacks) {
  const account = callbacks.account || {};
  const isGuest = Boolean(account.isGuest ?? state.player?.isGuest);
  const isLoggedIn = Boolean(account.isLoggedIn ?? state.player?.playerId);
  const accountName = account.displayName || account.username || state.player?.displayName || state.player?.username || "jogador";
  container.innerHTML = `
    ${windowHeader("Configs", "configs")}
    <div class="window-body">
      ${isGuest ? `
        <section class="guest-warning-panel">
          Voce esta jogando sem login. Crie uma conta para proteger seu progresso.
        </section>
      ` : ""}
      <section class="account-config-panel">
        <span class="eyebrow">Conta</span>
        ${isGuest ? `
          <form class="account-create-form" data-config-create-account>
            <label><span>Usuario</span><input name="username" autocomplete="username"></label>
            <label><span>Senha</span><input name="password" type="password" autocomplete="new-password"></label>
            <label><span>Confirmar senha</span><input name="confirmation" type="password" autocomplete="new-password"></label>
            <button type="submit" class="panel-action">Criar conta</button>
          </form>
        ` : isLoggedIn ? `
          <p>Conectado como <strong>${escapeHtml(accountName)}</strong>.</p>
          <button type="button" class="panel-action" data-config-logout>Desconectar</button>
        ` : `
          <p>Preview local sem conta conectada.</p>
        `}
      </section>
      <div class="inventory-tools">
        <button class="panel-action primary-action" id="config-save">Forcar salvamento</button>
      </div>
      <section class="reset-config-panel">
        <div>
          <span class="eyebrow">Progresso</span>
          <p>Volta o jogador para o inicio e apaga o progresso salvo desta conta.</p>
        </div>
        <button type="button" class="panel-action danger-action" id="config-reset-open">Começar do Zero</button>
        <form class="reset-confirm-form hidden" data-config-reset-form>
          <label>
            <span>Digite confirmar</span>
            <input name="confirmation" autocomplete="off" data-config-reset-input>
          </label>
          <div class="reset-confirm-actions">
            <button type="button" class="panel-action secondary-action" data-config-reset-cancel>Cancelar</button>
            <button type="submit" class="panel-action danger-action" data-config-reset-confirm disabled>Confirmar reset</button>
          </div>
        </form>
      </section>
    </div>
  `;

  bindClose(container, callbacks.close);
  attachScrollControls(container);
  container.querySelector("#config-save")?.addEventListener("click", callbacks.save);
  container.querySelector("[data-config-create-account]")?.addEventListener("submit", callbacks.createAccount);
  container.querySelector("[data-config-logout]")?.addEventListener("click", callbacks.logout);
  bindResetControls(container, callbacks.resetGame);
}

function bindResetControls(container, resetGame) {
  const openButton = container.querySelector("#config-reset-open");
  const form = container.querySelector("[data-config-reset-form]");
  const input = container.querySelector("[data-config-reset-input]");
  const confirmButton = container.querySelector("[data-config-reset-confirm]");

  const syncConfirm = () => {
    const allowed = String(input?.value || "").trim().toLowerCase() === "confirmar";
    if (confirmButton) confirmButton.disabled = !allowed;
  };

  openButton?.addEventListener("click", () => {
    form?.classList.remove("hidden");
    openButton.disabled = true;
    window.setTimeout(() => input?.focus(), 0);
    syncConfirm();
  });

  container.querySelector("[data-config-reset-cancel]")?.addEventListener("click", () => {
    form?.reset();
    form?.classList.add("hidden");
    if (openButton) openButton.disabled = false;
    syncConfirm();
  });

  input?.addEventListener("input", syncConfirm);
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (confirmButton?.disabled) return;
    resetGame?.();
  });
}

export function renderCharacterSelect(container, renderer, onSelect, initialPlayerId = DEFAULT_PLAYER_ID) {
  let selectedIndex = Math.max(0, PLAYERS.findIndex((player) => player.id === initialPlayerId));

  const render = () => {
    const player = PLAYERS[selectedIndex] || PLAYERS[0];
    container.innerHTML = `
      <section class="character-carousel" data-current-player="${escapeAttribute(player.id)}">
        <button type="button" class="character-arrow" data-character-prev aria-label="Personagem anterior">‹</button>
        <div class="character-spotlight">
          <canvas width="220" height="260" data-character-preview="${escapeAttribute(player.id)}"></canvas>
          <div class="character-selected-copy">
            <span class="eyebrow">${selectedIndex + 1} / ${PLAYERS.length}</span>
            <h3>${escapeHtml(player.name)}</h3>
            <p><strong>${escapeHtml(player.title)}</strong><br>${escapeHtml(player.description)}</p>
          </div>
          <button type="button" class="primary-action" data-player="${escapeAttribute(player.id)}">Escolher</button>
        </div>
        <button type="button" class="character-arrow" data-character-next aria-label="Proximo personagem">›</button>
      </section>
    `;

    renderer.drawPlayerPreview(container.querySelector("[data-character-preview]"), player.id, "front");
    container.querySelector("[data-character-prev]")?.addEventListener("click", () => {
      selectedIndex = (selectedIndex - 1 + PLAYERS.length) % PLAYERS.length;
      render();
    });
    container.querySelector("[data-character-next]")?.addEventListener("click", () => {
      selectedIndex = (selectedIndex + 1) % PLAYERS.length;
      render();
    });
    container.querySelector("[data-player]")?.addEventListener("click", () => onSelect(player.id));
  };

  render();
}

function panelBody(type, state, online, faction) {
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
    const petshop = IDLE_MAPS.find((map) => map.id === "petshop");
    return `
      ${onlineCityPanel(online)}
      <div class="map-list">
        <article class="map-row">
          <canvas class="map-thumb" width="108" height="84" data-idle-map-thumb="${petshop?.id || "petshop"}"></canvas>
          <div>
            <h3>${petshop?.name || "Petshop"}</h3>
            <p>${petshop?.description || "Area reservada para pets."}</p>
          </div>
          <button class="panel-action" data-enter-idle-map="petshop">Entrar</button>
        </article>
      </div>
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

  if (type === "pets") {
    return petInventoryPanel(state);
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

  return factionPanel(faction);
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
  const cityPlayers = snapshot.cityPlayers || [];
  return `
    <section class="online-panel">
      <div class="online-header">
        <div>
          <span class="eyebrow">Cidade online</span>
          <h3>${onlineStatusLabel(snapshot.status)}</h3>
          <small>${snapshot.provider === "supabase" ? "Servidor da cidade" : "Servidor local"}</small>
          <p>${isOnline ? `${snapshot.players.length} conexao(oes), ${cityPlayers.length} visivel(eis) para voce.` : "A cidade roda offline ate conectar o servidor."}</p>
        </div>
        <button class="panel-action" ${isOnline ? "data-online-disconnect" : "data-online-connect"}>
          ${isOnline ? "Sair" : "Conectar"}
        </button>
      </div>
      <div class="online-grid">
        <article>
          <h4>Players</h4>
          <ul>${listOrEmpty(cityPlayers.map((player) => `${escapeHtml(player.playerName)} - ${escapeHtml(player.characterId)}`), "Nenhum player visivel.")}</ul>
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
    "missing-config": "Configurar servidor",
    unsupported: "Indisponivel"
  }[status] || "Offline";
}

function petInventoryPanel(state) {
  const ownedPets = PETS.filter((pet) => state.player?.petsOwned?.includes(pet.id));
  if (!petsUnlocked(state.player)) {
    return `
      <section class="pet-empty-panel">
        <span class="eyebrow">Pets</span>
        <h3>Liberado no nivel ${PET_UNLOCK_LEVEL}</h3>
        <p>Quando chegar la, o Pinscher entra de graca para acompanhar voce.</p>
      </section>
    `;
  }

  if (!ownedPets.length) {
    return `
      <section class="pet-empty-panel">
        <span class="eyebrow">Pets</span>
        <h3>Nenhum pet comprado</h3>
        <p>Visite o petshop para resgatar ou comprar um companheiro.</p>
      </section>
    `;
  }

  return `
    <div class="pet-owned-list">
      ${ownedPets.map((pet) => petOwnedRow(state, pet)).join("")}
    </div>
  `;
}

function petOwnedRow(state, pet) {
  const equipped = state.player.equippedPetId === pet.id;
  return `
    <article class="pet-row">
      <canvas class="pet-preview" width="84" height="72" data-pet-preview="${pet.id}"></canvas>
      <div>
        <h3>${escapeHtml(pet.name)}</h3>
        <p>${Math.round(pet.dpsPercent * 1000) / 10}% do DPS | ${pet.cooldown.toFixed(2)}s</p>
        <small>${escapeHtml(pet.attackLabel)}</small>
      </div>
      <button type="button" class="panel-action" ${equipped ? "data-unequip-pet" : `data-equip-pet="${pet.id}"`}>
        ${equipped ? "Desequipar" : "Equipar"}
      </button>
    </article>
  `;
}

function bindPetControls(container, renderer, callbacks) {
  container.querySelectorAll("[data-pet-preview]").forEach((canvas) => {
    renderer.drawPetPreview(canvas, canvas.dataset.petPreview);
  });
  container.querySelectorAll("[data-equip-pet]").forEach((button) => {
    button.addEventListener("click", () => callbacks.equipPet?.(button.dataset.equipPet));
  });
  container.querySelector("[data-unequip-pet]")?.addEventListener("click", () => callbacks.unequipPet?.());
}

function factionPanel(snapshot) {
  const data = snapshot || {
    factions: [],
    membership: null,
    faction: null,
    members: [],
    playerRole: null
  };

  if (!data.membership || !data.faction) return factionDiscoveryPanel(data);
  return factionMemberPanel(data);
}

function factionDiscoveryPanel(data) {
  const factions = data.factions || [];
  return `
    <section class="faction-panel">
      <div class="online-header">
        <div>
          <span class="eyebrow">Faccao</span>
          <h3>Faccaoes</h3>
          <p>Entre numa faccao ou crie a sua. Por enquanto e so o comeco da organizacao.</p>
        </div>
        <button type="button" class="panel-action" data-refresh-factions>Atualizar Lista</button>
      </div>

      <form class="faction-form" data-create-faction>
        <input name="name" maxlength="24" placeholder="Nome da faccao">
        <input name="tag" maxlength="5" placeholder="Sigla">
        <textarea name="description" maxlength="100" placeholder="Descricao curta"></textarea>
        <button type="submit" class="panel-action">Criar Faccao</button>
      </form>

      <div class="faction-list">
        <span class="eyebrow">Procurar Faccao</span>
        ${factions.length ? factions.map((faction) => `
          <article class="faction-row">
            <div>
              <h3>${escapeHtml(faction.name)} <small>[${escapeHtml(faction.tag)}]</small></h3>
              <p>${escapeHtml(faction.description || "Sem descricao.")}</p>
              <small>${faction.memberCount} membro(s) | Lider ${escapeHtml(faction.leaderName)}</small>
            </div>
            <button type="button" class="panel-action" data-join-faction="${escapeHtml(faction.id)}">Entrar</button>
          </article>
        `).join("") : `<article class="faction-row empty"><p>Nenhuma faccao criada ainda.</p></article>`}
      </div>
    </section>
  `;
}

function factionMemberPanel(data) {
  const faction = data.faction;
  const isLeader = data.playerRole === "leader";
  const members = data.members || [];
  return `
    <section class="faction-panel">
      <div class="faction-profile">
        <div>
          <span class="eyebrow">Sua Faccao</span>
          <h3>${escapeHtml(faction.name)} <small>[${escapeHtml(faction.tag)}]</small></h3>
          <p>${escapeHtml(faction.description || "Sem descricao.")}</p>
        </div>
        <div>
          <strong>${faction.memberCount}</strong>
          <span>membro(s)</span>
        </div>
      </div>

      <div class="faction-details">
        <article><span>Lider</span><strong>${escapeHtml(faction.leaderName)}</strong></article>
        <article><span>Seu cargo</span><strong>${roleLabel(data.playerRole)}</strong></article>
      </div>

      <div class="faction-members">
        <span class="eyebrow">Membros</span>
        ${members.map((member) => `
          <div class="faction-member-row">
            <span>${escapeHtml(member.playerName)} <small>${roleLabel(member.role)}</small></span>
            ${isLeader && member.role !== "leader" ? `
              <button type="button" class="item-action" data-kick-member="${escapeHtml(member.playerId)}">Expulsar</button>
            ` : ""}
          </div>
        `).join("")}
      </div>

      ${isLeader ? `
        <form class="faction-form" data-edit-faction>
          <input name="name" maxlength="24" value="${escapeAttribute(faction.name)}" placeholder="Nome da faccao">
          <input name="tag" maxlength="5" value="${escapeAttribute(faction.tag)}" placeholder="Sigla">
          <textarea name="description" maxlength="100" placeholder="Descricao curta">${escapeHtml(faction.description || "")}</textarea>
          <button type="submit" class="panel-action">Editar Faccao</button>
        </form>
      ` : ""}

      <div class="inventory-tools">
        <button type="button" class="panel-action" data-leave-faction>Sair da Faccao</button>
      </div>
    </section>
  `;
}

function bindFactionControls(container, callbacks) {
  container.querySelector("[data-refresh-factions]")?.addEventListener("click", callbacks.refreshFactions);
  container.querySelector("[data-create-faction]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    callbacks.createFaction?.(formData(form));
  });
  container.querySelector("[data-edit-faction]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    callbacks.editFaction?.(formData(form));
  });
  container.querySelectorAll("[data-join-faction]").forEach((button) => {
    button.addEventListener("click", () => callbacks.joinFaction?.(button.dataset.joinFaction));
  });
  container.querySelector("[data-leave-faction]")?.addEventListener("click", callbacks.leaveFaction);
  container.querySelectorAll("[data-kick-member]").forEach((button) => {
    button.addEventListener("click", () => callbacks.kickFactionMember?.(button.dataset.kickMember));
  });
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function capturePanelControls(container) {
  const controls = [...container.querySelectorAll("input, textarea, select")];
  if (!controls.length) return null;

  const activeElement = document.activeElement;
  return {
    activeKey: controls.includes(activeElement) ? panelControlKey(activeElement, controls.indexOf(activeElement)) : null,
    entries: controls.map((control, index) => {
      const selection = controlSelection(control);
      return {
        key: panelControlKey(control, index),
        value: control.value,
        checked: Boolean(control.checked),
        selectionStart: selection.start,
        selectionEnd: selection.end
      };
    })
  };
}

function restorePanelControls(container, snapshot) {
  if (!snapshot?.entries?.length) return;
  const controls = [...container.querySelectorAll("input, textarea, select")];
  if (!controls.length) return;

  const byKey = new Map(snapshot.entries.map((entry) => [entry.key, entry]));
  let focusTarget = null;
  let focusEntry = null;

  controls.forEach((control, index) => {
    const key = panelControlKey(control, index);
    const entry = byKey.get(key);
    if (!entry) return;
    if (control.type === "checkbox" || control.type === "radio") {
      control.checked = entry.checked;
    } else {
      control.value = entry.value;
    }
    if (key === snapshot.activeKey) {
      focusTarget = control;
      focusEntry = entry;
    }
  });

  if (!focusTarget) return;
  focusTarget.focus({ preventScroll: true });
  if (
    focusEntry &&
    Number.isInteger(focusEntry.selectionStart) &&
    Number.isInteger(focusEntry.selectionEnd) &&
    typeof focusTarget.setSelectionRange === "function"
  ) {
    focusTarget.setSelectionRange(focusEntry.selectionStart, focusEntry.selectionEnd);
  }
}

function panelControlKey(control, index) {
  const form = control.closest("form");
  const formKey = form
    ? form.id || [...form.attributes].find((attribute) => attribute.name.startsWith("data-"))?.name || "form"
    : "panel";
  const controlKey = control.id || control.name || [...control.attributes].find((attribute) => attribute.name.startsWith("data-"))?.name || index;
  return `${formKey}:${controlKey}`;
}

function controlSelection(control) {
  try {
    return {
      start: Number.isInteger(control.selectionStart) ? control.selectionStart : null,
      end: Number.isInteger(control.selectionEnd) ? control.selectionEnd : null
    };
  } catch {
    return { start: null, end: null };
  }
}

function roleLabel(role) {
  return role === "leader" ? "Lider" : "Membro";
}

function listOrEmpty(items, empty) {
  return items.length ? items.map((item) => `<li>${item}</li>`).join("") : `<li>${empty}</li>`;
}

function windowHeader(title, name, actions = {}) {
  return `
    <header class="window-header">
      <h2>${title}</h2>
      <div class="window-actions">
        ${actions.pets ? `<button type="button" class="pet-button" data-open-pets aria-label="Abrir pets" title="Pets"><span class="pet-paw-icon" aria-hidden="true"></span></button>` : ""}
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

function slotTemplate(slot, item, accessoryIndex = null, selectedSlot = null) {
  const label = slot === "accessory"
    ? `${SLOT_LABELS[slot]} ${accessoryIndex + 1}`
    : SLOT_LABELS[slot];
  const selected = selectedSlot === slot ? " selected" : "";
  return `
    <div class="slot gear-square${selected} ${item ? tierClass(item) : "tier-empty"}" title="${item ? `${label}: ${item.name}` : `${label}: Vazio`}" data-slot="${slot}" ${accessoryIndex !== null ? `data-accessory-index="${accessoryIndex}"` : ""}>
      ${gearIcon(item || slot)}
      <small>${item ? tierLabel(item) : shortSlotLabel(slot, accessoryIndex)}</small>
    </div>
  `;
}

function inventoryCell(item, index, selectedIndex, player) {
  if (!item) return `<div class="inventory-cell gear-square empty tier-empty" data-index="${index}"></div>`;
  const count = stackCountForItem(item);
  return `
    <div class="inventory-cell gear-square ${selectedIndex === index ? "selected" : ""} ${item.favorite ? "locked" : ""} ${tierClass(item)}" title="${item.name}${item.favorite ? " | Bloqueado para venda" : ""}" data-index="${index}" data-rarity="${item.rarity}" draggable="true">
      ${gearIcon(item)}
      <small>${tierLabel(item)}</small>
      ${lockBadge(item)}
      ${count >= 2 ? `<em class="craft-count">${Math.min(count, ITEM_STACK_LIMIT)}/${ITEM_STACK_LIMIT}</em>` : ""}
    </div>
  `;
}

function vaultCell(item, index, selectedIndex) {
  if (!item) {
    return `<div class="inventory-cell vault-cell gear-square empty tier-empty" data-vault-index="${index}"></div>`;
  }
  return `
    <div class="inventory-cell vault-cell gear-square ${selectedIndex === index ? "selected" : ""} ${item.favorite ? "locked" : ""} ${tierClass(item)}" title="${item.name}${item.favorite ? " | Bloqueado para venda" : ""}" data-vault-index="${index}" data-rarity="${item.rarity}" draggable="true">
      ${gearIcon(item)}
      <small>${tierLabel(item)}</small>
      ${lockBadge(item)}
      ${stackCountForItem(item) >= 2 ? `<em class="craft-count">${Math.min(stackCountForItem(item), ITEM_STACK_LIMIT)}/${ITEM_STACK_LIMIT}</em>` : ""}
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

function lockBadge(item) {
  return item?.favorite ? `<i class="item-lock-badge" aria-hidden="true"></i>` : "";
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
  if (item?.slot === "drug") return "uso";
  return `t${Math.max(1, Math.min(4, Number(item?.tier) || 1))}`;
}

function itemStatsText(item) {
  if (item.slot === "drug") return item.effectText || "Item de uso.";
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

function stackCountForItem(item) {
  return itemQuantity(item);
}

function statLine(label, value) {
  return `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function futureCard(title, text) {
  return `<article class="future-card"><h3>${title}</h3><p>${text}</p></article>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
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
  const restCooldown = hideoutRestCooldown(player);
  const canRestNow = Boolean(house && rechargeCost > 0 && player.money >= rechargeCost && restCooldown.ready);
  const vault = Math.floor(player.passiveVault?.amount || 0);
  const percent = Math.round(staminaPercent(player));
  const stateLabel = staminaState(player).label;
  return `
    <section class="hideout-status-grid">
      <article>
        <span class="eyebrow">Stamina</span>
        <h3>${Math.floor(player.staminaAtual)} / ${player.staminaMax}</h3>
        <p>${stateLabel} | ${percent}% | Regen ${formatPercentless(player.staminaRegenPorMinuto)}/min</p>
        <button class="panel-action" data-hideout-rest ${canRestNow ? "" : "disabled"}>
          ${hideoutRestButtonLabel(player, house, rechargeCost, restCooldown)}
        </button>
      </article>
      <article>
        <span class="eyebrow">Casa</span>
        <h3>${house?.name || "Sem casa"}</h3>
        <p>${house ? `+${house.staminaMaxBonus} stamina | +${formatPercentless(house.staminaRegenBonus)}/min` : "Compre uma casa com Seu Zeca."}</p>
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
        <span class="eyebrow">Renda</span>
        <h3>${money(vault)}</h3>
        <p>Renda ${money(getPassiveIncomePerMinute(player))}/min acumulada no esconderijo.</p>
        <button class="panel-action" data-vault-collect ${vault > 0 ? "" : "disabled"}>Coletar</button>
      </article>
    </section>
  `;
}

function hideoutRestButtonLabel(player, house, rechargeCost, cooldown) {
  if (!house) return "Sem casa";
  if (rechargeCost <= 0) return "Stamina cheia";
  if (!cooldown.ready) return `Aguardar ${compactDuration(cooldown.remainingMs)}`;
  if (player.money < rechargeCost) return `Precisa ${money(rechargeCost)}`;
  return `Descansar ${money(rechargeCost)}`;
}

function compactDuration(ms) {
  const totalSeconds = Math.max(1, Math.ceil(Number(ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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
  const currentMap = state.scene === "idle"
    ? IDLE_MAPS.find((map) => map.id === state.currentMapId) || IDLE_MAPS[0]
    : MAPS.find((map) => map.id === state.currentMapId) || MAPS[0];
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
