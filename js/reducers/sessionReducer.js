
const {getSession} = require('../selectors/sessions');

const sessionReducer = (state, action) => {
  if (state === undefined) return {};

  switch (action.type) {
    case 'CREATE_SESSION': {
      const {clientID, session} = action;
      if (clientID != state.clientID) {
        return {
          ...state,
          sessions: {...state.sessions, [session.id]: {...session}},
        };
      }
      return {
        ...state,
        sessions: {...state.sessions, [session.id]: session},
        dynamicConfig: {
          [clientID]: {
            nationalityIndex: 0,
          }
        },
      };
    }
    case 'JOIN_SESSION': {
      const {sessionID, clientID} = action;
      const session = state.sessions[sessionID];
      session.clients.push(clientID);
      if (clientID != state.clientID) {
        return {
          ...state,
          sessions: {...state.sessions, [sessionID]: {...session}},
        };
      }
      return {
        ...state,
        sessions: {...state.sessions, [sessionID]: {...session}},
        dynamicConfig: {
          [clientID]: {
            nationalityIndex: 1,
          }
        },
      };
    }
    case 'UPDATE_SESSION': {
      const {session} = action;
      return {
        ...state,
        sessions: {...state.sessions, [session.id]: {...session}},
      };
    }
    case 'END_SESSION': {
      const {sessionID} = action;
      if (getSession(state)?.id == sessionID) {
        state.screen = 'LOBBY';
        state.game = null;
        state.modal = null;
        state.dynamicConfig = {};
      }
      delete state.sessions[sessionID];
      return {...state};
    }

    case 'EDIT_SESSION_PARAMS': {
      delete action.type;
      for (const property in action) {
        state.config[property] = action[property];
      }
      return {...state};
    }
    case 'SET_NATIONALITY_INDEX': {
      const {nationalityIndex, clientID} = action;
      if (state.dynamicConfig[clientID]) {
        state.dynamicConfig[clientID].nationalityIndex = nationalityIndex;
      } else {
        state.dynamicConfig[clientID]= {nationalityIndex};
      }
      return {...state};
    }
  }

  return state;
};

module.exports = {sessionReducer};
