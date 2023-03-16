const React = require('react');
const {
  Slider, TextField, RadioPicker, Button,
} = require('bens_ui_components');
const {oneOf, randomIn} = require('bens_utils').stochastic;
const {useEffect, useState, useMemo} = React;

const PlaneDesigner = (props) => {
  const {dispatch, config, clientID} = props;

  const [plane, setPlane] = useState({
    name: oneOf([
      "MIG-15", "MIG-17", "MIG-21", "MIG-22", "SU-27",
      "F-4", "F14", "F-15", "F-16", "F-18", "F-22",
      "B-1", "B-2", "B-17", "B-29",
      "Tu-99", "Tu-101", "Tu-27",
      "SR-71"
    ]),
    fuel: 100,
    vision: 10,
    speed: 1,
    type: 'RECON',
    cost: 120,
    productionTime: 10000, // ms
  });

  const sliders = [];
  for (const name of ['speed', 'fuel', 'vision']) {
    sliders.push(<ParamSlider
      key={"paramslider_" + name}
      name={name} param={config[name]}
      plane={plane} setPlane={setPlane}
    />);
  }

  return (
    <div
      style={{
        width: 300,
        border: '1px solid black',
      }}
    >
      <TextField
        value={plane.name}
        onChange={(name) => {
          setPlane({...plane, name});
        }
      />
      <RadioPicker
        options={['RECON', 'FIGHTER', 'BOMBER']}
        selected={plane.type}
        onChange={(type) => {
          let cost = 0;
          if (type == 'FIGHTER' && plane.type == 'RECON') {
            cost = config.airAttackCost;
          }
          if (type == 'BOMBER' && plane.type == 'RECON') {
            cost = config.groundAttackCost;
          }
          if (type == 'RECON' && plane.type == 'FIGHTER') {
            cost = -1 * config.airAttackCost;
          }
          if (type == 'RECON' && plane.type == 'BOMBER') {
            cost = -1 * config.groundAttackCost;
          }
          setPlane({...plane, type, cost: plane.cost + cost});
        }}
      />
      {sliders}
      <Button
        style={{
          width: '100%',
        }}
        label="Finalize Design"
        onClick={() => {
          dispatch({type: 'ADD_PLANE_DESIGN', clientID, plane})
        }}
      />
    </div>
  );
};

const ParamSlider = (props) => {
  const {name, param, setPlane, plane} = props;

  return (
    <Slider
      label={name}
      min={param.min} max={param.max}
      value={plane[name]}
      step={param.inc}
      onChange={(value) => {
        const diff = value - plane[name];
        const cost = plane.cost + diff * param.cost;
        setPlane({...plane, [name]: value, cost});
      }}
      noNumberField={false}
      noOriginalValue={true}
      isFloat={param.inc < 1}
    />
  );
};


module.exports = PlaneDesigner;

