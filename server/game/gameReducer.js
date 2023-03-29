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
      const {planeType, carrierID, targetPos} = action;
      const carrier = game.entities[carrierID];

      // check that this plane is launchable
      if (carrier.planes[planeType] <= 0) break;
      carrier.planes[planeType]--;

      // update sorties stat
      if (planeType == 'FIGHTER') {
        game.stats[clientID].fighter_sorties++;
      } else if (planeType == 'BOMBER') {
        game.stats[clientID].bomber_sorties++;
      }

      const plane = makePlane(clientID, {...carrier.position}, planeType, targetPos);
      game.entities[plane.id] = plane;

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


module.exports = {gameReducer};
