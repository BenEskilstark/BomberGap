const {
  dist, magnitude, add, subtract, multiply,
  scale, makeVector, vectorTheta, rotate,
} = require('bens_utils').vectors;
const {config} = require('../config');

// --------------------------------------------------------------------
//  Airbases
// --------------------------------------------------------------------

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
      (!entity.planeTypes || entity.planeTypes.includes(plane.name)) && // can carry this type
      (getTotalPlanesAtBase(entity) < entity.planeCapacity) &&
      dist(entity.position, plane.position) < nearestDist
    ) {
      nearestDist = dist(entity.position, plane.position);
      nearestAirbase = entity;
    }
  }
  return nearestAirbase;
};


// --------------------------------------------------------------------
// Plane Designs
// --------------------------------------------------------------------

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


// --------------------------------------------------------------------
// Production
// --------------------------------------------------------------------

const getNumPlaneInProductionAtBase = (game, airbaseID, planeName) => {
  const airbase = game.entities[airbaseID];
  const player = game.players[airbase.clientID];
  let total = 0;

  for (const plane of player.productionQueue) {
    if (plane.airbaseID != airbaseID) continue;
    if (!planeName || plane.name == planeName) {
      total += 1;
    }
  }

  return total;
}

const getPlaneInProductionAtBase = (game, airbaseID, planeName) => {
  const airbase = game.entities[airbaseID];
  const player = game.players[airbase.clientID];

  for (const plane of player.productionQueue) {
    if (plane.airbaseID != airbaseID) continue;
    if (!planeName || plane.name == planeName) return plane;
  }

  return null;
}

const getPlanesBeingWorkedOn = (game, airbaseID, planeName) => {
  const airbase = game.entities[airbaseID];
  const player = game.players[airbase.clientID];

  const planesBeingWorkedOn = [];
  for (const plane of player.productionQueue) {
    if (plane.airbaseID != airbaseID) continue;
    if (
      plane.cost < getPlaneDesignByName(game, planeName).cost &&
      (!planeName || planeName == plane.name)
    ) {
      planesBeingWorkedOn.push(plane);
    }
  }

  return planesBeingWorkedOn;
}


// --------------------------------------------------------------------
// General Entities
// --------------------------------------------------------------------

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


// --------------------------------------------------------------------
// Session
// --------------------------------------------------------------------

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


// --------------------------------------------------------------------
// Canvas/Mouse
// --------------------------------------------------------------------

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


// --------------------------------------------------------------------
// Intercept Course
// --------------------------------------------------------------------

const getInterceptPos = (game, entity, target) => {
  if (target.isBuilding) return {...target.position};

  let targetTargetPos = target.targetPos;
  if (!targetTargetPos) {
    targetTargetPos = getNearestAirbase(game, target)?.position;
  }
  if (!targetTargetPos) return {...target.position};

  const targetVelocity = makeVector(
    vectorTheta(subtract(targetTargetPos, target.position)), target.speed
  );
  const toTargetVector = subtract(target.position, entity.position);
  const relativeTargetVelocity = subtract(add(target.position, targetVelocity), entity.position);
  // TODO: is this magnitude not being negative ever gonna break this?
  if (magnitude(relativeTargetVelocity) > entity.speed) {
    return {...target.position};
  }



  const distance = dist(entity.position, target.position);
}

// return the vector that is the amount of vectorB that is parallel to vectorA
const componentVector = (vectorA, vectorB) => {

}



module.exports = {
  getTotalPlanesAtBase,
  getNearestAirbase,
  getPlaneDesignsByGen,
  getPlaneDesignsUpToGen,
  getPlaneDesignByName,
  getNumPlaneInProductionAtBase,
  getPlaneInProductionAtBase,
  getPlanesBeingWorkedOn,
  getPlaneDesignsUnlocked,
  getNumBuilding,
  getEntitiesByPlayer,
  getOtherClientID,
  isHost,
  getEntitiesByType,
  normalizePos,
  getCanvasSize,
  getInterceptPos,
};
