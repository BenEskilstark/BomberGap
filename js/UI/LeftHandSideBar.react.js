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
  getNumPlaneInProductionAtBase,
  getPlaneInProductionAtBase,
  getPlanesBeingWorkedOn,
  getAirbaseNumByID,
} = require('../selectors/selectors');
const Button = require('./Components/Button.react');
const RadioPicker = require('./Components/RadioPicker.react');
const ProgressBar = require('./Components/ProgressBar.react');
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
        height: '100%',
        top: 0,
        left: 0,
        padding: 12,
        minWidth: 150,
        color: '#6ce989',
      }}
    >
      <BuildingInfo {...props} />
      <PlanesSelected {...props} />
      <BuildingsSelected {...props} />

      <Button
        label="Resign"
        style={{
          position: 'absolute',
          bottom: 12,
        }}
        onClick={() => {
          dispatchToServer({type: 'RESIGN'});
        }}
      />
    </div>
  );
};


const BuildingInfo = (props) => {
  const {state, dispatch} = props;
  const {game} = state;

  const player = game.players[game.clientID];
  const numCities = getNumBuilding(game, game.clientID, 'CITY');
  const numMegaCities = getNumBuilding(game, game.clientID, 'CITY', 'isMega');
  const numFactories = getNumBuilding(game, game.clientID, "FACTORY");
  const numLabs = getNumBuilding(game, game.clientID, "LAB");
  const numAirbases = getNumBuilding(game, game.clientID, "AIRBASE");
  const isResearching = player.researchProgress?.isStarted;
  const {moneyRate} = game.config;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <div>Money: {player.money} (Income: {moneyRate * (numCities + numMegaCities)})</div>
      <div>
        Research Generation: {player.gen}
        <Button
          label={isResearching ? 'Pause' : 'Start'}
          disabled={player.researchProgress == null}
          style={{float: 'right'}}
          onClick={() => {
            if (isResearching) {
              dispatchToServer({type: 'PAUSE_RESEARCH'});
            } else {
              dispatchToServer({type: 'START_RESEARCH'});
            }
          }}
        />

      </div>
      <div
        style={{
          marginBottom: '8px',
        }}
      >
        {player.researchProgress ? (
          <ProgressBar
            id="research_progress"
            progress={1 -
              player.researchProgress.cost / game.config.genCost[player.researchProgress.gen]
            }
          />
        ) : null}
      </div>
      <div>
        Cities: {numCities}&nbsp;
        <Button
          label={`Build ($${Math.floor(game.config.cityCost * Math.pow(2, numCities) / 1000)}k)`}
          style={{float: 'right'}}
          disabled={player.money < game.config.cityCost * Math.pow(2, numCities)}
          onClick={() => {
            dispatchToServer({type: 'BUY_BUILDING', buildingType: "CITY"});
          }}
        />
      </div>
      <div>
        Factories: {numFactories}&nbsp;
        <Button
          label={`Build ($${Math.floor(game.config.factoryCost / 1000)}k)`}
          style={{float: 'right'}}
          disabled={player.money < game.config.factoryCost}
          onClick={() => {
            dispatchToServer({type: 'BUY_BUILDING', buildingType: "FACTORY"});
          }}
        />
      </div>

      <div>
        Research Labs: {numLabs}&nbsp;
        <Button
          label={`Build ($${Math.floor(game.config.labCost / 1000)}k)`}
          style={{float: 'right'}}
          disabled={player.money < game.config.labCost}
          onClick={() => {
            dispatchToServer({type: 'BUY_BUILDING', buildingType: "LAB"});
          }}
        />
      </div>

      <div>
        Airbases: {numAirbases}&nbsp;
        <Button
          label={`Build ($${Math.floor(game.config.airbaseCost / 1000)}k)`}
          style={{float: 'right'}}
          disabled={player.money < game.config.airbaseCost}
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
  const player = game.players[game.clientID];

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
          <PlaneDetail
            canBuy={true}
            planeDesign={getPlaneDesignByName(game, state.game.launchName)}
            airbaseID={id}
          />
          <div style={{textAlign: 'center'}}><b>Airbase #{getAirbaseNumByID(game, id)}</b></div>
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
              const numQueued = getNumPlaneInProductionAtBase(game, id, name);
              const allQueued = getPlanesBeingWorkedOn(game, id, name);
              return (
                <div>
                  <div>{name} ({planeType}): {airbase.planes[name]}</div>
                  {allQueued.length > 0 ? (
                    allQueued.map((nextQueued, i) => {
                      return (
                        <ProgressBar
                          key={id + "_" + name + "_" + i + "_progress"}
                          id={id + "_" + name + "_" + i + "_progress"}
                          progress={1 - nextQueued.cost / design.cost}
                          enqueued={i == allQueued.length - 1 ? numQueued : null}
                        />
                      );
                    })
                  ) : (allQueued.length == 0 && numQueued > 0 ?
                    (
                      <ProgressBar
                        key={id + "_" + name + "_" + "_progress"}
                        id={id + "_" + name + "_" + "_progress"}
                        progress={0}
                        enqueued={numQueued}
                      />
                    ) : null)
                  }
                </div>
              );
            })}
            selected={state.game.launchName}
            onChange={(launchName) => dispatch({type: 'SET', launchName})}
          />
        </div>
      );
    } else if (building.type == 'FACTORY') {
      const productionQueueUI = [];
      const productionQueue = game.players[building.clientID].productionQueue;
      for (let productionIndex = 0; productionIndex < productionQueue.length; productionIndex++) {
        const production = productionQueue[productionIndex];
        const {name, airbaseID, cost} = production;
        const design = getPlaneDesignByName(game, name);
        productionQueueUI.push(
          <div>
            <div>{name}, Airbase #{getAirbaseNumByID(game, airbaseID)}</div>
            <div
              style={{
                display: 'flex',
                gap: '5px',
              }}
            >
              <ProgressBar
                key={id + "_" + name + "_" + productionIndex + "_progress"}
                id={id + "_" + name + "_" + productionIndex + "_progress"}
                progress={1 - cost / design.cost}
              />
              <Button
                label="Cancel"
                onClick={() => {
                  dispatchToServer({type: 'CANCEL_PLANE', productionIndex});
                }}
              />
            </div>
          </div>
        );
      }
      selectedBuildings.push(
        <div
          key={"selected_building_" + id}
          style={{
            overflowY: 'auto',
            maxHeight: 300,
          }}
        >
          <BuildingUpgrade game={game} building={building} />
          {productionQueueUI}
        </div>
      );
    } else {
      selectedBuildings.push(
        <BuildingUpgrade
          key={"selected_building_" + id}
          game={game} building={building} />
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
  const planes = {}; // for motherships
  for (const entityID of game.selectedIDs) {
    const entity = game.entities[entityID];
    if (entity) {
      if (!selections[entity.name]) selections[entity.name] = 0;
      selections[entity.name] += 1;
      if (entity.planes) {
        for (const planeName in entity.planes) {
          if (!planes[planeName]) planes[planeName] = 0;
          planes[planeName] += entity.planes[planeName];
        }
      }
    }
  }
  const planesSelected = [];
  for (const name in selections) {
    const planeDesign = getPlaneDesignByName(game, name);
    if (!planeDesign) {
      console.log("no plane design", planeDesign, name);
      continue;
    }
    planesSelected.push(
      <div className="displayChildOnHover" key={"plane_" + name}>
        {name}: {selections[name]}
        <div className="hidden" style={{display: planeDesign.planeCapacity ? 'block' : 'noop'}}>
          <PlaneDetail
            game={game}
            planeDesign={planeDesign} clickMode={game.clickMode}
            planesCarried={planeDesign.planeCapacity ? planes : null}
          />
        </div>
      </div>
    )
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
  const {planeDesign, airbaseID, canBuy, planesCarried, clickMode, game} = props;
  const {name, cost} = planeDesign;

  const [launchIndex, setLaunchIndex] = useState(0);

  let carrier = null;
  if (planesCarried) {
    const planeNames = Object.keys(planesCarried);
    if (game.launchName != planeNames[launchIndex]) {
      dispatch({type: 'SET', launchName: planeNames[launchIndex]});
    }
    carrier = (
      <div>
        <Button
          label={clickMode == 'MOVE' ? "Switch to Launch Mode (L)" : "Switch to Target Mode (M)"}
          onClick={() => {
            dispatch({type: 'SET', clickMode: clickMode == 'MOVE' ? 'LAUNCH' : 'MOVE'});
          }}
        />
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
                <div>{name} ({planeType}): {planesCarried[name]}</div>
            );
          })}
          selected={planeNames[launchIndex]}
          onChange={(launchName) => {
            setLaunchIndex(planeNames.indexOf(launchName));
            dispatch({type: 'SET', launchName});
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 8,
    }}
    >
      <PlaneDesignDisplay planeDesign={planeDesign} />
      {carrier}
      <Button
        style={{display: canBuy ? 'block' : 'none'}}
        label={`Build (${planeDesign.cost}) (B)`}
        onClick={() => {
          dispatchToServer({type: 'BUILD_PLANE', name, airbaseID});
        }}
      />
    </div>
  );
};

