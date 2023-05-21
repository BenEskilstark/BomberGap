const React = require('react');
const PlaneDesignDisplay = require('./PlaneDesignDisplay.react');
const {getOtherClientID} = require('../selectors/selectors');
const {useEffect, useState, useMemo} = React;

const RightHandSideBar = (props) => {
  const {state, dispatch} = props;
  const {game} = state;

  const otherPlayer = game.players[getOtherClientID(game, game.clientID)]
  const planeDetails = [];
  for (const name in game.players[game.clientID].planeTypesSeen) {
    planeDetails.push(<PlaneDesignDisplay key={"planeSeen_" + name}
      planeDesign={game.config.planeDesigns[otherPlayer.nationalityIndex][name]}
    />);
  }

  return (
    <div
      style={{
        // visibility: game.selectedIDs.length > 0 ? 'visible' : 'hidden',
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        top: 0,
        left: window.innerWidth - 255,
        margin: 4,
        minWidth: 250,
        color: '#6ce989',
      }}
    >
      <div
        style={{
          padding: 8,
        }}
      >
        {planeDetails}
      </div>
    </div>
  );
};

module.exports = RightHandSideBar;

