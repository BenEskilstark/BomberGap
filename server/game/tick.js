const {
  leaveSession, emitToSession, emitToAllClients,
} = require('../sessions');
const {
  makeVector, vectorTheta, subtract, add, dist, equals,
} = require('bens_utils').vectors;
const {subtractWithDeficit} = require('bens_utils').math;
const {oneOf} = require('bens_utils').stochastic;
const {
  getEntitiesByPlayer, getNearestAirbase, getOtherClientID,
  getNumBuilding, getEntitiesByType,
  getPlaneDesignsByGen, getInterceptPos,
  numTimesTargeted, getTotalAirforceValue, getIncome,
  getTotalResearchSpending,
} = require('../../js/selectors/selectors');
const {makePlane, makeExplosion} = require('./state');

const tick = (game, session, socketClients) => {
  game.time += 1;

  updateIncome(game);

  // order here implicitly defines spending priority
  updateProduction(game);
  updateResearch(game);

  updateExplosions(game);
  updateAfterburners(game);
  moveAndFight(session, game, socketClients);
  computeVisionAndTargeting(session, game, socketClients);
  sendPlayerUpdates(session, game, socketClients);
}


const updateAfterburners = (game) => {
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (!entity) continue;
    if (!entity.isAfterburner) continue;

    if (entity.afterburn > 0) {
      entity.afterburn--;
    }
    if (entity.afterburn == 0) {
      entity.speed = entity.prevSpeed;
    }
  }
};


const updateIncome = (game) => {
  for (const clientID in game.players) {
    const player = game.players[clientID];
    const numCities = getNumBuilding(game, clientID, 'CITY');
    const {moneyRate, megaMultiplier, msPerTick} = game.config;
    const numMegaCities = getNumBuilding(game, clientID, 'CITY', 'isMega');
    player.money += Math.round((numCities + numMegaCities) * moneyRate * msPerTick / 1000);
    // this is unwieldy, but works for non-multiples of 2 for megaMultiplier
    // player.money += Math.round( // subtraction avoids the double counting
    // (numMegaCities * moneyRate * megaMultiplier - numMegaCities * moneyRate) * msPerTick / 1000
    // );
   }
};


const updateResearch = (game) => {
  for (const clientID in game.players) {
    const player = game.players[clientID];
    if (!player.researchProgress?.isStarted) continue;

    const numLabs = getNumBuilding(game, clientID, 'LAB');
    const numMegaLabs = getNumBuilding(game, clientID, 'LAB', 'isMega');
    const totalResearchCost = Math.round(
      (numLabs + numMegaLabs) * game.config.researchRate * game.config.msPerTick / 1000
    );

    // pay for research
    const {result, amount} = subtractWithDeficit(
      player.researchProgress.cost,
      Math.min(player.money, totalResearchCost),
    );
    player.money -= amount;
    player.researchProgress.cost = result;

    // research complete
    if (player.researchProgress.cost <= 0) {
      player.gen = player.researchProgress.gen;
      if (player.gen < 4) {
        player.researchProgress = {
          gen: player.gen + 1,
          cost: game.config.genCost[player.gen + 1],
          isStarted: false,
        };
      } else {
        player.researchProgress = null;
      }
      game.stats[clientID].generation.push({
        x: game.time, y: getTotalResearchSpending(game, clientID),
      });

      // update all airbases with new available planes
      const planeDesigns = getPlaneDesignsByGen(player.nationalityIndex, player.gen);
      const airbases = getEntitiesByType(game, 'AIRBASE', clientID);
      for (const airbase of airbases) {
        for (const name in planeDesigns) {
          airbase.planes[name] = 0;
        }
      }
    }
  }
};


const updateProduction = (game) => {
  for (const clientID in game.players) {
    const player = game.players[clientID];
    const numFactories = getNumBuilding(game, clientID, 'FACTORY');
    const numMegaFactories = getNumBuilding(game, clientID, 'FACTORY', 'isMega');
    const {productionRate, megaMultiplier, msPerTick} = game.config;

    // work on one plane per factory
    let numProduced = 0;
    let nextProductionQueue = [];
    for (let i = 0; i < player.productionQueue.length && i < numFactories; i++) {
      const production = player.productionQueue[i];
      let mult = 1;
      if (i < numMegaFactories) {
        mult = megaMultiplier;
      }
      const cost = Math.round(productionRate * mult * msPerTick / 1000);
      const {result, amount} = subtractWithDeficit(
        production.cost,
        Math.min(player.money, cost),
      );
      player.money -= amount;
      production.cost = result;

      // make completed plane
      if (production.cost <= 0) {
        // assign airbase
        let airbase = game.entities[production.airbaseID];
        if (!airbase) { // pick random airbase if previous got destroyed
          airbase = oneOf(getEntitiesByType(game, 'AIRBASE', clientID));
        }
        if (!airbase) {
          // nextProductionQueue.push(production);
          continue; // if no airbases at all just continue
        }
        // update stats beforehand too
        game.stats[clientID].airforceValue.push({
          x: game.time, y: getTotalAirforceValue(game, clientID),
        });

        // make the plane
        airbase.planes[production.name] += 1;

        // update stats
        game.stats[clientID].airforceValue.push({
          x: game.time, y: getTotalAirforceValue(game, clientID),
        });
        numProduced++;
      } else {
        nextProductionQueue.push(production);
      }
    }
    player.productionQueue = [...nextProductionQueue, ...player.productionQueue.slice(numFactories)];
  }
};


