const motorcyclePortal = {
  width: 126,
  height: 94,
  yOffset: 6,
  type: "assailant"
};

export const CITY_PORTALS = [
  {
    id: "assaults",
    label: "Assaltos",
    x: 82,
    action: "assaults",
    ...motorcyclePortal
  },
  {
    id: "hideout-door",
    label: "Esconderijo",
    x: 505,
    width: 52,
    height: 60,
    yOffset: -8,
    action: "hideout",
    type: "smoke",
    approachOffset: -52
  }
];

export const HIDEOUT_PORTALS = [
  {
    id: "city-return",
    label: "Cidade",
    x: 82,
    width: 52,
    height: 60,
    yOffset: -8,
    action: "city",
    type: "smoke",
    approachOffset: 0
  }
];

export const IDLE_PORTALS = [
  {
    id: "petshop-city-return",
    mapId: "petshop",
    label: "Cidade",
    x: 82,
    action: "city",
    approachOffset: 71,
    ...motorcyclePortal
  }
];
