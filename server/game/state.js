const {randomIn, normalIn} = require('bens_utils').stochastic;
const {throwDart} = require('./utils');

const initGameState = (
  clientIDs, config,
  // dynamicConfig, // additional parameters set by users before game start
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
    players: {},
    stats: {},
  };

  let i = 0;
  for (const clientID of clientIDs) {
    players[clientID] = {
      nationalityIndex: i,
      money: config.startingMoney,
      gen: 1,
    };


    for (let j = 0; j < config.numAirbases; j++) {
      const airbase =
        makeAirbase(clientID, throwDart(i, game.worldSize),
          {...dynamicConfig[clientID].planes},
        );
      game.entities[airbase.id] = airbase;
    }
    for (let j = 0; j < config.numCities; j++) {
      const city = makeCity(clientID, throwDart(i, game.worldSize));
      game.entities[city.id] = city;
    }
    for (let j = 0; j < config.numFactories; j++) {
      const factory = makeFactory(clientID, throwDart(i, game.worldSize));
      game.entities[factory.id] = factory;
    }
    for (let j = 0; j < config.numLabs; j++) {
      const lab = makeLab(clientID, throwDart(i, game.worldSize));
      game.entities[lab.id] = lab;
    }

    game.stats[clientID] = {
      'fighters_shot_down': 0,
      'bombers_shot_down': 0,
      'recons_shot_down': 0,
      'planes_no_fuel': 0,
      'fighter_sorties': 0,
      'bomber_sorties': 0,
      'recon_sorties': 0,
      'fighter_aces': 0,
      'airbases_destroyed': 0,
    },
    i++;
  }

  return game;
};

let nextID = 1;
const makeAirbase = (clientID, position, planes) => {
  return {
    clientID, id: nextID++,
    type: "AIRBASE",
    name: "AIRBASE", // helps with selection
    isBuilding: true,

    planes: {...planes}, // {[name]: number}
    vision: 50,

    position, speed: 0, targetPos: {...position}, targetEnemy: null,
  };
}
const makeCity = (clientID, position) => {
  return {
    clientID, id: nextID++,
    type: "CITY",
    name: "CITY", // helps with selection
    isBuilding: true,
    vision: 15,
    position, speed: 0, targetPos: {...position}, targetEnemy: null,
  };
}
const makeFactory = (clientID, position) => {
  return {
    clientID, id: nextID++,
    type: "FACTORY",
    name: "FACTORY", // helps with selection
    isBuilding: true,
    vision: 15,
    position, speed: 0, targetPos: {...position}, targetEnemy: null,
  };
}
const makeLab = (clientID, position) => {
  return {
    clientID, id: nextID++,
    type: "LAB",
    name: "LAB", // helps with selection
    isBuilding: true,
    vision: 15,
    position, speed: 0, targetPos: {...position}, targetEnemy: null,
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
    ammo,
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
    ammo,

    position,
    targetPos,

    targetEnemy: null,
    kills: 0,
  };
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
  makeAirbase,
  makeCity,
  makeFactory,
  makeLab,
  makePlane,
  makeExplosion,
};
