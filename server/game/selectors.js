const {dist} = require('bens_utils').vectors;

const getNearestAirbase = (game, plane) => {
  let nearestAirbase = null;
  let nearestDist = Infinity;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (
      entity.type == 'AIRBASE' && entity.clientID == plane.clientID &&
      dist(entity.position, plane.position) < nearestDist
    ) {
      nearestDist = dist(entity.position, plane.position);
      nearestAirbase = entity;
    }
  }
  return nearestAirbase;
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

const getNumAirbases = (game, clientID) => {
  let numAirbases = 0;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (entity.clientID == clientID && entity.type == 'AIRBASE') {
      numAirbases++;
    }
  }
  return numAirbases;
}

const getOtherClientID = (session, clientID) => {
  for (const id of session.clients) {
    if (id != clientID) return id;
  }
};

module.exports = {
  getNearestAirbase,
  getEntitiesByPlayer,
  getOtherClientID,
  getNumAirbases,
};