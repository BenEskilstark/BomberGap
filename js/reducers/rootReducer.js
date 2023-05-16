const React = require('react');
const {gameReducer} = require('./gameReducer');
const {sessionReducer} = require('./sessionReducer');
const {modalReducer} = require('./modalReducer');
const GameOverModal = require('../UI/GameOverModal.react');
const {mouseReducer, hotKeyReducer} = require('bens_ui_components');
const {getPlaneDesignsByGen} = require('../selectors/selectors');
const {config} = require('../config');
const {deepCopy} = require('bens_utils').helpers;

const rootReducer = (state, action) => {
  if (state === undefined) return initState();

  switch (action.type) {
    case 'CREATE_SESSION':
    case 'JOIN_SESSION':
    case 'UPDATE_SESSION':
    case 'END_SESSION':
    case 'EDIT_SESSION_PARAMS':
      return sessionReducer(state, action);
    case 'START': {
      const {entities, clientIDs} = action;
      const game = {
        ...initGameState(state.config, state.clientID, clientIDs),
        clientID: state.clientID,
        entities,
        // prevTickTime = new Date().getTime();
        // tickInterval: setInterval(
        //   // HACK: dispatch is only available via window
        //   () => dispatch({type: 'TICK'}),
        //   config.msPerTick,
        // ),
      };
      return {
        ...state,
        screen: "GAME",
        game,
      };
    }
    case 'GAME_OVER': {
      const {winner} = action;

      return {
        ...state,
        clientConfig: {
          money: config.startingMoney,
          planes: {}, // {[name]: number}
          planeDesigns: {}, // {[clientID]: {[name]: Plane}}
        },
        modal: <GameOverModal {...action} />
      };
    }
    case 'SET_SCREEN': {
      const {screen} = action;
      const nextState = {...state, screen};
      if (screen == 'LOBBY') {
        nextState.game = null;
      }
      return nextState;
    }
    case 'SET_MOUSE_DOWN':
    case 'SET_MOUSE_POS':
      return {
        ...state,
        mouse: mouseReducer(state.mouse, action),
      };
    case 'SET_HOTKEY':
    case 'SET_KEY_PRESS': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          hotKeys: hotKeyReducer(state.game.hotKeys, action),
        }
      }
    }
    case 'SET_MODAL':
    case 'DISMISS_MODAL':
      return modalReducer(state, action);
    case 'SET':
    case 'SET_PLAYER_STATE':
    case 'SELECT_ENTITIES':
    case 'SET_ENTITIES': {
      if (!state.game) return state;
      return {
        ...state,
        game: gameReducer(state.game, action),
      };
    }
  }
  return state;
};


//////////////////////////////////////
// Initializations
const initState = () => {
  return {
    screen: 'LOBBY',
    game: null,
    modal: null,
    sessions: {},
    config: deepCopy(config),
  };
}

const initGameState = (config, clientID, clientIDs) => {
  const players = {};
  let nationalityIndex = 0;
  for (const id of clientIDs) {
    players[id] = {
      nationalityIndex,
      money: config.startingMoney,
      gen: 1,
      productionQueue: [], // {name: string, cost: remaining cost, airbaseID}
      researchProgress: {gen: 2, cost: config.genCost[2], isStarted: false},
      planeTypesSeen: {},
    }
    nationalityIndex++;
  }

  console.log(players, clientID, clientIDs);

  const game = {
    config: deepCopy(config),
    worldSize: {...config.worldSize},
    canvasSize: {
      width: Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9),
      height: window.innerHeight * 0.9,
    },
    entities: {},
    fogLocations: [],

    selectedIDs: [],
    marquee: null,

    clientID,
    clientIDs,

    clickMode: 'MOVE',
    launchName: Object.keys(getPlaneDesignsByGen(players[clientID].nationalityIndex, 1))[0],
    showStats: true,

    hotKeys: {
      onKeyDown: {},
      onKeyPress: {},
      onKeyUp: {},
      keysDown: {},
    },

    players,
  };

  return game;
}

module.exports = {rootReducer, initState};
