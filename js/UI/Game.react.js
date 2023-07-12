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
const {dist, subtract, add} = require('bens_utils').vectors;
const LeftHandSideBar = require('./LeftHandSideBar.react');
const RightHandSideBar = require('./RightHandSideBar.react');
const {
  normalizePos, getCanvasSize, getPlaneDesignsUnlocked,
  getPlaneNameByHotkey,
  isAirbaseSelected, getEntitiesByType,
} = require('../selectors/selectors');

const {useState, useMemo, useEffect, useReducer} = React;

function Game(props) {
  const {state, dispatch, getState} = props;
  const game = state.game;

  const player = game.players[game.clientID];

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
        const pos = normalizePos(p, state.game.worldSize, getCanvasSize());
        dispatch({type: 'SET', marquee: {...pos, width: 0, height: 0}});
      },
      mouseMove: (state, dispatch, p) => {
        const pos = normalizePos(p, state.game.worldSize, getCanvasSize());
        if (!state?.mouse?.isLeftDown) return;
        dispatch({type: 'SET', marquee: {...state.game.marquee,
          width: pos.x - state.game.marquee.x,
          height: pos.y - state.game.marquee.y,
        }});
      },
      leftUp: (state, dispatch, p) => {
        const pos = normalizePos(p, state.game.worldSize, getCanvasSize());
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
        const pos = normalizePos(p, state.game.worldSize, getCanvasSize());
        const leadPlaneID = state.game.selectedIDs[0];
        for (const entityID of state.game.selectedIDs) {
          const entity = state.game.entities[entityID];
          if (entity.planes && (state.game.clickMode == 'LAUNCH' || entity.type == 'AIRBASE')) {
            dispatchToServer({
              type: 'LAUNCH_PLANE', targetPos: pos, airbaseID: entityID,
              name: state.game.launchName, clientID: state.game.clientID,
            });
          } else if (entity.isPlane) {
            const leadPlane = state.game.entities[leadPlaneID];
            let adjustedPos = pos;
            if (dist(entity.position, leadPlane.position) < state.config.formationRadius) {
              const diff = subtract(leadPlane.position, entity.position);
              adjustedPos = subtract(pos, diff);
            }
            dispatchToServer({type: 'SET_TARGET', targetPos: adjustedPos, entityID});
          }
        }
      },
    },
  );

  // hotKeys
  useHotKeyHandler({dispatch, getState: () => getState().game.hotKeys}, true /*noWASD*/);
  useEffect(() => {
    for (let i = 0;  i < 10; i ++) {
      dispatch({type: 'SET_HOTKEY', key: ""+((i+1)%10) , press: 'onKeyDown',
        fn: () => {
          const game = getState().game;
          const airbases = getEntitiesByType(game, 'AIRBASE', game.clientID);
          if (i < airbases.length) {
            dispatch({type: 'SET',  selectedIDs: ['' + airbases[i].id]});
          }
        }
      });
    }
    ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'].forEach((key) => {
      dispatch({type: 'SET_HOTKEY', key, press: 'onKeyDown',
        fn: () => {
          const game = getState().game;
          // if (!isAirbaseSelected(game)) return;
          const launchName = getPlaneNameByHotkey(game, key);
          if (!launchName) return;
          dispatch({type: 'SET', launchName});
          // dispatch({type: 'SET', clickMode: 'LAUNCH'});
        }
      });
    });

    dispatch({type: 'SET_HOTKEY', key: 'Y', press: 'onKeyDown',
      fn: () => dispatchToServer({
        type: 'SET_AFTERBURNER', entityIDs: getState().game.selectedIDs,
      }),
    });

    dispatch({type: 'SET_HOTKEY', key: 'T', press: 'onKeyDown',
      fn: () => dispatch({type: 'SET', clickMode: 'MOVE'}),
    });
    dispatch({type: 'SET_HOTKEY', key: 'G', press: 'onKeyDown',
      fn: () => dispatch({type: 'SET', clickMode: 'LAUNCH'}),
    });
    dispatch({type: 'SET_HOTKEY', key: 'B', press: 'onKeyDown',
      fn: () => {
        const game = getState().game;
        const airbases = getEntitiesByType(game, 'AIRBASE', game.clientID);
        if (isAirbaseSelected(game)) {
          let airbaseID = airbases.map(a => a.id).filter(id => game.selectedIDs.includes(''+id))[0];
          if (airbaseID) {
            dispatchToServer({type: 'BUILD_PLANE', name: game.launchName, airbaseID});
          }
        }
      }
    });
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgb(35,36,38)',
      }}
    >
      <img
        style={{
          position: 'absolute',
        }}
        src="./img/polar_world_map_2.png"
        width={getCanvasSize().width}
        height={getCanvasSize().height}
      />
      <Canvas
        style={{
          opacity: 0.7,
          borderRadius: '49%',
        }}
        view={game.worldSize}
        onResize={(width, height) => {
          dispatch({type: 'SET', canvasSize: {width, height}});
        }}
        width={getCanvasSize().width}
        height={getCanvasSize().height}
      />
      <LeftHandSideBar state={state} dispatch={dispatch} />
      <RightHandSideBar state={state} dispatch={dispatch} />
    </div>
  );
}

module.exports = Game;
