const TUTORIAL_VERSION = 3;

const FINAL_STEP = "tutorial_complete";

const WRONG_ACTION_LINES = [
  "Calma, artista. Nao e ai ainda.",
  "Esse corre fica pra depois.",
  "Primeiro faz o basico, genio.",
  "Boa tentativa, mas o tutorial viu.",
  "Segura a ansiedade, pivete."
];

export const CHARACTER_SELECT_TUTORIAL = {
  id: "character_select",
  message: "Escolhe tua identidade... mas depois nao vem chorar querendo trocar, hein?",
  buttonLabel: "Fechou",
  target: "character_grid",
  allowSkip: false
};

export const TUTORIAL_STEPS = [
  {
    id: "character_selected",
    message: "Boa, pivete. Agora segura a bronca.",
    buttonLabel: "Partiu",
    target: "character_modal",
    next: "city_welcome"
  },
  {
    id: "city_welcome",
    message: "Bem-vindo a pista. Aqui ninguem te da nada de graca.",
    buttonLabel: "Ja gostei",
    target: "stage",
    allowSkip: true,
    next: "almeida_intro"
  },
  {
    id: "almeida_intro",
    message: "Ta vendo esse cidadao? Compra de tudo. Ate coisa que nem ele sabe pra que serve.",
    buttonLabel: "Quem e esse?",
    target: "npc_almeida",
    allowSkip: true,
    next: "almeida_click"
  },
  {
    id: "almeida_click",
    message: "Clica no Sr. Almeida e troca uma ideia.",
    buttonLabel: "Vai la nele",
    target: "npc_almeida",
    actionRequired: "click_npc_almeida",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "almeida_window",
    message: "Esse e o Almeida. Compra tua tralha e ainda faz cara de honesto.",
    buttonLabel: "Boa",
    target: "city_shop_panel",
    allowSkip: true,
    next: "vendedor_intro"
  },
  {
    id: "almeida_sell",
    message: "Esse botao transforma bagunca em dindin. Simples, rapido e sem recibo.",
    buttonLabel: "Gostei",
    target: "shop_sell_all",
    allowSkip: true,
    next: "vendedor_intro"
  },
  {
    id: "vendedor_intro",
    message: "Agora olha o Vendedor. Item aleatorio, venda e fusao moram na banca dele.",
    buttonLabel: "Bora no vendedor",
    target: "npc_vendedor",
    allowSkip: true,
    next: "vendedor_click"
  },
  {
    id: "vendedor_click",
    message: "Clica no Vendedor e ve o balcao da sorte.",
    buttonLabel: "Falar com Vendedor",
    target: "npc_vendedor",
    actionRequired: "click_npc_vendedor",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "vendedor_window",
    message: "Esse ai vende item aleatorio, compra tralha e funde repetido. Cassino com balcao.",
    buttonLabel: "Entendi",
    target: "city_shop_panel",
    allowSkip: true,
    next: "vendedor_buy"
  },
  {
    id: "vendedor_buy",
    message: "Itens aleatorios: tu paga, ele entrega surpresa. Pode vir ouro, pode vir dor.",
    buttonLabel: "Boa",
    target: "shop_buy",
    allowSkip: true,
    next: "vendedor_sell"
  },
  {
    id: "vendedor_sell",
    message: "Vender Tudo transforma mochila baguncada em dinheiro. So confere antes de torrar reliquia.",
    buttonLabel: "Gostei",
    target: "shop_sell_all",
    allowSkip: true,
    next: "vendedor_craft"
  },
  {
    id: "vendedor_craft",
    message: "Juntou 4 iguais da mesma raridade? O Vendedor funde e tenta puxar coisa melhor.",
    buttonLabel: "Brabo",
    target: "shop_craft",
    allowSkip: true,
    next: "zeca_intro"
  },
  {
    id: "zeca_intro",
    message: "Agora cola no Seu Zeca. O velho sabe mais da quebrada que camera de seguranca.",
    buttonLabel: "Bora no velho",
    target: "npc_zeca",
    allowSkip: true,
    next: "zeca_click"
  },
  {
    id: "zeca_click",
    message: "Clica no Seu Zeca pra ouvir umas verdades.",
    buttonLabel: "Falar com Zeca",
    target: "npc_zeca",
    actionRequired: "click_npc_zeca",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "zeca_dialog_1",
    message: "Fiquei sabendo que tu e o novo bagunceiro da comunidade.",
    buttonLabel: "Eita",
    target: "city_shop_panel",
    allowSkip: true,
    next: "zeca_dialog_2"
  },
  {
    id: "zeca_dialog_2",
    message: "Presta atencao: na pista, quem anda fazendo barulho vira sirene.",
    buttonLabel: "To esperto",
    target: "city_shop_panel",
    allowSkip: true,
    next: "zeca_dialog_3"
  },
  {
    id: "zeca_dialog_3",
    message: "Se precisar de uns achados, fala comigo. Tenho coisa boa e coisa que eu nem pergunto.",
    buttonLabel: "Mostra ai",
    target: "city_shop_panel",
    allowSkip: true,
    next: "zeca_land_mode"
  },
  {
    id: "zeca_land_mode",
    message: "Primeiro tu precisa de um pedaco de chao. Sem terreno, tu e so turista com problema.",
    buttonLabel: "Comprar terreno",
    target: "shop_land_mode",
    actionRequired: "open_land_shop",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "zeca_buy_land",
    message: "Compra o chao primeiro. Mansao no ar so existe em golpe.",
    buttonLabel: "Comprar terreno",
    target: "land_t1",
    actionRequired: "buy_land_1",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "zeca_land_done",
    message: "Agora sim. Um cantinho pra chamar de seu... mesmo que ainda pareca mato.",
    buttonLabel: "Boa",
    target: "land_t1",
    allowSkip: true,
    next: "zeca_buy_house"
  },
  {
    id: "zeca_buy_house",
    message: "Terreno vazio nao esconde ninguem. Compra uma casinha antes que a chuva cobre aluguel.",
    buttonLabel: "Comprar casa",
    target: "house_t1",
    actionRequired: "buy_house_1",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "zeca_house_done",
    message: "Lar doce lar. Meio torto, meio suspeito, mas e teu.",
    buttonLabel: "Fechou",
    target: "house_t1",
    allowSkip: true,
    next: "zeca_buy_car"
  },
  {
    id: "zeca_buy_car",
    message: "Agora falta um possante. Nao e bonito, mas anda. As vezes.",
    buttonLabel: "Comprar carro",
    target: "car_t1",
    actionRequired: "buy_car_1",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "zeca_car_done",
    message: "Terreno, casa e caranga. Ja da pra fingir que ta tudo sob controle.",
    buttonLabel: "Partiu",
    target: "car_t1",
    allowSkip: true,
    next: "hideout_portal_intro"
  },
  {
    id: "hideout_portal_intro",
    message: "Ta vendo aquela fumaca suspeita? E teu esconderijo chamando.",
    buttonLabel: "Meu esconderijo?",
    target: "portal_hideout",
    allowSkip: true,
    next: "hideout_portal_click"
  },
  {
    id: "hideout_portal_click",
    message: "Clica no portal pra conhecer teu canto.",
    buttonLabel: "Ir pro esconderijo",
    target: "portal_hideout",
    actionRequired: "click_city_hideout_portal",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "hideout_welcome",
    message: "Esse aqui e teu esconderijo. Por enquanto, ninguem enche teu saco.",
    buttonLabel: "Gostei daqui",
    target: "stage",
    allowSkip: true,
    next: "hideout_storage_intro"
  },
  {
    id: "hideout_storage_intro",
    message: "Aqui tu descansa, guarda item bom e esconde dinheiro. Quase ninguem mexe.",
    buttonLabel: "Quase?",
    target: "hideout_house",
    allowSkip: true,
    next: "hideout_house_click"
  },
  {
    id: "hideout_house_click",
    message: "Clica na casa. E la que fica o esquema de guardar tuas coisas.",
    buttonLabel: "Abrir casa",
    target: "hideout_house",
    actionRequired: "click_hideout_house",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "hideout_chest",
    message: "Bau e pra guardar item valioso. Andar com tudo no bolso e pedir pra perder.",
    buttonLabel: "Entendi",
    target: "hideout_chest",
    allowSkip: true,
    next: "hideout_vault"
  },
  {
    id: "hideout_vault",
    message: "Cofre e pra guardar dinheiro. Debaixo do colchao e classico, aqui e mais seguro.",
    buttonLabel: "Boa",
    target: "hideout_vault",
    allowSkip: true,
    next: "hideout_return_click"
  },
  {
    id: "hideout_return_click",
    message: "Agora que tu ja viu o cafofo, bora voltar pra pista levantar uma grana.",
    buttonLabel: "Voltar pra cidade",
    target: "portal_city_return",
    actionRequired: "click_hideout_return_portal",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "city_back_intro",
    message: "Chega de passeio. Agora e hora de fazer dinheiro.",
    buttonLabel: "Bora",
    target: "portal_assaults",
    allowSkip: true,
    next: "assault_portal_click"
  },
  {
    id: "assault_portal_click",
    message: "Clica aqui pra abrir os assaltos.",
    buttonLabel: "Abrir assaltos",
    target: "portal_assaults",
    actionRequired: "click_assault_portal",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "assault_menu",
    message: "Comeca pequeno. Ninguem vira lenda tropecando no chefao no primeiro dia.",
    buttonLabel: "Escolher esse",
    target: "first_assault",
    allowSkip: true,
    next: "assault_start_click"
  },
  {
    id: "assault_start_click",
    message: "Respira fundo, confere os bolsos e vai. O primeiro corre e sempre emocionante.",
    buttonLabel: "Iniciar assalto",
    target: "first_assault_start",
    actionRequired: "start_first_raid",
    passiveButton: true,
    allowSkip: true,
    next: "first_raid_running"
  },
  {
    id: "first_raid_running",
    message: "Faz o primeiro corre e volta com algo no bolso. Sem novela.",
    buttonLabel: "No corre",
    target: "stage",
    actionRequired: "complete_first_raid",
    passiveButton: true,
    allowSkip: true
  },
  {
    id: "first_loot",
    message: "Ai sim! Primeiro loot no bolso. Agora tenta nao perder tudo em 30 segundos.",
    buttonLabel: "Sou profissional",
    target: "stage",
    allowSkip: true,
    next: "tutorial_final"
  },
  {
    id: "tutorial_final",
    message: "Pronto, pivete. Tu ja sabe o basico: compra, guarda, corre, vende e nao da mole.",
    buttonLabel: "Partiu jornada",
    target: "stage",
    allowSkip: true,
    next: FINAL_STEP
  }
];

