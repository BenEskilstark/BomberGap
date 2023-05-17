const React = require('react');
const {Button} = require('bens_ui_components');
const {useEffect, useState, useMemo} = React;

const FancyButton = (props) => {

  return (
    <Button
      style={{
        color: '#6ce989',
        backgroundColor: 'inherit',
        border: "2px solid #6ce989",
        ...props.style,
      }}
      disabled={props.disabled}
      onClick={props.onClick}
      label={props.label}
    />
  );
};

module.exports = FancyButton;

