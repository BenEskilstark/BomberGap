const React = require('react');
const {
  Button, InfoCard, Divider,
  Plot, plotReducer,
  Canvas, RadioPicker,
  Modal, Indicator,
  useMouseHandler,
  useHotKeyHandler,
  useEnhancedReducer,
} = require('bens_ui_components');
const {dispatchToServer} = require('../clientToServer');
import postVisit from '../postVisit';
const {render} = require('../render');
const {useState, useMemo, useEffect, useReducer} = React;

const normalizePos = (pos, worldSize, canvasSize) => {
  return {
    x: pos.x * worldSize.width / canvasSize.width,
    y: pos.y * worldSize.height / canvasSize.height,
  };
}

function Game(props) {
  const {state, dispatch, getState} = props;
  const game = state.game;

  // initializations
  useEffect(() => {
    postVisit('/game', 'GET');
  }, []);

  // rendering
  useEffect(() => {
    render(state);
  }, [game.entities, game.selectedIDs, game.marquee]);

  // mouse
  useMouseHandler(
    "canvas", {dispatch, getState},
    {
      leftDown: (state, dispatch, p) => {
        const pos = normalizePos(p, state.game.worldSize, state.game.canvasSize);
        dispatch({type: 'SET', marquee: {...pos, width: 0, height: 0}});
      },
      mouseMove: (state, dispatch, p) => {
        const pos = normalizePos(p, state.game.worldSize, state.game.canvasSize);
        if (!state?.mouse?.isLeftDown) return;
        dispatch({type: 'SET', marquee: {...state.game.marquee,
          width: pos.x - state.game.marquee.x,
          height: pos.y - state.game.marquee.y,
        }});
      },
      leftUp: (state, dispatch, p) => {
        const pos = normalizePos(p, state.game.worldSize, state.game.canvasSize);
        let square = {...state.game.marquee};
        if (square.width < 0) {
          square.x += square.width;
          square.width *= -1;
        }
        if (square.height < 0) {
          square.y += square.height;
          square.height *= -1;
        }
        dispatch({type: 'SELECT_ENTITIES', square});
        dispatch({type: 'SET', marquee: null});
      },
      rightDown: (state, dispatch, p) => {
        const pos = normalizePos(p, state.game.worldSize, state.game.canvasSize);
        for (const entityID of state.game.selectedIDs) {
          const entity = state.game.entities[entityID];
          if (entity.type == 'CARRIER' && state.game.clickMode == 'LAUNCH') {
            dispatchToServer({
              type: 'LAUNCH_PLANE', targetPos: pos, carrierID: entityID,
              planeType: state.game.launchType,
            });
          } else {
            dispatchToServer({type: 'SET_TARGET', targetPos: pos, entityID});
          }
        }
      },
    },
  );

  // hotKeys
  useHotKeyHandler({dispatch, getState: () => getState().game.hotKeys});
  useEffect(() => {
    dispatch({type: 'SET_HOTKEY', key: 'F', press: 'onKeyDown',
      fn: () => {
        dispatch({type: 'SET', launchType: 'FIGHTER'});
        dispatch({type: 'SET', clickMode: 'LAUNCH'});
      }
    });
    dispatch({type: 'SET_HOTKEY', key: 'B', press: 'onKeyDown',
      fn: () => {
        dispatch({type: 'SET', launchType: 'BOMBER'});
        dispatch({type: 'SET', clickMode: 'LAUNCH'});
      }
    });
    dispatch({type: 'SET_HOTKEY', key: 'M', press: 'onKeyDown',
      fn: () => {
        dispatch({type: 'SET', clickMode: 'MOVE'});
      }
    });
  }, []);


  // selectionCard
  let selectionCard = null;
  if (game.selectedIDs.length > 0) {
    const selections = {
      'CARRIER': 0,
      'FIGHTER': 0,
      'BOMBER': 0,
    };
    for (const entityID of game.selectedIDs) {
      const entity = game.entities[entityID];
      selections[entity.type] += 1;
    }
    let selectionContent = (
      <div>
        {selections.FIGHTER > 0 ? (<div>Fighters: {selections.FIGHTER}</div>) : null}
        {selections.BOMBER > 0 ? (<div>Bombers: {selections.BOMBER}</div>) : null}
      </div>
    );
    if (selections.CARRIER > 0) {
     const carrier = game.entities[game.selectedIDs[0]];
     selectionContent = (
        <div>
          Carrier
          <div
            style={{

            }}
          >
            <div>Fighters: {carrier.planes.FIGHTER}</div>
            <div>Bombers: {carrier.planes.BOMBER}</div>
          </div>
          <div>
            <div>Control Mode:</div>
            <RadioPicker
              options={['MOVE', 'LAUNCH']}
              selected={state.game.clickMode}
              onChange={(clickMode) => dispatch({type: 'SET', clickMode})}
            />
          </div>
          {state.game.clickMode == 'LAUNCH' ? (
            <div>
              <div>Launch Type: </div>
              <RadioPicker
                options={['FIGHTER', 'BOMBER']}
                selected={state.game.launchType}
                onChange={(launchType) => dispatch({type: 'SET', launchType})}
              />
            </div>
          ) : null}
        </div>
      );
    }
    selectionCard = (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          border: '1px solid black',
          padding: 8,
          margin: 4,
          minWidth: 150,
          backgroundColor: 'white',
        }}
      >
        {selectionContent}
      </div>
    );
  }


  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Canvas
        view={game.worldSize}
        useFullScreen={true}
        onResize={(width, height) => {
          dispatch({type: 'SET', canvasSize: {width, height}});
        }}
        // width={window.innerWidth * 0.9}
        // height={
        //   Math.min(window.innerHeight,
        //     window.innerWidth * 0.9 * game.worldSize.height / game.worldSize.width,
        //   )}
      />
      {selectionCard}
    </div>
  );
}

module.exports = Game;
