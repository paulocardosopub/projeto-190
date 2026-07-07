export const PLAYER_POSES = {
  sideIdle: "parado_lado",
  frontIdle: "parado_frente",
  walk1: "andando_1",
  walk2: "andando_2",
  attack: "atacando",
  hurt: "dano"
};

export const PLAYERS = [
  player(
    "menino_gordinho_brasil",
    "Nico Trovao",
    "Sorriso de Aco",
    "Pequeno no tamanho da rua, gigante quando a confusao chama."
  ),
  player(
    "menina_loira_flamengo",
    "Luna Fagulha",
    "Chute Incendiario",
    "Rapida, vaidosa e sempre pronta para virar a briga de lado."
  ),
  player(
    "homem_forte_preto_branco",
    "Dante Bigorna",
    "Punho Pesado",
    "Aguenta a pressao de frente e responde com forca bruta."
  ),
  player(
    "homem_magro_verde_branco",
    "Caio Sombra",
    "Passo Leve",
    "Some pelo canto certo, aparece onde ninguem esperava."
  ),
  player(
    "mulher_ruiva_brasil",
    "Rubi Tempestade",
    "Furia Solar",
    "Corajosa, explosiva e dificil de parar quando embala."
  ),
  player(
    "mulher_gordinha_time_azul",
    "Mara Martelo",
    "Linha de Frente",
    "Resistente, decidida e com presenca para segurar qualquer beco."
  ),
  player(
    "homem_velho_camisa_branca",
    "Seu Baltazar",
    "Malandragem Antiga",
    "Experiencia de sobra para ler a rua antes de todo mundo."
  ),
  player(
    "mulher_morena_camisa_aleatoria",
    "Nara Faisca",
    "Improviso Certo",
    "Mistura estilo e reflexo para escapar quando o aperto fecha."
  ),
  player(
    "homem_moreno_forte_camisa_aleatoria",
    "Juca Bravio",
    "Forca Bruta",
    "Avanca sem medo e segura a linha mesmo cercado."
  ),
  player(
    "mendigo_blusa_rasgada_time",
    "Zeca Andarilho",
    "Rua Sem Regra",
    "Sabe cair, levantar e continuar andando com um sorriso torto."
  )
];

export const DEFAULT_PLAYER_ID = PLAYERS[0].id;

export function getPlayerById(id) {
  return PLAYERS.find((playerConfig) => playerConfig.id === id) || PLAYERS[0];
}

function player(id, name, title, description) {
  return {
    id,
    name,
    title,
    description,
    assetPath: `./assets/characters/${id}`
  };
}