const STEP_BY_ID = Object.fromEntries(TUTORIAL_STEPS.map((step) => [step.id, step]));
const STEP_INDEX = new Map(TUTORIAL_STEPS.map((step, index) => [step.id, index]));
const HIDEOUT_WELCOME_INDEX = STEP_INDEX.get("hideout_welcome");
const CITY_BACK_INTRO_INDEX = STEP_INDEX.get("city_back_intro");
const ASSAULT_MENU_INDEX = STEP_INDEX.get("assault_menu");
const FIRST_RAID_RUNNING_INDEX = STEP_INDEX.get("first_raid_running");
const FIRST_LOOT_INDEX = STEP_INDEX.get("first_loot");

export function createTutorialState(step = "character_selected") {
  return {
    version: TUTORIAL_VERSION,
    active: true,
    completed: false,
    step,
    skipped: false
  };
}

export function resetTutorialForNewGame(state) {
  state.tutorial = createTutorialState();
  return state.tutorial;
}

export function normalizeTutorialState(state, options = {}) {
  if (!state) return null;
  if (!state.tutorial) {
    state.tutorial = options.startIfMissing
      ? createTutorialState(options.step || "city_welcome")
      : completedTutorialState();
  }

  state.tutorial.version ||= TUTORIAL_VERSION;
  state.tutorial.step ||= state.tutorial.completed ? FINAL_STEP : "city_welcome";
  if (state.tutorial.step === "almeida_sell") state.tutorial.step = "vendedor_intro";
  if (state.tutorial.step === "almeida_craft") state.tutorial.step = "vendedor_intro";
  if ([
    "almeida_return_click",
    "almeida_return_window",
    "almeida_sell_final",
    "almeida_craft_final",
    "vendedor_return_click",
    "vendedor_return_window",
    "vendedor_sell_final",
    "vendedor_craft_final"
  ].includes(state.tutorial.step)) {
    state.tutorial.step = "tutorial_final";
  }
  syncTutorialStepToScene(state);
  state.tutorial.completed = Boolean(state.tutorial.completed || state.tutorial.step === FINAL_STEP);
  state.tutorial.active = Boolean(state.tutorial.active && !state.tutorial.completed);
  if (!STEP_BY_ID[state.tutorial.step] && state.tutorial.step !== FINAL_STEP) {
    state.tutorial.step = "city_welcome";
    state.tutorial.active = true;
    state.tutorial.completed = false;
  }
  if (state.tutorial.completed) {
    state.tutorial.active = false;
    state.tutorial.step = FINAL_STEP;
  }
  return state.tutorial;
}

