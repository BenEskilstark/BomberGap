const {
  dist, magnitude, add, subtract, multiply,
  scale, makeVector, vectorTheta, rotate,
} = require('bens_utils').vectors;
const {config} = require('../../js/config');

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

const getOtherClientID = (session, clientID) => {
  for (const id of session.clients) {
    if (id != clientID) return id;
  }
};

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

const numTimesTargeted = (game, targetID) => {
  let num = 0;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (entity.targetEnemy == targetID) num++;
  }
  return num;
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
  const targetToTargetVector = subtract(targetTargetPos, target.position);
  const toTargetVector = subtract(target.position, entity.position);

  const targetVelocity = makeVector(
    vectorTheta(targetToTargetVector), target.speed
  );
  const entityVelocity = makeVector(vectorTheta(toTargetVector), entity.speed);

  const relativeVelocity = {
    x: targetVelocity.x - entityVelocity.x,
    y: targetVelocity.y - entityVelocity.y
  };
  if (magnitude(relativeVelocity) == 0) {
    return {...target.position};
  }
  const distance = dist(entity.position, target.position);
  const timeToIntercept = distance / magnitude(relativeVelocity);

  const timeToTarget = dist(target.position, targetTargetPos) / target.speed;
  if (timeToIntercept > timeToTarget) {
    return {...target.position};
  }

  const targetPos = {
    x: target.position.x + targetVelocity.x * timeToIntercept,
    y: target.position.y + targetVelocity.y * timeToIntercept
  };

  return targetPos;


  // const toTargetVector = subtract(target.position, entity.position);
  // const thetaBetween = vectorTheta(subtract(targetToTargetVector, toTargetVector));
  // const component = Math.cos(thetaBetween);
  // if (component * target.speed >= entity.speed) {
  //   return {...target.position};
  // }
  // if (component < 0) {
  //   return {...target.position};
  // }

  // const distance = dist(entity.position, target.position);
  // const numTicks = distance / Math.abs(component * target.speed - entity.speed);
  // const targetInterceptPoint = add(scale(targetVelocity, numTicks), target.position);

  // return targetInterceptPoint;
}


module.exports = {
  getTotalPlanesAtBase,
  getNearestAirbase,
  getPlaneDesignsByGen,
  getPlaneDesignsUpToGen,
  getEntitiesByPlayer,
  getOtherClientID,
  getNumBuilding,
  getEntitiesByType,
  getInterceptPos,
  numTimesTargeted,
};
