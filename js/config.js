const isLocalHost = true;

const config = {
  isLocalHost,

  URL: isLocalHost ? null : "https://benhub.io",
  path: isLocalHost ? null : "/midway/socket.io",

  msPerTick: 200,

  worldSize: {width: 1000, height: 1000},

  numAirports: 3,
  startingMoney: 5000,
  maxPlaneDesigns: 4,

  // airplane parameters:
  fuel: {min: 0, max: 2000, cost: 0.1, inc: 50}, // 10 range per dollar
  vision: {min: 0, max: 100, cost: 1, inc: 1}, // 1 vision per dollar
  speed: {min: 1, max: 3, cost: 100, inc: 1}, // 100 cost per speed (inc is actually 0.1)
  airAttackCost: 50,
  groundAttackCost: 50,
  // fighter cost:
  //  60 fuel + 30 vision + 120 speed + 30 attack = 240
  // bomber cost:
  //  80 fuel + 45 vision + 100 speed  + 30 attack = 255

}

module.exports = {
  config,
};