export function completedTutorialState() {
  return {
    version: TUTORIAL_VERSION,
    active: false,
    completed: true,
    step: FINAL_STEP,
    skipped: false
  };
}

export function tutorialStep(state) {
  const tutorial = state?.tutorial;
  if (!tutorial?.active || tutorial.completed) return null;
  return STEP_BY_ID[tutorial.step] || null;
}

export function setTutorialStep(state, stepId) {
  const previous = tutorialStep(state);
  if (stepId === FINAL_STEP || !STEP_BY_ID[stepId]) {
    completeTutorial(state);
    return { changed: true, previous, step: null };
  }
  normalizeTutorialState(state, { startIfMissing: true });
  state.tutorial.active = true;
  state.tutorial.completed = false;
  state.tutorial.step = stepId;
  return { changed: previous?.id !== stepId, previous, step: tutorialStep(state) };
}

export function advanceTutorialStep(state) {
  const current = tutorialStep(state);
  if (!current) return { changed: false, previous: null, step: null };
  const next = current.next || nextStepId(current.id);
  return setTutorialStep(state, next || FINAL_STEP);
}

export function completeTutorial(state) {
  const previous = tutorialStep(state);
  state.tutorial = {
    version: TUTORIAL_VERSION,
    active: false,
    completed: true,
    step: FINAL_STEP,
    skipped: Boolean(state.tutorial?.skipped)
  };
  return { changed: Boolean(previous), previous, step: null };
}