const sendPlayerUpdates = (session, game, socketClients) => {
  for (const clientID in game.players) {
    const clientAction = {
      type: 'SET_PLAYER_STATE',
      clientID,
      player: {...game.players[clientID]},
    };
    if (!socketClients[clientID]) continue;
    socketClients[clientID].emit("receiveAction", clientAction);
  }
};


const updateExplosions = (game) => {
  for (const explosion of getEntitiesByType(game, 'EXPLOSION')) {
    explosion.age++;
    if (explosion.age > explosion.duration) {
      delete game.entities[explosion.id];
    }
  }
}


const moveAndFight = (session, game, socketClients) => {
  const genDogfightBonus = game.config.genDogfightBonus;

  for (const entityID in game.entities) {
    entity = game.entities[entityID];
    if (!entity.speed) continue;

    // check for enemy already targeted
    let targetPos = entity.targetPos;
    let isEnemy = false;
    if (entity.targetEnemy) {
      let targetEntity = game.entities[entity.targetEnemy];
      if (targetEntity && dist(targetEntity.position, entity.position) > entity.vision) {
        targetEntity = null;
      }
      if (!targetEntity) {
        // if enemy is dead or out of range
        entity.targetEnemy = null;
      } else {
        isEnemy = true;
        targetPos = getInterceptPos(game, entity, targetEntity);
      }
    }

    const nearestAirbase = getNearestAirbase(game, entity);
    // planes without target go back to airbase
    // unless they're drones in which case they die
    // TODO: planes shouldn't die if there are no airbases
    let returningToBase = false;
    if (entity.isPlane && targetPos == null) {
      if (!entity.isDrone && nearestAirbase) {
        targetPos = getInterceptPos(game, entity, nearestAirbase);
        returningToBase = true;
      } else if (entity.isDrone || !nearestAirbase) {
        delete game.entities[entityID];
      }
    }

    // arrived at target
    let targetSpeed = 0;
    if (entity.targetEnemy) {
      targetSpeed = game.entities[entity.targetEnemy].speed;
    }
    if (
      targetPos != null &&
      dist(targetPos, entity.position) < entity.speed + targetSpeed + 1
    ) {
      if (returningToBase) { // we've arrived at home airbase
        // check if you're carrying planes, also dock those
        if (entity.planes) {
          for (const name in entity.planes) {
            if (entity.planes > 0) { // HACK to avoid returning planes with next-gen capacity
              nearestAirbase.planes[name] += entity.planes[name];
            }
          }
        }
        delete game.entities[entity.id];
        nearestAirbase.planes[entity.name]++;

      } else if (isEnemy) {
        const targetEntity = game.entities[entity.targetEnemy];
        // if enemy can dogfight, then flip a coin whether you die instead,
        // with boost based on who is higher generation
        // OR do the same calculation for bombers vs hardened cities
        if (
          (
            (entity.isFighter && (targetEntity.isFighter || targetEntity.isDogfighter))
            || (entity.isBomber && targetEntity.isHardened)
          )
          && (Math.random() < 0.5 + (genDogfightBonus * (targetEntity.gen - entity.gen)) || targetEntity.isShielded)
          && (targetEntity.ammo > 0 || targetEntity.isHardened)
          && !(entity.isShielded && entity.ammo > 0) // if you are shielded then you always win
        ) {
          game.stats[entity.clientID].airforceValue.push({
            x: game.time, y: getTotalAirforceValue(game, entity.clientID),
          });
          delete game.entities[entityID];
          targetEntity.kills++;
          const explosion = makeExplosion(
            entity.position,
            entity.isBuilding ? 25 : 10,
            1200 / game.config.msPerTick,
            entity.clientID,
          );
          game.entities[explosion.id] = explosion;
          if (targetEntity.ammo) {
            targetEntity.ammo--;
          }
          if (targetEntity.ammo == 0) { // return to base
            targetEntity.targetPos = null;
            targetEntity.targetEnemy = null;
          }
          game.stats[entity.clientID].airforceValue.push({
            x: game.time, y: getTotalAirforceValue(game, entity.clientID),
          });
          continue;
        }

        // kill target, compute aces, ammo
        entity.ammo--;
        entity.kills++;
        if (entity.ammo == 0) { // return to base
          entity.targetPos = null;
          entity.targetEnemy = null;
        }
        const explosion = makeExplosion(
          targetEntity.position,
          targetEntity.isBuilding ? 25 : 10,
          1200 / game.config.msPerTick,
          entity.clientID,
        );
        game.entities[explosion.id] = explosion;

        // update stats based on kill type before the thing is destroyed too
        // to get a nice step function
        if (targetEntity.isBuilding) {
          if (targetEntity.type == 'CITY') {
            game.stats[targetEntity.clientID].CITY.push({
              x: game.time, y: getIncome(game, targetEntity.clientID),
            });
          } else {
            game.stats[targetEntity.clientID][targetEntity.type].push({
              x: game.time, y: getNumBuilding(game, targetEntity.clientID, targetEntity.type),
            });
          }
        } else {
          game.stats[targetEntity.clientID].airforceValue.push({
            x: game.time, y: getTotalAirforceValue(game, targetEntity.clientID),
          });
        }

        // do the actual destroying
        delete game.entities[targetEntity.id];

        // update stats based on kill type
        if (targetEntity.isBuilding) {
          if (targetEntity.type == 'CITY') {
            game.stats[targetEntity.clientID].CITY.push({
              x: game.time, y: getIncome(game, targetEntity.clientID),
            });
          } else {
            game.stats[targetEntity.clientID][targetEntity.type].push({
              x: game.time, y: getNumBuilding(game, targetEntity.clientID, targetEntity.type),
            });
          }
        } else {
          game.stats[targetEntity.clientID].airforceValue.push({
            x: game.time, y: getTotalAirforceValue(game, targetEntity.clientID),
          });
        }

        if (
          getNumBuilding(game, targetEntity.clientID, 'CITY') == 0 ||
          getNumBuilding(game, targetEntity.clientID, 'AIRBASE') == 0
        ) {
          return doGameOver(session, socketClients, null, entity.clientID);
        }
      } else { // target wasn't an enemy
        entity.targetPos = null; // return to airbase on next tick
      }
    }

    // do the move
    if (targetPos != null) {
      const moveVec = makeVector(
        vectorTheta(subtract(targetPos, entity.position)),
        entity.speed,
      );
      entity.position = add(entity.position, moveVec);
    }
    if (entity.fuel) {
      entity.fuel -= entity.speed;
    }

    // compute running out of fuel
    if (entity.fuel <= 0) {
      game.stats[entity.clientID].airforceValue.push({
        x: game.time, y: getTotalAirforceValue(game, entity.clientID),
      });
      delete game.entities[entity.id];
      game.stats[entity.clientID].airforceValue.push({
        x: game.time, y: getTotalAirforceValue(game, entity.clientID),
      });
    }
  }
}


