const {randomIn, normalIn} = require('bens_utils').stochastic;

const throwDart = (playerIndex, worldSize) => {
  return  {
    x: playerIndex == 0
      ? randomIn(40, 250)
      : randomIn(worldSize.width - 40, worldSize.width - 250),
    y: normalIn(200, worldSize.height - 200),
  };
}

module.exports = {
  throwDart,
};
