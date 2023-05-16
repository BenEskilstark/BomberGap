const {dist} = require('bens_utils').vectors;
const {config} = require('../config');

const getTotalPlanesAtBase = (base) => {
  let total = 0;
  for (const name in base.planes) {
    total += base.planes[name];
  }
  return total;
}

// finds the nearest airbase or plane-carrying plane that has room and accepts this type
// of plane
const getNearestAirbase = (game, plane) => {
  let nearestAirbase = null;
  let nearestDist = Infinity;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (
      entity.planes && entity.clientID == plane.clientID && // airbase or plane-carrying plane
      (!entity.planeTypes || entity.planesTypes.includes(plane.name)) && // can carry this type
      (getTotalPlanesAtBase(entity) < entity.planeCapacity) &&
      dist(entity.position, plane.position) < nearestDist
    ) {
      nearestDist = dist(entity.position, plane.position);
      nearestAirbase = entity;
    }
  }
  return nearestAirbase;
};

const getPlaneDesignsByGen = (nationalityIndex, gen) => {
  const allDesigns = config.planeDesigns[nationalityIndex];
  const genDesigns = {};
  for (const name in allDesigns) {
    if (allDesigns[name].gen == gen) {
      genDesigns[name] = allDesigns[name];
    }
  }
  return genDesigns;
};

const getPlaneDesignsUpToGen = (nationalityIndex, gen) => {
  let designs = {};
  for (let g = 1; g <= gen; g++) {
    designs = {...designs, ...getPlaneDesignsByGen(nationalityIndex, g)};
  }
  return designs;
}

const getPlaneDesignByName = (game, name) => {
  for (let i = 0; i < game.config.planeDesigns.length; i++) {
    if (game.config.planeDesigns[i][name]) {
      return game.config.planeDesigns[i][name];
    }
  }
}

const getPlaneDesignsUnlocked = (game, clientID) => {
  const player = game.players[clientID];
  return getPlaneDesignsUpToGen(player.nationalityIndex, player.gen);
}

const getNumBuilding = (game, clientID, buildingType) => {
  let numBuilding = 0;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (entity.clientID == clientID && entity.type == buildingType) {
      numBuilding++;
    }
  }
  return numBuilding;
}

const getEntitiesByPlayer = (game, clientID) => {
  let entities = {};
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (entity.clientID == clientID) {
      entities[entity.id] = entity;
    }
  }
  return entities;
}

const getOtherClientID = (game, clientID) => {
  for (const id of game.clientIDs) {
    if (id != clientID) {
      return id;
    }
  }
};

const isHost = (game) => {
  return game.clientIDs[0] == game.clientID;
}

const getEntitiesByType = (game, type, clientID) => {
  const entities = [];
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if ((entity.clientID == clientID || !clientID) && entity.type == type) {
      entities.push(entity);
    }
  }
  return entities;
}

const normalizePos = (pos, worldSize, canvasSize) => {
  return {
    x: pos.x * worldSize.width / canvasSize.width,
    y: pos.y * worldSize.height / canvasSize.height,
  };
}

const getCanvasSize = () => {
  if (window.innerWidth > window.innerHeight) {
    return {
      width: window.innerHeight,
      height: window.innerHeight,
    };
  } else {
    return {
      width: window.innerWidth,
      height: window.innerWidth,
    };
  }
}

module.exports = {
  getTotalPlanesAtBase,
  getNearestAirbase,
  getPlaneDesignsByGen,
  getPlaneDesignsUpToGen,
  getPlaneDesignByName,
  getPlaneDesignsUnlocked,
  getNumBuilding,
  getEntitiesByPlayer,
  getOtherClientID,
  isHost,
  getEntitiesByType,
  normalizePos,
  getCanvasSize,
};
