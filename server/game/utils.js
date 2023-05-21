const {randomIn, normalIn} = require('bens_utils').stochastic;
const {dist} = require('bens_utils').vectors;
const {getEntitiesByPlayer} = require('./selectors');

const throwDart = (game, playerIndex, worldSize) => {
  const clientID = Object.keys(game.players)[playerIndex];
  const entities = getEntitiesByPlayer(game, clientID);
  let pos = pickPos(playerIndex, worldSize);
  while (!isPosGood(entities, pos)) {
    pos = pickPos(playerIndex, worldSize);
  }
  return pos;
}

const pickPos = (playerIndex, worldSize) => {
  return {
    x: playerIndex == 0
      ? randomIn(40, 250)
      : randomIn(worldSize.width - 40, worldSize.width - 250),
    y: normalIn(200, worldSize.height - 200),
  };
}

const isPosGood = (entities, pos) => {
  for (const entityID in entities) {
    const entity = entities[entityID];
    if (!entity.isBuilding) continue;
    if (dist(entity.position, pos) < entity.vision + entity.vision / 2) return false;
  }
  return true;
}

module.exports = {
  throwDart,
};