const BuildingUpgrade = (props) => {
  const {game, building} = props;
  const player = game.players[game.clientID];

  const isUpgraded = building.isMega || building.isHardened;
  let upgradeLabel = building.type;
  if (building.isMega) upgradeLabel = "MEGA-" + building.type;
  if (building.isHardened) upgradeLabel = "ANTI-AIR-" + building.type;

  let cost = game.config.megaCost;
  if (building.type == 'CITY') {
    cost = game.config.megaCityCost;
  }

  return (
    <div
      style={{

      }}
    >
      <div>{upgradeLabel}</div>
      <Button
        style={{display: 'block'}}
        label={`Mega Upgrade ($${cost / 1000 }k)`}
        disabled={isUpgraded || cost > player.money}
        onClick={() => {
          dispatchToServer({type: 'UPGRADE_BUILDING',
            buildingID: building.id, upgradeType: 'isMega'
          });
        }}
      />
      <Button
        style={{display: 'block'}}
        label={`Anti-Air Upgrade ($${game.config.hardenedCost / 1000}k)`}
        disabled={isUpgraded || game.config.hardenedCost > player.money}
        onClick={() => {
          dispatchToServer({type: 'UPGRADE_BUILDING',
            buildingID: building.id, upgradeType: 'isHardened'
          });
        }}
      />
    </div>
  );
}





module.exports = LeftHandSideBar;

