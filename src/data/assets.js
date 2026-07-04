const enemies3FrameBounds = [
  [[58, 13, 104, 143], [189, 11, 83, 145], [308, 11, 79, 145], [417, 12, 105, 144], [602, 9, 77, 147], [724, 8, 72, 148], [846, 8, 70, 148], [958, 10, 73, 146]],
  [[82, 165, 72, 144], [198, 164, 74, 144], [312, 165, 69, 143], [430, 165, 68, 143], [595, 164, 108, 144], [725, 164, 84, 143], [834, 165, 106, 143], [959, 164, 84, 144]],
  [[68, 315, 89, 143], [197, 315, 78, 143], [312, 315, 73, 143], [424, 315, 88, 143], [604, 316, 82, 142], [729, 316, 81, 142], [845, 317, 77, 141], [956, 317, 74, 141]],
  [[76, 466, 65, 144], [203, 466, 70, 144], [316, 467, 60, 143], [440, 466, 62, 143], [607, 467, 73, 141], [735, 467, 65, 141], [846, 468, 74, 140], [966, 468, 66, 140]],
  [[63, 616, 91, 137], [186, 615, 94, 137], [310, 615, 76, 138], [422, 616, 86, 137], [597, 614, 95, 139], [705, 614, 93, 138], [844, 615, 95, 138], [947, 615, 91, 137]],
  [[73, 759, 65, 138], [198, 759, 72, 137], [312, 760, 70, 136], [446, 760, 54, 136], [608, 758, 68, 140], [724, 758, 66, 140], [849, 760, 65, 137], [957, 758, 65, 140]],
  [[72, 904, 70, 126], [204, 903, 66, 127], [313, 904, 68, 126], [433, 904, 63, 126], [601, 905, 86, 127], [718, 905, 80, 127], [850, 907, 88, 125], [952, 907, 74, 125]],
  [[56, 1036, 96, 120], [181, 1036, 94, 120], [313, 1037, 78, 119], [426, 1037, 85, 118], [595, 1037, 75, 119], [717, 1037, 69, 119], [840, 1037, 91, 119], [963, 1037, 63, 119]],
  [[75, 1160, 65, 120], [209, 1160, 62, 120], [320, 1160, 59, 120], [441, 1161, 61, 119], [605, 1161, 68, 120], [719, 1160, 75, 120], [844, 1160, 74, 121], [962, 1160, 71, 121]],
  [[79, 1282, 74, 120], [193, 1282, 74, 120], [316, 1283, 76, 119], [422, 1282, 73, 120], [601, 1282, 92, 120], [708, 1281, 82, 121], [846, 1282, 86, 120], [951, 1282, 82, 120]]
];

function frameBounds(rows) {
  return rows.map((row) => row.map(([sourceX, sourceY, width, height]) => ({
    sourceX,
    sourceY,
    width,
    height
  })));
}

export const ASSETS = {
  backgrounds: "./assets/backgrounds.png",
  backgrounds2: "./assets/backgrounds2.png",
  backgrounds3: "./assets/backgrounds3.png",
  backgrounds4: "./assets/backgrounds4.png",
  backgroundIdle1: "./assets/backgroundidle1.png",
  assaultPortal: "./assets/assaltante.png",
  hideouts: "./assets/esconderijos.png",
  pets: "./assets/pets.png",
  hideoutHouses: "./src/hideout/casas.png",
  hideoutVehicles: "./src/hideout/veiculos.png?v=vehicle-alpha-3",
  players: "./player.png",
  playerAnimation1: "./src/animations/jogador1.png",
  playerAnimation2: "./src/animations/jogador2.png",
  playerStealAnimation: "./src/animations/roubos.png",
  enemies: "./src/enemy/inimigos1.png",
  enemies2: "./src/enemy/inimigos2.png",
  enemies3: "./src/enemy/inimigos3.png",
  pages: "./paginas.png"
};

