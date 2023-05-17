const React = require('react');
const {Button} = require('bens_ui_components');
const {useEffect, useState, useMemo} = React;

const FancyButton = (props) => {

  const style = {
    border: "1px solid #6ce989",
    fontSize: '15px',
  };
  if (props.disabled) {
    style.color = 'gray';
  }
  return (
    <Button
      style={{
        ...style,
        ...props.style,
      }}
      disabled={props.disabled}
      onClick={props.onClick}
      label={props.label}
    />
  );
};

module.exports = FancyButton;
