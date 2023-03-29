const {
  leaveSession, emitToSession, emitToAllClients,
} = require('../sessions');
const {
  initGameState, makeCarrier, makePlane,
} = require('./state');
const {
  makeVector, vectorTheta, subtract, add, dist, equals,
} = require('bens_utils').vectors;
const {
  getEntitiesByPlayer, getNearestCarrier, getOtherClientID,
  getNumCarriers,
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
      const targetEntity = game.entities[entity.targetEnemy];
      if (!targetEntity) {
        // if enemy is dead
        entity.targetEnemy = null;
      } else {
        isEnemy = true;
        targetPos = {...targetEntity.position};
      }
    }

    // no target
    if (targetPos == null) {
      // planes without target go back to ship
      if (entity.isPlane) {
        targetPos = {...getNearestCarrier(game, entity).position};
      }
    }

    // arrived at target
    if (targetPos != null && dist(targetPos, entity.position) < 2) {
      if (entity.isShip) {
        entity.targetPos = null; // ships can stay still
      } else if (entity.targetPos == null) {
        // we've arrived at home carrier
        delete game.entities[entity.id];
        getNearestCarrier(game, entity).planes[entity.type]++;
      } else if (isEnemy) {
        // kill the enemy
        const targetEntity = game.entities[entity.targetEnemy];
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
        if (targetEntity.type == 'CARRIER') {
          delete game.entities[targetEntity.id];
          game.stats[targetEntity.clientID].ships_sunk++;
          if (getNumCarriers(game, targetEntity.clientID) == 0) {
            doGameOver(session, socketClients, entity.clientID, entity.clientID);
            return state;
          }
        } else if (targetEntity.type == 'FIGHTER') {
          delete game.entities[targetEntity.id];
          game.stats[targetEntity.clientID].fighters_shot_down++;
          entity.kills++;
          if (entity.kills == 5) {
            game.stats[entity.clientID].fighter_aces++;
          }
        } else if (targetEntity.type == 'BOMBER') {
          delete game.entities[targetEntity.id];
          game.stats[targetEntity.clientID].bombers_shot_down++;
          entity.kills++;
          if (entity.kills == 5) {
            game.stats[entity.clientID].fighter_aces++;
          }
        }
      } else {
        entity.targetPos = null; // return to carrier on next tick
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
      if (entity.type == 'FIGHTER') {
        game.stats[entity.clientID].fighters_no_fuel++;
      } else if (entity.type == 'BOMBER') {
        game.stats[entity.clientID].bombers_no_fuel++;
      }
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
        if (dist(entity.position, other.position) <= entity.vision) {
          visibleEntities[otherID] = other;
          // target:
          if (entity.type == 'FIGHTER' && entity.targetEnemy == null && other.isPlane) {
            entity.targetEnemy = otherID;
          }
          if (entity.type == 'BOMBER' && entity.targetEnemy == null && other.isShip) {
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

module.exports = {tick};