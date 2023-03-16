const {dist} = require('bens_utils').vectors;

const getNearestCarrier = (game, plane) => {
  let nearestCarrier = null;
  let nearestDist = Infinity;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (
      entity.type == 'CARRIER' && entity.clientID == plane.clientID &&
      dist(entity.position, plane.position) < nearestDist
    ) {
      nearestDist = dist(entity.position, plane.position);
      nearestCarrier = entity;
    }
  }
  return nearestCarrier;
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

const getNumCarriers = (game, clientID) => {
  let numCarriers = 0;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (entity.clientID == clientID && entity.type == 'CARRIER') {
      numCarriers++;
    }
  }
  return numCarriers;
}

const getOtherClientID = (session, clientID) => {
  for (const id of session.clients) {
    if (id != clientID) return id;
  }
};

module.exports = {
  getNearestCarrier,
  getEntitiesByPlayer,
  getOtherClientID,
  getNumCarriers,
};
