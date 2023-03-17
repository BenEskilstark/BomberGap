const React = require('react');
const {Button} = require('bens_ui_components');
const {useEffect, useState, useMemo} = React;

const PlaneDesignDisplay = (props) => {
  const {planeDesign, quantity, dispatch, money} = props;

  return (
    <div
      style={{
        width: '100%',
      }}
    >
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <b>{planeDesign.name} {planeDesign.type}</b>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            width: '50%',
            padding: 5,
          }}
        >
          <div>Cost: {planeDesign.cost}</div>
          <div>Speed: {planeDesign.speed}</div>
          <div>Fuel: {planeDesign.fuel}</div>
          <div>Vision: {planeDesign.vision}</div>
        </div>
        <div>
          Purchased: {quantity}
          <Button
            label="Purchase"
            disabled={money < planeDesign.cost}
            onClick={() => {
              dispatch({type: 'BUY_PLANE', plane: planeDesign});
            }}
          />
        </div>
      </div>
    </div>
  );
};

module.exports = PlaneDesignDisplay;

