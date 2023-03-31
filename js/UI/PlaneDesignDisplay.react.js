const React = require('react');
const {Button, Divider} = require('bens_ui_components');
const {useEffect, useState, useMemo} = React;

const PlaneDesignDisplay = (props) => {
  const {planeDesign, quantity, dispatch, money} = props;

  return (
    <div
      style={{
        width: '50%',
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
          width: '100%',
          padding: 5,
        }}
      >
        <div>Cost: {planeDesign.cost}</div>
        <div>Speed: {planeDesign.speed}</div>
        <div>Fuel: {planeDesign.fuel}</div>
        <div>Vision: {planeDesign.vision}</div>
        <div>Purchased: {quantity}</div>
        <Button
          label="Buy"
          disabled={money < planeDesign.cost}
          onClick={() => {
            dispatch({type: 'BUY_PLANE', plane: planeDesign});
          }}
        />
      </div>
      <Divider style={{marginTop: 4, marginBottom: 4}} />
    </div>
  );
};

module.exports = PlaneDesignDisplay;