export function skipTutorial(state) {
  normalizeTutorialState(state, { startIfMissing: true });
  state.tutorial.skipped = true;
  return completeTutorial(state);
}

export function handleTutorialEvent(state, event) {
  const step = tutorialStep(state);
  if (!step) return { changed: false, previous: null, step: null };
  const sceneStep = tutorialSceneStepForEvent(step, event);
  if (sceneStep) return setTutorialStep(state, sceneStep);
  const progressStep = tutorialProgressStepForEvent(step, event);
  if (progressStep) return setTutorialStep(state, progressStep);
  if (!step.actionRequired) return { changed: false, previous: step, step };
  if (!tutorialActionMatches(step.actionRequired, event)) {
    return { changed: false, previous: step, step };
  }

  return advanceTutorialStep(state);
}

function syncTutorialStepToScene(state) {
  if (!state?.tutorial || state.tutorial.completed || state.tutorial.step === FINAL_STEP) return false;
  const sceneStep = tutorialSceneStepForCurrentScene(STEP_BY_ID[state.tutorial.step], state.scene);
  const progressStep = tutorialProgressStepForCurrentState(STEP_BY_ID[state.tutorial.step], state);
  const nextStep = progressStep || sceneStep;
  if (!nextStep) return false;
  state.tutorial.step = nextStep;
  return true;
}

