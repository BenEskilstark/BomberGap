const {dist} = require('bens_utils').vectors;

const getNearestAirport = (game, plane) => {
  let nearestAirport = null;
  let nearestDist = Infinity;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (
      entity.type == 'AIRPORT' && entity.clientID == plane.clientID &&
      dist(entity.position, plane.position) < nearestDist
    ) {
      nearestDist = dist(entity.position, plane.position);
      nearestAirport = entity;
    }
  }
  return nearestAirport;
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

const getNumAirports = (game, clientID) => {
  let numAirports = 0;
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (entity.clientID == clientID && entity.type == 'AIRPORT') {
      numAirports++;
    }
  }
  return numAirports;
}

const getOtherClientID = (session, clientID) => {
  for (const id of session.clients) {
    if (id != clientID) return id;
  }
};

module.exports = {
  getNearestAirport,
  getEntitiesByPlayer,
  getOtherClientID,
  getNumAirports,
};