const {randomIn, normalIn} = require('bens_utils').stochastic;
const {throwDart} = require('./utils');
const {
  getPlaneDesignsUpToGen, getTotalResearchSpending,
} = require('../../js/selectors/selectors');

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
    config: {...config},
    worldSize: {...config.worldSize},
    tickInterval: null,
    entities: {},
    players: {},
    stats: {},
  };

  let playerIndex = 0;
  for (const clientID of clientIDs) {
    const nationalityIndex = dynamicConfig[clientID].nationalityIndex;
    // initialize player
    game.players[clientID] = {
      nationalityIndex,
      playerIndex,
      money: config.startingMoney,
      gen: config.gen,
      productionQueue: [], // {name: string, cost: remaining cost, airbaseID}
      researchProgress: config.gen < 4
        ? {gen: config.gen + 1, cost: config.genCost[config.gen + 1], isStarted: false}
        : null,
      planeTypesSeen: {},
    };

    // place all the initial buildings
    for (let j = 0; j < config.numAirbases; j++) {
      const planes = {};
      const designs = getPlaneDesignsUpToGen(nationalityIndex, config.gen);
      for (const name in designs) {
        planes[name] = 0;
      }
      const airbase = makeBuilding(
        clientID, throwDart(game, playerIndex, game.worldSize), 'AIRBASE', planes,
      );
      game.entities[airbase.id] = airbase;
    }
    for (let j = 0; j < config.numCities; j++) {
      const city = makeBuilding(clientID, throwDart(game, playerIndex, game.worldSize), 'CITY');
      game.entities[city.id] = city;
    }
    for (let j = 0; j < config.numFactories; j++) {
      const factory = makeBuilding(
        clientID, throwDart(game, playerIndex, game.worldSize), 'FACTORY',
      );
      game.entities[factory.id] = factory;
    }
    for (let j = 0; j < config.numLabs; j++) {
      const lab = makeBuilding(clientID, throwDart(game, playerIndex, game.worldSize), 'LAB');
      game.entities[lab.id] = lab;
    }

    game.stats[clientID] = {
      CITY: [{x: 0, y: config.numCities}],
      FACTORY: [{x: 0, y: config.numFactories}],
      LAB: [{x: 0, y: config.numLabs}],
      AIRBASE: [{x: 0, y: config.numAirbases}],
      airforceValue: [{x: 0, y: 0}],
      generation: [{x: 0, y: getTotalResearchSpending(game, clientID)}],

      'fighters_shot_down': 0,
      'bombers_shot_down': 0,
      'recons_shot_down': 0,
      'planes_no_fuel': 0,
      'fighter_sorties': 0,
      'bomber_sorties': 0,
      'recon_sorties': 0,
      'fighter_aces': 0,
      'airbases_destroyed': 0,
    }
    playerIndex++;
  }

  return game;
};

let nextID = 1;
const makeBuilding = (clientID, position, type, planes) => {
  const building = {
    clientID, id: nextID++,
    type,
    name: type, // helps with selection
    isBuilding: true,
    vision: 30,
    isMega: false,
    isHardened: false,
    position, speed: 0, targetPos: {...position}, targetEnemy: null,
  };
  if (type == 'AIRBASE') {
    building.vision = 50;

    building.planes = {...planes}; // {[name]: number}
    building.planeCapacity = 1000000; // very large, non-infinite number to JSON serialization
  } else if (type == 'LAB') {
    building.vision = 55;
  }
  return building;
}

const makePlane = (
  clientID, position, targetPos,
  parameters,
) => {
  const plane = {
    clientID, id: nextID++,
    type: 'PLANE',
    isPlane: true,

    // dynamic parameters
    ...parameters,

    position,
    targetPos,

    targetEnemy: null,
    kills: 0,
  };

  // for planes that carry other planes
  if (parameters.planeTypes) {
    plane.planes = {};
    for (const name of parameters.planeTypes) {
      plane.planes[name] = 0;
    }
  }

  return plane;
}

const makeExplosion = (
  position, maxRadius, duration, clientID,
) => {
  return {
    id: nextID++,
    clientID,
    type: 'EXPLOSION',
    duration,
    age: 0,
    position,
    maxRadius,
    hasBeenDiscovered: true,
  }
};


module.exports = {
  initGameState,
  makeBuilding,
  makePlane,
  makeExplosion,
};