function tutorialSceneStepForEvent(step, event) {
  if (event?.type !== "scene_entered") return null;
  if (event.scene === "hideout" && event.from === "city") {
    return tutorialSceneStepForCurrentScene(step, "hideout");
  }
  if (event.scene === "city" && event.from === "hideout") {
    return tutorialSceneStepForCurrentScene(step, "city");
  }
  return null;
}

function tutorialSceneStepForCurrentScene(step, scene) {
  const currentIndex = STEP_INDEX.get(step?.id);
  if (!Number.isInteger(currentIndex)) return null;
  if (scene === "hideout" && currentIndex < HIDEOUT_WELCOME_INDEX) return "hideout_welcome";
  if (scene === "city" && currentIndex >= HIDEOUT_WELCOME_INDEX && currentIndex < CITY_BACK_INTRO_INDEX) {
    return "city_back_intro";
  }
  return null;
}

function tutorialProgressStepForEvent(step, event) {
  if (event?.type === "assaults_opened") return tutorialProgressStepForAssaultsOpen(step);
  if (event?.type === "raid_started" && Number(event.mapIndex || 1) === 1) {
    return tutorialProgressStepForRaidStarted(step);
  }
  if (event?.type === "raid_returned") return tutorialProgressStepForRaidReturned(step);
  return null;
}

function tutorialProgressStepForCurrentState(step, state) {
  if (state?.scene === "map") return tutorialProgressStepForRaidStarted(step);
  if (state?.run?.summary) return tutorialProgressStepForRaidReturned(step);
  if (state?.scene === "city" && state?.activeLeft === "assaults") return tutorialProgressStepForAssaultsOpen(step);
  return null;
}

function tutorialProgressStepForAssaultsOpen(step) {
  const currentIndex = STEP_INDEX.get(step?.id);
  if (!Number.isInteger(currentIndex)) return null;
  if (currentIndex >= CITY_BACK_INTRO_INDEX && currentIndex < ASSAULT_MENU_INDEX) return "assault_menu";
  return null;
}

function tutorialProgressStepForRaidStarted(step) {
  const currentIndex = STEP_INDEX.get(step?.id);
  if (!Number.isInteger(currentIndex)) return null;
  if (currentIndex >= CITY_BACK_INTRO_INDEX && currentIndex < FIRST_RAID_RUNNING_INDEX) return "first_raid_running";
  return null;
}

function tutorialProgressStepForRaidReturned(step) {
  const currentIndex = STEP_INDEX.get(step?.id);
  if (!Number.isInteger(currentIndex)) return null;
  if (currentIndex >= CITY_BACK_INTRO_INDEX && currentIndex < FIRST_LOOT_INDEX) return "first_loot";
  return null;
}

export function isTutorialTargetAllowed(state, targetType, targetId) {
  const step = tutorialStep(state);
  if (!step?.actionRequired) return true;
  const expected = expectedTargetForAction(step.actionRequired);
  if (!expected) return true;
  return expected.type === targetType && expected.id === targetId;
}

export function expectedTutorialAssetPurchase(state) {
  const action = tutorialStep(state)?.actionRequired;
  if (action === "buy_land_1") return { type: "land", tier: 1 };
  if (action === "buy_house_1") return { type: "house", tier: 1 };
  if (action === "buy_car_1") return { type: "car", tier: 1 };
  return null;
}

export function expectedTutorialShopMode(state) {
  const action = tutorialStep(state)?.actionRequired;
  if (action === "open_land_shop") return "land";
  return null;
}

export function tutorialNudgeLine() {
  return WRONG_ACTION_LINES[Math.floor(Math.random() * WRONG_ACTION_LINES.length)];
}

export class TutorialOverlay {
  constructor(options) {
    this.root = options.root || document.body;
    this.resolveTargetRect = options.resolveTargetRect;
    this.resolveFrameRect = options.resolveFrameRect;
    this.onAdvance = options.onAdvance;
    this.onSkip = options.onSkip;
    this.onPassive = options.onPassive;
    this.node = null;
    this.highlight = null;
    this.arrow = null;
    this.bubble = null;
    this.primaryButton = null;
    this.skipButton = null;
  }

