const React = require('react');
const {gameReducer} = require('./gameReducer');
const {sessionReducer} = require('./sessionReducer');
const {modalReducer} = require('./modalReducer');
const GameOverModal = require('../UI/GameOverModal.react');
const {mouseReducer, hotKeyReducer} = require('bens_ui_components');
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
      const {entities} = action;
      const game = {
        ...initGameState(state.config, state.clientID, state.clientConfig.planeDesigns),
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
    case 'BUY_PLANE': {
      const {plane} = action;
      if (plane.cost > state.clientConfig.money) return state;
      if (!state.clientConfig.planes[plane.name]) {
        state.clientConfig.planes[plane.name] = 0;
      }
      state.clientConfig.planes[plane.name]++;
      state.clientConfig.money -= plane.cost;
      return {...state};
    }
    case 'ADD_PLANE_DESIGN': {
      const {clientID, plane} = action;
      if (!state.clientConfig.planeDesigns[clientID]) {
        state.clientConfig.planeDesigns[clientID] = {};
      }
      state.clientConfig.planeDesigns[clientID][plane.name] = plane;
      if (clientID == state.clientID) {
        state.clientConfig.planes[plane.name] = 0;
      }
      return {...state};
    }
    case 'SET':
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
    clientConfig: {
      money: config.startingMoney,
      planes: {}, // {[name]: number}
      planeDesigns: {}, // {[clientID]: {[name]: Plane}}
    },
  };
}

const initGameState = (config, clientID, planeDesigns) => {
  const game = {
    worldSize: {...config.worldSize},
    canvasSize: {
      width: Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9),
      height: window.innerHeight * 0.9},
    entities: {},
    fogLocations: [],
    selectedIDs: [],
    marquee: null,
    clientID,
    clickMode: 'LAUNCH',
    launchName: Object.keys(planeDesigns[clientID])[0],

    planeDesigns,

    hotKeys: {
      onKeyDown: {},
      onKeyPress: {},
      onKeyUp: {},
      keysDown: {},
    },
  };

  return game;
}

module.exports = {rootReducer, initState};
