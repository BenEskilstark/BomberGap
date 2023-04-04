const React = require('react');
const {
  Button, InfoCard, Divider,
  Plot, plotReducer,
  Modal, Indicator,
  Board, SpriteSheet, TextField,
  Slider, Checkbox,
  CheckerBackground,
} = require('bens_ui_components');
const PlaneDesigner = require('./PlaneDesigner.react');
const PlaneDesignDisplay = require('./PlaneDesignDisplay.react');
const {dispatchToServer} = require('../clientToServer');
const {isHost, getSession} = require('../selectors/sessions');
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
    <InfoCard
      style={{
        width: 300,
        marginLeft: '25%',
      }}
    >
      Game Name:&nbsp;
      <TextField
        value={name}
        onChange={setName}
      />
      <Button
        label="Create Game"
        style={{
          width: '100%',
          height: 30,
          marginTop: 8,
        }}
        onClick={() => {
          dispatchToServer({type: 'CREATE_SESSION', name: name != '' ? name : null});
        }}
      />
    </InfoCard>
  );
}

const SessionCard = (props) => {
  const {session, joinedSessionID, state, dispatch} = props;
  const {id, name, clients} = session;

  return (
    <InfoCard
      style={{
        width: 600,
        marginLeft: 0,
      }}
    >
      <div style={{textAlign: 'center'}}><b>{name}</b></div>
      Players: {clients.length}
      {joinedSessionID == id ? (<Settings state={state} dispatch={dispatch} />) : null}
      {joinedSessionID == id ? (
        <Button
          style={{
            width: '100%',
            height: 30,
          }}
          label={isHost(props.state) ? "Start" : "Ready"}
          disabled={
            (isHost(props.state) && !session.ready) ||
            (!isHost(props.state) && session.ready) ||
            Object.keys(state.clientConfig.planeDesigns[state.clientID] ?? {}).length == 0
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
          disabled={clients.length >= 2 || session.started}
          label={"Join Game"}
          onClick={() => {
            dispatchToServer({type: 'JOIN_SESSION', sessionID: id});
          }}
        />
      )}

    </InfoCard>
  );
};

const Settings = (props) => {
  const {state, dispatch} = props;

  const planeDesigns = [];
  for (const name in state.clientConfig.planes) {
    const planeDesign = state.clientConfig.planeDesigns[state.clientID][name];
    planeDesigns.push(
      <PlaneDesignDisplay
        key={"plane_design_" + planeDesign.name}
        planeDesign={planeDesign}
        quantity={state.clientConfig.planes[name]}
        dispatch={(action) => {
          dispatch(action);
          dispatchToServer(action);
        }}
        money={state.clientConfig.money}
      />
    );
  }

  let numPlaneDesigns = 0;
  let planeNames = [];
  if (state.clientConfig.planeDesigns[state.clientID]) {
    numPlaneDesigns = Object.keys(state.clientConfig.planeDesigns[state.clientID]).length;
    planeNames = Object.keys(state.clientConfig.planeDesigns[state.clientID]);
  }

      // <Button
      //   label="VS. AI Opponent"
      //   disabled={clients.length >= 2}
      //   onClick={() => {
      //     dispatchToServer({type: 'JOIN_SESSION', sessionID: id, AI: true});
      //   }}
      // />
  return (
    <div>
      <div><b>Settings:</b></div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>
          Game ms per tick:
          <Slider value={state.config.msPerTick} min={1} max={1000}
            noOriginalValue={true}
            onChange={(msPerTick) => {
              dispatch({type: 'EDIT_SESSION_PARAMS', msPerTick});
              dispatchToServer({type: 'EDIT_SESSION_PARAMS', msPerTick});
            }}
          />
        </div>
        <div>
          Map Width/Height:
          <Slider value={state.config.worldSize.width} min={100} max={1600}
            noOriginalValue={true}
            onChange={(width) => {
              dispatch({type: 'EDIT_SESSION_PARAMS', worldSize: {height: width, width}});
              dispatchToServer({type: 'EDIT_SESSION_PARAMS', worldSize: {height: width, width}});
            }}
          />
        </div>
        <div>
          Airbases per player:
          <Slider value={state.config.numAirbases} min={1} max={5}
            noOriginalValue={true}
            onChange={(numAirbases) => {
              dispatch({type: 'EDIT_SESSION_PARAMS', numAirbases});
              dispatchToServer({type: 'EDIT_SESSION_PARAMS', numAirbases});
            }}
          />
        </div>
      </div>
      <Divider style={{marginTop: 4, marginBottom: 4}} />
      Money Available: {state.clientConfig.money}
      <div></div>
      Designs Remaining: {state.config.maxPlaneDesigns - numPlaneDesigns}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {planeDesigns}
      </div>

      {
        numPlaneDesigns < state.config.maxPlaneDesigns ?
          <PlaneDesigner
            config={state.config}
            clientID={state.clientID}
            dispatch={(action) => {
              dispatch(action);
              dispatchToServer(action);
            }}
            planeNames={planeNames}
          /> :
          'Max Planes Designed'
      }
      <Divider style={{marginTop: 4, marginBottom: 4}} />
    </div>
  );
};


module.exports = Lobby;
