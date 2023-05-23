const React = require('react');
const {Button, Divider} = require('bens_ui_components');
const {useEffect, useState, useMemo} = React;

const keyToProp = {
  isFighter: 'fighter ',
  isBomber: 'bomber ',
  isRecon: 'recon ',
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
        <b>{planeDesign.name}</b>
      </div>
      <div
        style={{
          width: '100%',
          padding: 5,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div>Generation: {planeDesign.gen}</div><div>Cost: {planeDesign.cost}</div>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div>Speed: {planeDesign.speed}</div><div>Fuel: {planeDesign.fuel}</div>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div>Vision: {planeDesign.vision}</div><div>Ammo: {planeDesign.ammo}</div>
        </div>
        {planeDesign.planeCapacity ? <div>Plane Capacity: {planeDesign.planeCapacity}</div> : null}
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
            {properties}
        </div>
      </div>
    </div>
  );
};

module.exports = PlaneDesignDisplay;

