const {
  leaveSession, emitToSession, emitToAllClients,
} = require('../sessions');
const {
  initGameState, makeAirbase, makePlane,
} = require('./state');
const {
  makeVector, vectorTheta, subtract, add, dist, equals,
} = require('bens_utils').vectors;
const {
  getEntitiesByPlayer, getNearestAirbase, getOtherClientID,
  getNumAirbases,
} = require('./selectors');

const tick = (game, session, socketClients) => {
  game.time += 1;

  // move and fight entities
  for (const entityID in game.entities) {
    entity = game.entities[entityID];
    if (!entity.speed) continue;

    // check for enemy already targetted
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
        targetPos = {...targetEntity.position};
      }
    }

    // no target
    if (targetPos == null) {
      // planes without target go back to airbase
      if (entity.isPlane) {
        targetPos = {...getNearestAirbase(game, entity).position};
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
      if (entity.isBuilding) {
        entity.targetPos = null; // airbases can stay still
      } else if (entity.targetPos == null) {
        // we've arrived at home airbase
        delete game.entities[entity.id];
        getNearestAirbase(game, entity).planes[entity.name]++;
      } else if (isEnemy) {
        const targetEntity = game.entities[entity.targetEnemy];
        // kill the enemy
        // if enemy is targeting you too, then flip a coin whether you die instead
        if (entity.type == 'FIGHTER' && targetEntity.type == 'FIGHTER' &&
          targetEntity.targetEnemy == entityID && Math.random() < 0.5
        ) {
          delete game.entities[entityID];
          game.stats[entity.clientID].fighters_shot_down++;
          targetEntity.kills++;
          if (targetEntity.kills == 5) {
            game.stats[targetEntity.clientID].fighter_aces++;
          }

          continue;
        }
        let didKill = false;
        if (targetEntity.type == 'AIRBASE') {
          delete game.entities[targetEntity.id];
          game.stats[targetEntity.clientID].airbases_destroyed++;
          if (getNumAirbases(game, targetEntity.clientID) == 0) {
            doGameOver(session, socketClients, entity.clientID, entity.clientID);
            return;
          }
        } else if (targetEntity.type == 'FIGHTER') {
          delete game.entities[targetEntity.id];
          game.stats[targetEntity.clientID].fighters_shot_down++;
          didKill = true;
        } else if (targetEntity.type == 'BOMBER') {
          delete game.entities[targetEntity.id];
          game.stats[targetEntity.clientID].bombers_shot_down++;
          didKill = true;
        } else if (targetEntity.type == 'RECON') { // update stats based on RECON
          delete game.entities[targetEntity.id];
          game.stats[targetEntity.clientID].recons_shot_down++;
          didKill = true;
        }
        if (didKill) { // compute aces
          entity.kills++;
          if (entity.kills == 5) {
            game.stats[entity.clientID].fighter_aces++;
          }
        }
      } else {
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
      delete game.entities[entity.id];
      game.stats[entity.clientID].planes_no_fuel++;
    }
  }


  // compute vision and targetting
  for (const id of session.clients) {
    const otherClientID = getOtherClientID(session, id);
    const visibleEntities = {};
    for (const entityID in getEntitiesByPlayer(game, id)) {
      const entity = game.entities[entityID];
      for (const otherID in getEntitiesByPlayer(game, otherClientID)) {
        // if (visibleEntities[otherID]) continue;
        const other = game.entities[otherID];
        if (other.hasBeenDiscovered) {
          visibleEntities[otherID] = other;
        }
        if (dist(entity.position, other.position) <= entity.vision) {
          visibleEntities[otherID] = other;
          if (other.isBuilding) {
            other.hasBeenDiscovered = true;
          }
          // target:
          if (entity.type == 'FIGHTER' && entity.targetEnemy == null && other.isPlane) {
            entity.targetEnemy = otherID;
          }
          if (entity.type == 'BOMBER' && entity.targetEnemy == null && other.isBuilding) {
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
  emitToSession(
    session, socketClients,
    {type: 'GAME_OVER', winner, disconnect, stats: game.stats},
    clientID, true, // include self
  );
  clearInterval(game.tickInterval);
  game.tickInterval = null;
}

module.exports = {tick, doGameOver};
