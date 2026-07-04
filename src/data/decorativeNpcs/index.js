export const CITY_DECORATIVE_NPCS = [];

export function decorativeNpcsForIdleMap(mapId) {
  const sets = {
    prisao: [
      oldNpc("prisao-policial-extra-1", "Policial", 3, 350, "front"),
      oldNpc("prisao-policial-extra-2", "Policial", 3, 620, "left"),
      oldNpc("prisao-detento-1", "Detento", 7, 980, "front"),
      oldNpc("prisao-detento-2", "Detento", 7, 1270, "right")
    ],
    hospital: [
      oldNpc("hospital-paciente-1", "Paciente", 6, 520, "front"),
      oldNpc("hospital-funcionario-1", "Funcionario", 5, 930, "front"),
      oldNpc("hospital-paciente-2", "Paciente", 1, 1320, "front")
    ],
    petshop: []
  };
  return (sets[mapId] || []).map((npc) => ({ ...npc }));
}

function oldNpc(id, name, row, x, direction = "front") {
  return {
    id,
    name,
    decorative: true,
    passive: true,
    sheet: "enemies2",
    row,
    direction,
    x,
    heightScale: 1
  };
}
