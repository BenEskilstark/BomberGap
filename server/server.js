
const express = require('express');
const path = require('path');
const cors = require('cors');
const {deepCopy} = require('bens_utils').helpers;
const {initSocketServer} = require('./socket');
const {gameReducer} = require('./game/gameReducer');
const {initGameState} = require('./game/state');
const {config} = require('../js/config');

const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));
app.use(cors());

console.log("server listening on port", port);

let nextSessionID = 1;
const newSession = (clientID) => {
  const id = nextSessionID++;
  return {
    id,
    name: "Game #" + id,
    clients: [clientID],
    config: deepCopy(config),
    game: null,
  };
}

const server = initSocketServer(app, newSession, gameReducer);
server.listen(port);
