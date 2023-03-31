
const leaveSession = (state, clientID) => {
  const {sessions, socketClients, clientToSession} = state;
  const session = sessions[clientToSession[clientID]];
  if (!session) return;
  session.clients = session.clients.filter(id => id != clientID);
  emitToAllClients(socketClients,
    {type: 'UPDATE_SESSION', session}, clientID, true /* includeSelf */
  );
  if (session.clients.length == 0) {
    endSession(state, clientID, session.id);
  }
}

const endSession = (state, clientID, sessionID) => {
  const {sessions, socketClients, clientToSession} = state;
  delete sessions[sessionID];
  for (const id in clientToSession) {
    if (clientToSession[id] == sessionID) {
      delete clientToSession[id];
    }
  }
  emitToAllClients(socketClients,
    {type: 'END_SESSION', sessionID}, clientID, true /* include self */
  );
}

const emitToAllClients = (
  socketClients, action, clientID, includeSelf,
) => {
  for (const id in socketClients) {
    if (id == clientID && !includeSelf) continue;
    const socket = socketClients[id];
    socket.emit('receiveAction', action);
  }
};

const emitToSession = (
  session, socketClients,
  action, clientID, includeSelf,
) => {
  for (const id of session.clients) {
    if (id == clientID && !includeSelf) continue;
    const socket = socketClients[id];
    socket.emit('receiveAction', action);
  }
}

const sessionReducer = (state, action, clientID, socket, newSession) => {
  const {sessions, socketClients, clientToSession} = state;

  switch (action.type) {
    case 'CREATE_SESSION': {
      const {name} = action;
      let session = newSession(clientID);
      if (name) {
        session.name = name;
      }
      sessions[session.id] = session;
      clientToSession[clientID] = session.id;
      emitToAllClients(socketClients,
        {...action, session, clientID}, clientID, true /* includeSelf */
      );
      // tell the client that just hosted what the settings are:
      // This is needed to prevent weird settings bugs when going from one game to the next
      socket.emit('receiveAction', {type: 'EDIT_SESSION_PARAMS', ...session.config});
      break;
    }
    case 'JOIN_SESSION': {
      const {sessionID, AI} = action;
      const session = sessions[sessionID];
      if (!session) break;

      if (AI) {
        clientID = -1;
      }

      session.clients.push(clientID);
      clientToSession[clientID] = session.id;

      // update dynamic config items
      session.dynamicConfig[clientID] = {};
      session.dynamicConfig[clientID].money = session.config.startingMoney;
      session.dynamicConfig[clientID].planes = {};
      session.dynamicConfig[clientID].planeDesigns = {};

      if (AI) {
        session.dynamicConfig[clientID].AI = true;
        session.dynamicConfig[clientID].planeDesigns = {
          "Tu-99": {
            "name":"Tu-99","fuel":1300,"vision":40,"speed":1.5,
            "type":"BOMBER","cost":370,"productionTime":10000
          },
          "MIG-17":{
            "name":"MIG-17","fuel":750,"vision":60,"speed":2,
            "type":"FIGHTER","cost":385,"productionTime":10000,
          },
        }
        session.dynamicConfig[clientID].planes = {
          "Tu-99": 10,
          "MIG-17": 10,
        }
      }

      // tell the rest of the clients this one joined the session
      emitToAllClients(socketClients, {...action, clientID}, clientID, true);

      if (!AI) {
        // tell the client that just joined what the settings are:
        socket.emit('receiveAction', {type: 'EDIT_SESSION_PARAMS', ...session.config});
        for (const alreadyJoinedClientID of session.clients) {
          if (session.dynamicConfig[alreadyJoinedClientID].planeDesigns) {
            for (const name in session.dynamicConfig[alreadyJoinedClientID].planeDesigns) {
              socket.emit('receiveAction',
                {type: 'ADD_PLANE_DESIGN',
                plane: session.dynamicConfig[alreadyJoinedClientID].planeDesigns[name],
                clientID: alreadyJoinedClientID},
              );
            }
          }
        }
      }
      break;
    }
    case 'LEAVE_SESSION': {
      const session = sessions[clientToSession[clientID]];
      leaveSession(state, clientID);
      break;
    }
    case 'END_SESSION': {
      const {sessionID} = action;
      endSession(state, clientID, sessionID);
      break;
    }
    case 'READY': {
      // NOTE: only works for 2 player
      const session = sessions[clientToSession[clientID]];
      session.ready = true;
      emitToAllClients(socketClients,
        {type: 'UPDATE_SESSION', session: {...session, ready: true}},
        clientID, true /* includeSelf */
      );
      break;
    }
    case 'START': {
      // NOTE: this only handles the session aspect of starting a game, but doesn't
      // handle actually starting the game, that should happen in the gameReducer
      const session = sessions[clientToSession[clientID]];
      session.started = true;
      emitToAllClients(socketClients,
        {type: 'UPDATE_SESSION', session: {...session, started: true}},
        clientID, true /* includeSelf */
      );
      break;
    }
  }

  return state;
};


module.exports = {
  leaveSession, emitToAllClients, emitToSession,
  sessionReducer, endSession,
}
