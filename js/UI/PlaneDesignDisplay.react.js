const React = require('react');
const {Button, Divider} = require('bens_ui_components');
const {useEffect, useState, useMemo} = React;

const keyToProp = {
  isNuclear: 'nukes ',
  isStealth: 'stealth ',
  isDogfighter: 'tailgun ',
  isDrone: 'drone ',
  planeCapacity: 'mothership ',
}

const PlaneDesignDisplay = (props) => {
  const {planeDesign} = props;

  const properties = [];
  for (const key in planeDesign) {
    if (!keyToProp[key]) continue;
    properties.push(
      <span key={planeDesign.name + "_" + key}>
        {keyToProp[key]}
      </span>
    );
  }

  return (
    <div
      style={{
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
        <div>Generation: {planeDesign.gen}</div>
        <div>Cost: {planeDesign.cost}</div>
        <div>Speed: {planeDesign.speed}</div>
        <div>Fuel: {planeDesign.fuel}</div>
        <div>Vision: {planeDesign.vision}</div>
        <div>Ammo: {planeDesign.ammo}</div>
        <div>{properties}</div>
      </div>
    </div>
  );
};

module.exports = PlaneDesignDisplay;