const computeVisionAndTargeting = (session, game, socketClients) => {
  for (const id of session.clients) {
    const otherClientID = getOtherClientID(session, id);
    const visibleEntities = {};
    for (const entityID in getEntitiesByPlayer(game, id)) {
      const entity = game.entities[entityID];
      for (const otherID in getEntitiesByPlayer(game, otherClientID)) {

        const other = game.entities[otherID];
        if (other.hasBeenDiscovered) { // things you've already seen stay discovered
          visibleEntities[otherID] = other;
        }
        // stealth
        let vision = entity.vision;
        if (other.isStealth) {
          // vision = vision * game.config.stealthVisionReduction;
          vision = game.config.stealthVisionRadius;
        }

        // check if visible
        if (dist(entity.position, other.position) <= vision) {
          visibleEntities[otherID] = other;
          if (other.isPlane) {
            game.players[id].planeTypesSeen[other.name] = true;
          }
          if (other.isBuilding) {
            other.hasBeenDiscovered = true;
          }
          // target:
          if (
            entity.isFighter && entity.ammo > 0 &&
            entity.targetEnemy == null && other.isPlane &&
            numTimesTargeted(game, otherID) < 2
          ) {
            entity.targetEnemy = otherID;
          }
          if (
            entity.isBomber && entity.ammo > 0 &&
            entity.targetEnemy == null && other.isBuilding &&
            (entity.isNuclear || other.type != 'CITY') &&
            numTimesTargeted(game, otherID) < 2
          ) {
            entity.targetEnemy = otherID;
          }
        }
      }
    }

    const clientAction = {
      type: "SET_ENTITIES",
      entities: {...getEntitiesByPlayer(game, id), ...visibleEntities},
    };
    socketClients[id].emit("receiveAction", clientAction);
  }
}


const doGameOver = (session, socketClients, clientID, winner, disconnect) => {
  const game = session.game;
  if (!game) return;

  // update final stats
  for (let id in game.players) {
    const player = game.players[id];
    game.stats[id].generation.push({
      x: game.time, y: getTotalResearchSpending(game, id),
    });
  }


  emitToSession(
    session, socketClients,
    {type: 'GAME_OVER', winner, disconnect, stats: game.stats, time: game.time},
    clientID, true, // include self
  );
  clearInterval(game.tickInterval);
  game.tickInterval = null;
}

module.exports = {tick, doGameOver};
