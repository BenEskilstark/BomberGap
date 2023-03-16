const http = require('http');
const {Server} = require("socket.io");
const {
  leaveSession, emitToSession, emitToAllClients,
  sessionReducer,
} = require('./sessions');

// ------------------------------------------------------------------------------
// Socket initialization
// ------------------------------------------------------------------------------

// Use like:
// const server = initSocketServer(app, newSession, gameReducer);
// where:
//  - newSession: (clientID) => {id, clients: [clientID], name, [...game state]}
//  - gameReducer: (state, action, clientID, socket) => state,
// server.listen(PORT);
const initSocketServer = (
  expressApp, newSession, gameReducer,
) => {
  const server = http.createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: "https://www.benhub.io",
      methods: ["GET", "POST"],
    },
  });
  initIO(io, newSession, gameReducer);
  return server;
}

// ------------------------------------------------------------------------------
// Socket functions
// ------------------------------------------------------------------------------
const initIO = (io, newSession, gameReducer) => {
  const state = {
    sessions: {}, // SessionID -> {id: SessionID, clients: Array<ClientID>, }
    socketClients: {}, // clientID -> socket
    clientToSession: {}, // clientID -> SessionID
  };
  let nextClientID = 1;
  io.on('connection', (socket) => {
    const {sessions, socketClients, clientToSession} = state;
    // TODO: client should be able to store ID in localStorage and
    // update server with it
    const clientID = nextClientID++;
    console.log("client connect", clientID);

    // on client connect
    socketClients[clientID] = socket;
    socket.emit('receiveAction', {clientID}); // NOTE: must use enhancedReducer
    // tell the client what sessions exist but remove game info from running sessions
    let sessionsToSend = {};
    for (const id in sessions) {
      sessionsToSend[id] = {};
      for (const prop in sessions[id]) {
        if (prop == 'game') continue;
        sessionsToSend[id][prop] = sessions[id][prop];
      }
    }
    socket.emit('receiveAction', {sessions: sessionsToSend});

    // needed for ticking
    function dispatch(action) {
      gameReducer(state, action, clientID, socket, dispatch);
    }

    socket.on('dispatch', (action) => {
      if (action == null) {
        return;
      }
      // console.log('client: ' + clientID + ' dispatches ' + action.type);
      switch (action.type) {
        case 'CREATE_SESSION':
        case 'JOIN_SESSION':
        case 'LEAVE_SESSION':
        case 'END_SESSION':
        case 'READY':
          return sessionReducer(state, action, clientID, socket, newSession);
        case 'START':
          sessionReducer(state, action, clientID, socket, newSession);
          // fall through
        default:
          return gameReducer(state, action, clientID, socket, dispatch);
      }
    });

    socket.on('disconnect', () => {
      console.log(`client ${clientID} disconnected`);
      dispatch({type: 'STOP'});
      leaveSession(state, clientID);
    });
  });
}


module.exports = {initSocketServer};
