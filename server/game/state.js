const {randomIn, normalIn} = require('bens_utils').stochastic;

const initGameState = (
  clientIDs, config,
  dynamicConfig, // additional parameters set by users before game start
                 // keyed by clientID and currenty::
                 // planeDesigns {[name]: {cost, fuel, vision, type, speed, productionTime}}
                 // planes {{[name]: number}}
                 // money {number}
) => {
  const game = {
    time: 0,
    worldSize: {...config.worldSize},
    tickInterval: null,
    entities: {},
    stats: {},
    planeDesigns: {},
  };

  let i = 0;
  for (const clientID of clientIDs) {
    for (let j = 0; j < config.numAirports; j++) {
      const airport =
        makeAirport(
          clientID,
          {
            x: i == 0
              ? randomIn(40, 160)
              : randomIn(game.worldSize.width - 40, game.worldSize.width - 160),
            y: normalIn(40, game.worldSize.height - 40),
          },
          {...dynamicConfig[clientID].planes},
        );
      game.entities[airport.id] = airport;
      game.planeDesigns[clientID] = {...dynamicConfig[clientID].planeDesigns};
    }

    game.stats[clientID] = {
      'fighters_shot_down': 0,
      'bombers_shot_down': 0,
      'recons_shot_down': 0,
      'fighters_no_fuel': 0,
      'bombers_no_fuel': 0,
      'fighter_sorties': 0,
      'bomber_sorties': 0,
      'fighter_aces': 0,
      'ships_sunk': 0,
    },
    i++;
  }

  return game;
};

let nextID = 1;
const makeAirport = (clientID, position, planes) => {
  return {
    clientID, id: nextID++,
    type: "AIRPORT",
    isBuilding: true,

    planes: {...planes}, // {[name]: number}

    vision: 50,

    position,
    targetPos: {...position},
    speed: 0,

    targetEnemy: null,
  };
}

const makePlane = (
  clientID, position, type, targetPos,
  parameters,
) => {
  const {
    cost,
    fuel,
    vision,
    speed,
    productionTime,
    name,
  } = parameters;
  return {
    clientID, id: nextID++,
    type, // FIGHTER | BOMBER | RECON
    isPlane: true,

    // dynamic parameters
    cost,
    fuel,
    vision,
    speed,
    productionTime,
    name,

    position,
    targetPos,

    targetEnemy: null,
    kills: 0,
  };
}

module.exports = {
  initGameState,
  makeAirport,
  makePlane,
};
