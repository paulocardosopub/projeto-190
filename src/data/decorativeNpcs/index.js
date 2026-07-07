export const CITY_DECORATIVE_NPCS = [];

export function decorativeNpcsForIdleMap(mapId) {
  const sets = {
    prisao: [
      cityPoliceNpc("prisao-policial-extra-1", 300, "right"),
      cityPoliceNpc("prisao-policial-extra-2", 650, "front"),
      newNpc("prisao-detento-1", "Detento", 6, 0, 1130, "front"),
      newNpc("prisao-detento-2", "Detento", 3, 4, 1320, "right"),
      newNpc("prisao-seguranca-1", "Seguranca", 8, 4, 1640, "left")
    ],
    hospital: [
      newNpc("hospital-medico-extra-1", "Medico", 1, 0, 520, "right"),
      newNpc("hospital-enfermeira-extra-1", "Enfermeira", 5, 4, 900, "left"),
      newNpc("hospital-medico-extra-2", "Medico", 1, 0, 1180, "left"),
      newNpc("hospital-paciente-extra-1", "Paciente", 7, 4, 1440, "front", 0.94),
      newNpc("hospital-seguranca-1", "Seguranca", 8, 4, 1660, "front")
    ],
    petshop: []
  };
  return (sets[mapId] || []).map((npc) => ({ ...npc }));
}

function newNpc(id, name, row, columnOffset, x, direction = "front", heightScale = 0.96) {
  return {
    id,
    name,
    decorative: true,
    passive: true,
    sheet: "enemies3",
    row,
    columnOffset,
    direction,
    x,
    heightScale
  };
}

function cityPoliceNpc(id, x, direction = "front") {
  return {
    ...newNpc(id, "Policial", 3, 0, x, direction, 1),
    sheet: "enemies2"
  };
}
