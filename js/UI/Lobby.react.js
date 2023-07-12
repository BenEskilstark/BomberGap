const React = require('react');
const {
  Divider,
  Modal,
  TextField,
  Slider, Checkbox,
  CheckerBackground,
} = require('bens_ui_components');
const Button = require('./Components/Button.react');
const RadioPicker = require('./Components/RadioPicker.react');
const PlaneDesignDisplay = require('./PlaneDesignDisplay.react');
const {dispatchToServer} = require('../clientToServer');
const {isHost, getSession} = require('../selectors/sessions');
const {config} = require('../config');
const {useEffect, useState, useMemo} = React;

const Lobby = (props) => {
  const {dispatch, state, getState} = props;

  const sessionCards = [];
  for (const sessionID in state.sessions) {
    sessionCards.push(<SessionCard
      key={"sessionCard_" + sessionID}
      state={state} dispatch={dispatch}
      session={state.sessions[sessionID]}
      joinedSessionID={getSession(state)?.id}
    />);
  }

  return (
    <div
      style={{
        width: 600,
        margin: 'auto',
        marginTop: 100,
        backgroundColor: 'rgb(35,36,38)',
      }}
    >
      <CreateGameCard />
      {sessionCards}
    </div>
  );
};

const CreateGameCard = (props) => {
  const [name, setName] = useState('');
  return (
    <div
      style={{
        width: 300,
        marginLeft: '25%',
      }}
    >
      <div
        style={{
          display: 'flex',
        }}
      >
        Game Name:&nbsp;
        <TextField
          style={{
            backgroundColor: 'black',
            border: 'none',
            borderBottom: '1px solid #6ce989',
            color: '#6ce989',
            height: 20,
            flexGrow: 1,
          }}
          value={name}
          onChange={setName}
        />
      </div>
      <Button
        label="Create Game"
        disabled={getSession(getState())}
        style={{
          width: '100%',
          height: 30,
          marginTop: 8,
        }}
        onClick={() => {
          dispatchToServer({type: 'CREATE_SESSION', name: name != '' ? name : null});
        }}
      />
      <div>Number of Players in Lobby: {getState().numClients}</div>
    </div>
  );
}

const SessionCard = (props) => {
  const {session, joinedSessionID, state, dispatch} = props;
  const {id, name, clients} = session;
  const clientID = state.clientID;
  let otherClientID = null;
  for (const client in state.dynamicConfig) {
    if (client != clientID) {
      otherClientID = client;
      break;
    }
  }

  return (
    <div
      style={{
        width: 600,
        marginLeft: 0,
        marginTop: 12,
        padding: 8,
        border: '1px solid #6ce989',
      }}
    >
      <div style={{textAlign: 'center'}}><b>{name}</b></div>
      {isHost(props.state) && joinedSessionID == session.id ? (<div><b>Host: </b> You</div>) : null}
      Players: {clients.length}

      <div
        style={{
          width: '100%',
          display: joinedSessionID == session.id ? 'flex' : 'none',
          gap: '5%',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: '47.5%',
            border: '1px solid #6ce989',
          }}
        >
          <div style={{textAlign: 'center'}}><b>You</b></div>
          <RadioPicker
            options={[0, 1, 2]}
            displayOptions={config.factionNames}
            selected={state.dynamicConfig[clientID]?.nationalityIndex}
            onChange={(nationalityIndex) => {
              dispatchToServer({type: 'SET_NATIONALITY_INDEX', nationalityIndex, clientID});
            }}
          />

        </div>
        <div
          style={{
            width: '47.5%',
            border: '1px solid #6ce989',
            display: clients.length >= 2 ? 'block' : 'none',
          }}
        >
          <div style={{textAlign: 'center'}}><b>Opponent</b></div>
          <div>Faction: {config.factionNames[state.dynamicConfig[otherClientID]?.nationalityIndex]}</div>

        </div>

      </div>

      {joinedSessionID == id ? (
        <Button
          style={{
            width: '100%',
            height: 30,
          }}
          label={isHost(props.state) ? "Start" : "Ready"}
          disabled={
            (isHost(props.state) && !session.ready) ||
            (!isHost(props.state) && session.ready)
          }
          onClick={() => {
            if (isHost(props.state)) {
              dispatchToServer({type: 'START'});
            } else {
              dispatchToServer({type: 'READY'});
            }
          }}
        />
      ) : (
        <Button
          style={{
            width: '100%',
            height: 30,
          }}
          disabled={clients.length >= 2 || session.started || joinedSessionID != null}
          label={"Join Game"}
          onClick={() => {
            dispatchToServer({type: 'JOIN_SESSION', sessionID: id});
          }}
        />
      )}

    </div>
  );
};



module.exports = Lobby;
