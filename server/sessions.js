
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
      const {sessionID} = action;
      const session = sessions[sessionID];
      if (!session) break;

      session.clients.push(clientID);
      clientToSession[clientID] = session.id;

      // tell the rest of the clients this one joined the session
      emitToAllClients(socketClients, {...action, clientID}, clientID, true);

      // tell the client that just joined what the settings are:
      socket.emit('receiveAction', {type: 'EDIT_SESSION_PARAMS', ...session.config});
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
