const {
  leaveSession, emitToSession, emitToAllClients,
} = require('../sessions');
const {
  initGameState, makeBuilding, makePlane,
} = require('./state');
const {
  makeVector, vectorTheta, subtract, add, dist, equals,
} = require('bens_utils').vectors;
const {
  getEntitiesByPlayer, getNearestAirbase, getOtherClientID,
  getPlaneDesignsUpToGen, getEntitiesByType, getNumBuilding,
} = require('./selectors');
const {throwDart} = require('./utils');
const {tick, doGameOver} = require('./tick');


const gameReducer = (state, action, clientID, socket, dispatch) => {
  const {sessions, socketClients, clientToSession} = state;

  let session = sessions[clientToSession[clientID]];
  if (!session) return state;

  const game = session.game;
  switch (action.type) {
    case 'BUILD_PLANE': {
      const {name, airbaseID} = action;
      const nationalityIndex = game.players[clientID].nationalityIndex;
      game.players[clientID].productionQueue.push({
        name,
        cost: session.config.planeDesigns[nationalityIndex][name].cost,
        airbaseID,
      });
      break;
    }
    case 'CANCEL_PLANE': {
      const {productionIndex} = action;
      const productionQueue = game.players[clientID].productionQueue;
      const nextQueue = [];
      for (let i = 0; i < productionQueue.length; i++) {
        if (i != productionIndex) {
          nextQueue.push(productionQueue[i]);
        }
      }
      game.players[clientID].productionQueue = nextQueue;
      break;
    }
    case 'BUY_BUILDING': {
      const {buildingType} = action;
      let cost = 0;
      switch (buildingType) {
        case 'AIRBASE':
          cost = session.config.airbaseCost;
          break;
        case 'LAB':
          cost = session.config.labCost;
          break;
        case 'FACTORY':
          cost = session.config.factoryCost;
          break;
        case 'CITY':
          const numCities = getNumBuilding(game, clientID, 'CITY');
          cost = session.config.cityCost * Math.pow(2, numCities);
      }
      if (cost > game.players[clientID].money) return;
      game.players[clientID].money -= cost;

      const {nationalityIndex, gen} = game.players[clientID];
      const position = throwDart(game, nationalityIndex, game.worldSize);
      let building = null;
      if (buildingType == 'AIRBASE') {
        const planes = {};
        const planeDesigns = getPlaneDesignsUpToGen(nationalityIndex, gen);
        for (const name in planeDesigns) {
          planes[name] = 0;
        }
        building = makeBuilding(clientID, position, buildingType, planes);
      } else {
        building = makeBuilding(clientID, position, buildingType);
      }
      game.entities[building.id] = building;

      break;
    }
    case 'UPGRADE_BUILDING': {
      const {buildingID, upgradeType} = action;
      let cost = session.config.megaCost;
      if (upgradeType == 'isHardened') {
        cost = session.config.hardenedCost;
      }
      if (cost > game.players[clientID].money) return;

      const building = game.entities[buildingID];
      if (!building) return;
      if (building.isMega || building.isHardened) return;

      building[upgradeType] = true;
      if (upgradeType == 'isHardened') {
        building.gen = session.config.hardenedGen;
      }

      break;
    }
    case 'START_RESEARCH': {
      const {nationalityIndex, researchProgress} = game.players[clientID];
      researchProgress.isStarted = true;
      break;
    }
    case 'PAUSE_RESEARCH': {
      const {nationalityIndex, researchProgress} = game.players[clientID];
      researchProgress.isStarted = false;
      break;
    }

    case 'EDIT_SESSION_PARAMS': {
      delete action.type;
      for (const property in action) {
        session.config[property] = action[property];
      }
      emitToSession(session, socketClients,
        {type: 'EDIT_SESSION_PARAMS', ...action}, clientID, true,
      );
      break;
    }
    case 'START': {
      console.log("Start", session.id);
      session.game = {
        ...initGameState(session.clients, session.config),
        prevTickTime: new Date().getTime(),
        tickInterval: setInterval(
          // HACK: dispatch is only available via dispatch function above
          () => dispatch({type: 'TICK'}),
          session.config.msPerTick,
        ),
      };

      for (const id of session.clients) {
        const clientAction = {
          type: "START",
          entities: getEntitiesByPlayer(session.game, id),
          clientIDs: session.clients,
        };
        socketClients[id].emit('receiveAction', clientAction);
      }
      break;
    }
    case 'STOP': {
      doGameOver(session, socketClients, clientID, null, true);
      return state;
    }

    case 'LAUNCH_PLANE': {
      const {name, airbaseID, targetPos} = action;
      const airbase = game.entities[airbaseID];

      // check that this plane is launchable
      if (!airbase || airbase.planes[name] == null || airbase.planes[name] <= 0) break;
      airbase.planes[name]--;

      const nationalityIndex = game.players[clientID].nationalityIndex;

      const plane = makePlane(
        clientID, {...airbase.position},
        targetPos, {...session.config.planeDesigns[nationalityIndex][name]},
      );
      game.entities[plane.id] = plane;

      // equip plane with drones and/or fighters
      if (plane.planeCapacity) {
        let planesAssigned = 0;
        for (const planeName of plane.planeTypes) {
          while (airbase.planes[planeName] > 0 && planesAssigned < plane.planeCapacity) {
            plane.planes[planeName]++;
            airbase.planes[planeName]--;
            planesAssigned++;
          }
        }
      }

      // TODO: update sorties stat

      // don't need to send since it'll get sent with the next tick
      // const clientAction = {...action, plane};
      // emitToSession(session, socketClients, clientAction, clientID, true);
      break;
    }
    case 'SET_TARGET': {
      const {entityID, targetPos} = action;
      const entity = game.entities[entityID];
      if (!entity) break;
      entity.targetPos = targetPos;

      // only need to send to clients that can see this entity
      // emitToSession(session, socketClients, action, clientID, true);
      break;
    }
    case 'TICK': {
      tick(game, session, socketClients);
      break;
    }
    default: {
      if (!session) break;
      emitToSession(session, socketClients, action, clientID);
    }
  }

  return state;
};

module.exports = {gameReducer};
