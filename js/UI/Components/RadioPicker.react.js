const React = require('react');
const {useEffect, useState, useMemo} = React;

const RadioPicker = (props) => {
  const {options, displayOptions, selected, onChange} = props;
  const optionToggles = [];
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const displayOption =
      displayOptions && displayOptions[i]
        ? displayOptions[i]
        : option;
    optionToggles.push(
      <div
        key={'radioOption_' + option}
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        {displayOption}
        <input type="radio"
          className="radioCheckbox"
          value={displayOption}
          checked={option === selected}
          onChange={() => onChange(option)}
        />
      </div>
    );
  }

  return (
    <div
      style={{
      }}
    >
      {optionToggles}
    </div>
  );
};

module.exports = RadioPicker;

