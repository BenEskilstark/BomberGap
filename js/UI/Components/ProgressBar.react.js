const React = require('react');
const {useEffect, useState, useMemo} = React;

const ProgressBar = (props) => {
  const {
    id = 'progress',
    numPips = 12,
    progress, // [0, 1] indicating progress percent
    enqueued = null, // number to show in parentheses to indicate additional items queued
  } = props;

  const pips = [];
  for (let i = 0; i < Math.floor(progress * numPips); i++) {
    pips.push(
      <div
        key={id + "_" + i}
        style={{
          width: 12,
          height: 12,
          backgroundColor: '#6ce989',
        }}
      >

      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
      }}
    >
      <div
        id={id}
        style={{
          display: 'flex',
          gap: 2,
          border: '1px solid #6ce989',
          backgroundColor: 'inherit',
          height: 14,
          width: 14 * numPips - 2,
        }}
      >
        {pips}
      </div>
      {enqueued !== null ? `(${enqueued})` : null}
    </div>
  );
};

module.exports = ProgressBar;

