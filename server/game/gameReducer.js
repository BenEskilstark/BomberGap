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
const {tick, doGameOver} = require('./tick');


const gameReducer = (state, action, clientID, socket, dispatch) => {
  const {sessions, socketClients, clientToSession} = state;

  let session = sessions[clientToSession[clientID]];
  if (!session) return state;

  const game = session.game;
  switch (action.type) {
    case 'ADD_PLANE_DESIGN': {
      const {clientID, plane} = action;
      if (!session.dynamicConfig[clientID]) {
        session.dynamicConfig[clientID] = {};
      }
      if (!session.dynamicConfig[clientID].planeDesigns) {
        session.dynamicConfig[clientID].planeDesigns = {};
      }
      if (!session.dynamicConfig[clientID].planes) {
        session.dynamicConfig[clientID].planes = {};
      }
      if (!session.dynamicConfig[clientID].planes[plane.name]) {
        session.dynamicConfig[clientID].planes[plane.name] = 0;
      }
      session.dynamicConfig[clientID].planeDesigns[plane.name] = plane;
      emitToSession(session, socketClients, action, clientID);
      break;
    }
    case 'BUY_PLANE': {
      const {plane} = action;
      if (plane.cost > session.dynamicConfig[clientID].money) return session;
      session.dynamicConfig[clientID].money -= plane.cost;
      if (!session.dynamicConfig[clientID].planes[plane.name]) {
        session.dynamicConfig[clientID].planes[plane.name] = 0;
      }
      session.dynamicConfig[clientID].planes[plane.name]++;
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
        ...initGameState(session.clients, session.config, session.dynamicConfig),
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
        }
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
      if (!airbase || airbase.planes[name] <= 0) break;
      airbase.planes[name]--;

      const plane = makePlane(
        clientID, {...airbase.position},
        game.planeDesigns[clientID][name].type,
        targetPos,
        {...game.planeDesigns[clientID][name]},
      );
      game.entities[plane.id] = plane;

      // update sorties stat
      if (plane.type === 'FIGHTER') {
        game.stats[clientID].fighter_sorties++;
      } else if (plane.type === 'BOMBER') {
        game.stats[clientID].bomber_sorties++;
      } else if (plane.type === 'RECON') {
        game.stats[clientID].recon_sorties++;
      }

      const clientAction = {
        ...action,
        plane,
      };

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