export const SPRITES = {
  background: {
    width: 1920,
    height: 320,
    rows: 6
  },
  actor: {
    cols: 4,
    rows: 3,
    cellWidth: 480,
    cellHeight: 480,
    direction: {
      right: 0,
      front: 1,
      back: 2,
      left: 3
    }
  },
  actorSheets: {
    players: {
      cols: 4,
      rows: 3,
      cellWidth: 480,
      cellHeight: 480,
      direction: {
        right: 0,
        front: 1,
        back: 2,
        left: 3
      }
    },
    enemies: {
      cols: 4,
      rows: 3,
      cellWidth: 480,
      cellHeight: 480,
      direction: {
        right: 0,
        front: 1,
        back: 2,
        left: 3
      }
    },
    enemies2: {
      cols: 4,
      rows: 8,
      cellWidth: 256,
      cellHeight: 192,
      direction: {
        right: 0,
        front: 1,
        back: 2,
        left: 3
      },
      manualBounds: [
        [
          { x: 111, y: 12, width: 124, height: 198 },
          { x: 99, y: 11, width: 111, height: 199 },
          { x: 71, y: 11, width: 114, height: 199 },
          { x: 27, y: 13, width: 121, height: 197 }
        ],
        [
          { x: 118, y: 30, width: 92, height: 196 },
          { x: 105, y: 28, width: 105, height: 198 },
          { x: 73, y: 28, width: 106, height: 198 },
          { x: 55, y: 31, width: 87, height: 195 }
        ],
        [
          { x: 109, y: 45, width: 139, height: 195 },
          { x: 91, y: 45, width: 121, height: 194 },
          { x: 71, y: 45, width: 122, height: 194 },
          { x: 14, y: 46, width: 123, height: 194 }
        ],
        [
          { x: 108, y: 60, width: 110, height: 185 },
          { x: 94, y: 60, width: 120, height: 183 },
          { x: 68, y: 60, width: 117, height: 183 },
          { x: 50, y: 60, width: 98, height: 184 }
        ],
        [
          { x: 105, y: 66, width: 134, height: 184 },
          { x: 93, y: 66, width: 132, height: 183 },
          { x: 65, y: 66, width: 116, height: 183 },
          { x: 42, y: 66, width: 110, height: 184 }
        ],
        [
          { x: 115, y: 68, width: 113, height: 179 },
          { x: 88, y: 67, width: 121, height: 179 },
          { x: 68, y: 67, width: 111, height: 180 },
          { x: 33, y: 67, width: 111, height: 179 }
        ],
        [
          { x: 100, y: 63, width: 114, height: 155 },
          { x: 90, y: 65, width: 110, height: 154 },
          { x: 68, y: 66, width: 106, height: 152 },
          { x: 33, y: 63, width: 115, height: 155 }
        ],
        [
          { x: 101, y: 32, width: 116, height: 160 },
          { x: 99, y: 32, width: 96, height: 160 },
          { x: 76, y: 32, width: 96, height: 160 },
          { x: 27, y: 32, width: 118, height: 160 }
        ]
      ]
    },
    enemies3: {
      cols: 8,
      rows: 10,
      cellWidth: 140,
      cellHeight: 140,
      direction: {
        right: 0,
        front: 1,
        back: 2,
        left: 3
      },
      manualBounds: frameBounds(enemies3FrameBounds)
    }
  },
  backgroundSheets: {
    backgrounds: {
      width: 1920,
      height: 320,
      rows: 6
    },
    backgrounds2: {
      width: 1920,
      height: 320,
      rows: 6
    },
    backgrounds3: {
      width: 1920,
      height: 320,
      rows: 6
    },
    backgrounds4: {
      width: 1920,
      height: 320,
      rows: 6
    },
    backgroundIdle1: {
      width: 1920,
      height: 940 / 3,
      rows: 3
    }
  },
  playerAnimation: {
    actions: {
      walk: 0,
      attack: 1,
      hurt: 2
    },
    framesPerRow: 8,
    rows: 3,
    manualRuns: {
      0: {
        attack: [
          { x0: 48, x1: 209 },
          { x0: 298, x1: 494 },
          { x0: 569, x1: 767 },
          { x0: 843, x1: 1183, margin: 0 },
          { x0: 1184, x1: 1470, margin: 0 },
          { x0: 1486, x1: 1652 },
          { x0: 1720, x1: 1874 },
          { x0: 1970, x1: 2122 }
        ]
      }
    }
  },
  playerStealAnimation: {
    framesPerRow: 6,
    rows: 3,
    anchorMode: "manual",
    referenceHeights: [332, 350],
    framesByPlayer: [
      [
        { x: 0, y: 1300, width: 362, height: 430, anchorX: 186, anchorY: 379 },
        { x: 362, y: 1300, width: 362, height: 430, anchorX: 232, anchorY: 375 },
        { x: 724, y: 1300, width: 362, height: 430, anchorX: 236, anchorY: 377 },
        { x: 1086, y: 1300, width: 362, height: 430, anchorX: 246, anchorY: 378 },
        { x: 1448, y: 1300, width: 362, height: 430, anchorX: 256, anchorY: 379 },
        { x: 1810, y: 1300, width: 362, height: 430, anchorX: 254, anchorY: 376 }
      ],
      [
        { x: 0, y: 390, width: 362, height: 430, anchorX: 171, anchorY: 400 },
        { x: 362, y: 390, width: 362, height: 430, anchorX: 210, anchorY: 400 },
        { x: 724, y: 390, width: 362, height: 430, anchorX: 221, anchorY: 400 },
        { x: 1086, y: 390, width: 362, height: 430, anchorX: 218, anchorY: 400 },
        { x: 1448, y: 390, width: 362, height: 430, anchorX: 227, anchorY: 400 },
        { x: 1810, y: 390, width: 362, height: 430, anchorX: 238, anchorY: 400 }
      ]
    ]
  },
  petFrames: {
    actions: {
      idle: [0, 1],
      walk: [0, 1, 2, 3],
      attack: [4, 5],
      returnToPlayer: [0, 1, 2, 3]
    }
  },
  hideoutItems: {
    house: {
      sheet: "hideoutHouses",
      cols: 3,
      rows: 3,
      cellWidth: 640,
      cellHeight: 640
    },
    vehicle: {
      sheet: "hideoutVehicles",
      cols: 3,
      rows: 3,
      cellWidth: 418,
      cellHeight: 418,
      manualBounds: [
        [],
        [
          null,
          { x: 0, y: 151, width: 366, height: 194 },
          { x: -16, y: 129, width: 379, height: 221 }
        ],
        [
          null,
          { x: 0, y: 117, width: 371, height: 182 },
          { x: -16, y: 126, width: 392, height: 181 }
        ]
      ]
    }
  }
};