  render(step) {
    if (!step) {
      this.hide();
      return;
    }

    this.ensure();
    const targetRect = this.resolveTargetRect?.(step.target) || centeredRect();
    const viewportRect = clampRect(targetRect);
    const hideTargetMark = Boolean(targetRect?.hideTutorialMark);
    this.positionHighlight(viewportRect, hideTargetMark);
    this.positionBubble(step, viewportRect, hideTargetMark);
    this.node.classList.remove("hidden");
  }

  hide() {
    this.node?.classList.add("hidden");
  }

  ensure() {
    if (this.node) return;
    this.node = document.createElement("div");
    this.node.className = "tutorial-layer hidden";
    this.node.innerHTML = `
      <div class="tutorial-highlight" aria-hidden="true"></div>
      <div class="tutorial-arrow" aria-hidden="true"></div>
      <section class="tutorial-bubble" aria-live="polite">
        <p></p>
        <div class="tutorial-actions">
          <button type="button" class="tutorial-primary"></button>
          <button type="button" class="tutorial-skip" title="Ja nasceu sabendo, e?">Pular tutorial</button>
        </div>
      </section>
    `;
    this.highlight = this.node.querySelector(".tutorial-highlight");
    this.arrow = this.node.querySelector(".tutorial-arrow");
    this.bubble = this.node.querySelector(".tutorial-bubble");
    this.primaryButton = this.node.querySelector(".tutorial-primary");
    this.skipButton = this.node.querySelector(".tutorial-skip");
    this.primaryButton.addEventListener("click", () => {
      if (this.currentStep?.passiveButton) {
        this.onPassive?.(this.currentStep);
        return;
      }
      this.onAdvance?.(this.currentStep);
    });
    this.skipButton.addEventListener("click", () => {
      const confirmed = window.confirm("Vai pular a aula da malandragem?");
      if (confirmed) this.onSkip?.(this.currentStep);
    });
    this.root.append(this.node);
  }

  positionHighlight(rect, hidden = false) {
    this.highlight.classList.toggle("hidden", hidden);
    if (hidden) return;

    const padding = 10;
    this.highlight.style.left = `${Math.max(8, rect.left - padding)}px`;
    this.highlight.style.top = `${Math.max(8, rect.top - padding)}px`;
    this.highlight.style.width = `${Math.max(44, rect.width + padding * 2)}px`;
    this.highlight.style.height = `${Math.max(44, rect.height + padding * 2)}px`;
  }

  positionBubble(step, rect, hideTargetMark = false) {
    this.currentStep = step;
    this.bubble.querySelector("p").textContent = step.message;
    this.primaryButton.textContent = step.buttonLabel || "Bora";
    this.skipButton.classList.toggle("hidden", !step.allowSkip);

    const frame = this.resolveFrameRect?.() || {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };
    const frameLeft = Math.max(8, frame.left || 0);
    const frameTop = Math.max(8, frame.top || 0);
    const frameWidth = Math.max(260, Math.min(window.innerWidth - frameLeft - 8, frame.width || window.innerWidth));
    const availableWidth = Math.max(180, Math.min(frameWidth - 24, window.innerWidth - 16));
    const maxWidth = Math.min(520, Math.max(240, availableWidth));
    this.bubble.style.width = `${maxWidth}px`;
    this.bubble.style.maxWidth = `${maxWidth}px`;

    const targetCenterX = rect.left + rect.width / 2;
    const bubbleHeight = this.bubble.offsetHeight || 126;
    const bubbleTop = Math.min(
      window.innerHeight - bubbleHeight - 8,
      frameTop + 10
    );
    const bubbleLeft = Math.min(
      window.innerWidth - maxWidth - 8,
      Math.max(8, frameLeft + (frameWidth - maxWidth) / 2)
    );
    const targetIsBelowBubble = rect.top + rect.height / 2 >= bubbleTop + bubbleHeight;

    this.bubble.style.left = `${bubbleLeft}px`;
    this.bubble.style.top = `${bubbleTop}px`;
    this.bubble.classList.add("stage-top");

    this.arrow.style.left = `${Math.max(18, Math.min(window.innerWidth - 18, targetCenterX))}px`;
    this.arrow.style.top = targetIsBelowBubble
      ? `${Math.max(10, rect.top - 8)}px`
      : `${Math.min(window.innerHeight - 18, rect.top + rect.height + 8)}px`;
    this.arrow.classList.toggle("up", !targetIsBelowBubble);
    this.arrow.classList.toggle("hidden", hideTargetMark);
  }
}

