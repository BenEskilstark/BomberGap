
const {config} = require('./config');

/**
 * Socket.io functions
 */
let socket = null;
const setupSocket = (dispatch) => {
  socket = io(config.URL, {path: config.path});
  socket.on('receiveAction', (action) => {
    // console.log("received", action);
    dispatch(action);
  });
  return socket;
}

const dispatchToServer = (action) => {
  try {
    socket.emit('dispatch', action);
  } catch (e) {
    console.log(e);
  }
};

window.dispatchToServer = dispatchToServer;

module.exports = {
  dispatchToServer,
  setupSocket,
};
