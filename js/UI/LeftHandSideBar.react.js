const React = require('react');
const {
  InfoCard, Divider,
  Modal,
  useHotKeyHandler,
} = require('bens_ui_components');
const PlaneDesignDisplay = require('./PlaneDesignDisplay.react');
const {
  getPlaneDesignsUpToGen, getPlaneDesignByName,
  getNumBuilding,
} = require('../selectors/selectors');
const Button = require('./Components/Button.react');
const RadioPicker = require('./Components/RadioPicker.react');
const {dispatchToServer} = require('../clientToServer');
const {useEffect, useState, useMemo} = React;

const LeftHandSideBar = (props) => {
  const {state, dispatch} = props;
  const {game} = state;

  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        top: 0,
        left: 0,
        margin: 4,
        padding: 8,
        minWidth: 150,
        color: '#6ce989',
      }}
    >
      <BuildingInfo {...props} />
      <BuildingsSelected {...props} />
      <PlanesSelected {...props} />
    </div>
  );
};


const BuildingInfo = (props) => {
  const {state, dispatch} = props;
  const {game} = state;

  const player = game.players[game.clientID];
  const numCities = getNumBuilding(game, game.clientID, 'CITY');
  const numFactories = getNumBuilding(game, game.clientID, "FACTORY");
  const numLabs = getNumBuilding(game, game.clientID, "LAB");
  const numAirbases = getNumBuilding(game, game.clientID, "AIRBASE");
  return (
    <div
      style={{

      }}
    >
      <div>Money: {player.money}</div>

      <div>
        Cities: {numCities} (Income: {game.config.moneyRate * numCities})
        <Button
          label={`Build City (${game.config.cityCost * Math.pow(2, numCities)})`}
          style={{display: 'block'}}
          disabled={game.money < game.config.cityCost * Math.pow(2, numCities)}
          onClick={() => {
            dispatchToServer({type: 'BUY_BUILDING', buildingType: "CITY"});
          }}
        />
      </div>
      <div>
        Factories: {numFactories}
        <Button
          style={{display: 'block'}}
          label={`Build Factory (${game.config.factoryCost})`}
          disabled={game.money < game.config.factoryCost}
          onClick={() => {
            dispatchToServer({type: 'BUY_BUILDING', buildingType: "FACTORY"});
          }}
        />
      </div>

      <div>Research Generation: {player.gen}</div>
      <div>
        Research Labs: {numLabs}
        <Button
          style={{display: 'block'}}
          label={`Build Lab (${game.config.labCost})`}
          disabled={game.money < game.config.labCost}
          onClick={() => {
            dispatchToServer({type: 'BUY_BUILDING', buildingType: "LAB"});
          }}
        />
      </div>

      <div>
        Airbases: {numAirbases}
        <Button
          label={`Build Airbase (${game.config.airbaseCost})`}
          style={{display: 'block'}}
          disabled={game.money < game.config.airbaseCost}
          onClick={() => {
            dispatchToServer({type: 'BUY_BUILDING', buildingType: "AIRBASE"});
          }}
        />
      </div>

    </div>
  );
}


const BuildingsSelected = (props) => {
  const {state, dispatch} = props;
  const {game} = state;

  let anyBuildingsSelected = false;
  for (const id of game.selectedIDs) {
    if (game.entities[id].isBuilding) {
      anyBuildingsSelected = true;
      break;
    }
  }
  if (!anyBuildingsSelected) return null;

  const selectedBuildings = [];
  for (const id of game.selectedIDs) {
    const building = game.entities[game.selectedIDs[0]];
    if (building.type == 'AIRBASE') {
      const airbase = building;
      const airbasePlanes = [];
      const planeNames = Object.keys(airbase.planes);
      for (const name in airbase.planes) {
        airbasePlanes.push(<div key={"airbase_plane_" + name}>
          {name}: {airbase.planes[name]}
        </div>);
      }
      selectedBuildings.push(
        <div
          key={"selected_building_" + id}
          style={{

          }}
        >
          <div style={{textAlign: 'center'}}><b>Airbase</b></div>
          <div>
            <div>Launch Type: </div>
            <RadioPicker
              options={planeNames}
              displayOptions={planeNames.map(name => {
                const design = getPlaneDesignByName(game, name);
                let planeType = 'RECON';
                if (design.isFighter && design.isBomber) {
                  planeType = 'FIGHTER/BOMBER';
                } else if (design.isFighter) {
                  planeType = 'FIGHTER';
                } else if (design.isBomber) {
                  planeType = 'BOMBER';
                }
                return (
                  <div>
                    {name} ({planeType}): {airbase.planes[name]}
                    <Button
                      label={`Build (${design.cost})`}
                      onClick={() => {
                        dispatchToServer({type: 'BUILD_PLANE', name, airbaseID: id});
                      }}
                    />
                  </div>
                );
              })}
              selected={state.game.launchName}
              onChange={(launchName) => dispatch({type: 'SET', launchName})}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <span>
      {selectedBuildings}
    </span>
  );
}


const PlanesSelected = (props) => {
  const {state, dispatch} = props;
  const {game} = state;

  let anyPlanesSelected = false;
  for (const id of game.selectedIDs) {
    if (game.entities[id].isPlane) {
      anyPlanesSelected = true;
      break;
    }
  }
  if (!anyPlanesSelected) return null;

  const selections = {};
  for (const entityID of game.selectedIDs) {
    const entity = game.entities[entityID];
    if (entity) {
      selections[entity.name] += 1;
    }
  }
  const planesSelected = [];
  for (const name in selections) {
    planesSelected.push(<div key={"plane_" + name}>
      {name}: {selections[name]}
    </div>)
  }

  return (
    <div
      style={{

      }}
    >
      <div style={{textAlign: 'center'}}><b>Aircraft</b></div>
      {planesSelected}
    </div>
  );
}


const PlaneDetail = (props) => {
  const {name, planeDesigns} = props;
  if (!name) return null;

  return (
    <div
      style={{
        padding: 8,
    }}
    >
      <PlaneDesignDisplay planeDesign={planeDesigns[name]} />
    </div>
  );
};





module.exports = LeftHandSideBar;