function nextStepId(stepId) {
  const index = STEP_INDEX.get(stepId);
  if (!Number.isInteger(index)) return FINAL_STEP;
  return TUTORIAL_STEPS[index + 1]?.id || FINAL_STEP;
}

function tutorialActionMatches(action, event) {
  if (!event) return false;
  if (action === "click_npc_almeida" || action === "click_almeida_after_loot") {
    return event.type === "npc_opened" && event.npcId === "comerciante-itens";
  }
  if (action === "click_npc_zeca") {
    return event.type === "npc_opened" && event.npcId === "seu-zeca";
  }
  if (action === "click_npc_vendedor" || action === "click_vendedor_after_loot") {
    return event.type === "npc_opened" && event.npcId === "npc-vendedor";
  }
  if (action === "open_land_shop") {
    return event.type === "shop_mode" && event.mode === "land";
  }
  if (action === "buy_land_1") {
    return event.type === "asset_bought" && event.assetType === "land" && Number(event.tier) === 1;
  }
  if (action === "buy_house_1") {
    return event.type === "asset_bought" && event.assetType === "house" && Number(event.tier) === 1;
  }
  if (action === "buy_car_1") {
    return event.type === "asset_bought" && event.assetType === "car" && Number(event.tier) === 1;
  }
  if (action === "click_city_hideout_portal") {
    return event.type === "scene_entered" && event.scene === "hideout";
  }
  if (action === "click_hideout_house") {
    return event.type === "hideout_house_opened";
  }
  if (action === "click_hideout_return_portal") {
    return event.type === "scene_entered" && event.scene === "city" && event.from === "hideout";
  }
  if (action === "click_assault_portal") {
    return event.type === "assaults_opened";
  }
  if (action === "start_first_raid") {
    return event.type === "raid_started" && Number(event.mapIndex || 1) === 1;
  }
  if (action === "complete_first_raid") {
    return event.type === "raid_returned";
  }
  return false;
}

function expectedTargetForAction(action) {
  const targets = {
    click_npc_almeida: { type: "city_npc", id: "comerciante-itens" },
    click_almeida_after_loot: { type: "city_npc", id: "comerciante-itens" },
    click_npc_zeca: { type: "city_npc", id: "seu-zeca" },
    click_npc_vendedor: { type: "city_npc", id: "npc-vendedor" },
    click_vendedor_after_loot: { type: "city_npc", id: "npc-vendedor" },
    open_land_shop: { type: "shop_mode", id: "land" },
    buy_land_1: { type: "asset", id: "land:1" },
    buy_house_1: { type: "asset", id: "house:1" },
    buy_car_1: { type: "asset", id: "car:1" },
    click_city_hideout_portal: { type: "city_portal", id: "hideout-door" },
    click_hideout_house: { type: "hideout_item", id: "house" },
    click_hideout_return_portal: { type: "hideout_portal", id: "city-return" },
    click_assault_portal: { type: "city_portal", id: "assaults" },
    start_first_raid: { type: "assault", id: "map-1" }
  };
  return targets[action] || null;
}

function centeredRect() {
  return {
    left: window.innerWidth / 2 - 90,
    top: window.innerHeight / 2 - 50,
    width: 180,
    height: 100
  };
}

function clampRect(rect) {
  const width = Math.max(1, rect.width || 1);
  const height = Math.max(1, rect.height || 1);
  return {
    left: Math.min(window.innerWidth - width - 8, Math.max(8, rect.left || 8)),
    top: Math.min(window.innerHeight - height - 8, Math.max(8, rect.top || 8)),
    width,
    height
  };
}
