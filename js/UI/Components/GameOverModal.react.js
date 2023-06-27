const React = require('react');
const {Modal, Plot, Dropdown} = require('bens_ui_components');
const {dispatchToServer} = require('../../clientToServer');
const {useEffect, useState, useMemo} = React;

const GameOverModal = (props) => {
  const {winner, disconnect, stats, time} = props;
  const state = getState(); // HACK this comes from window;

  let title = winner == state.clientID ? 'You Win!' : 'You Lose!';
  let body = winner == state.clientID ? "You destroyed the enemy airbase" : "Your airbase was destroyed";
  if (disconnect) {
    title = "Opponent Disconnected";
    body = "The other player has closed the tab and disconnected. So I guess you win by forfeit...";
  }

  let otherClientID = null;
  for (const id in stats) {
    if (id != state.clientID) otherClientID = id;
  }

  const [stat, setStat] = useState('CITY');

  body = (
    <div>
      <div>{body}</div>
      <Dropdown
        value={stat}
        options={['CITY', 'FACTORY', 'AIRBASE', 'LAB', 'airforceValue', 'generation']}
        onChange={setStat}
      />
      <PlotStack stats={stats} time={time} selectedStat={stat} />
    </div>
  );

  return (
    <Modal
      title={title}
      body={body}
      style={{
        padding: 15,
        width: 650,
      }}
      buttons={[{
        label: 'Back to Menu', onClick: () => {
          dispatch({type: 'DISMISS_MODAL'});
          dispatch({type: 'SET_SCREEN', screen: 'LOBBY'});
          dispatchToServer({type: 'LEAVE_SESSION'});
        }
      }]}
    />
  );
};

const PlotStack = (props) => {
  const {stats, time, selectedStat} = props;

  let yMax = 0;
  let colors = ['blue', 'red'];
  let i = 0;
  for (const clientID in stats) {
    const points = stats[clientID][selectedStat];
    for (const point of points) {
      point.color = colors[i];
      if (point.y > yMax) {
        yMax = point.y;
      }
    }
    i++;
  }

  const plots = [];
  i = 0;
  for (const clientID in stats) {
    const initPoints = stats[clientID][selectedStat];
    const points = [
      ...initPoints,
      {x: time, y: initPoints[initPoints.length - 1].y, color: colors[i]},
    ];
    console.log(points, time);
    plots.push(
      <Plot
        canvasID={"plot"}
        key={"plot_" + i + "_" + selectedStat}
        isLinear={true}
        style={{
          position: 'absolute',
        }}
        points={points}
        dontClear={true}
        xAxis={{
          dimension: 'x', hidden: true,
          label: 'time', min: 0, max: time,
        }}
        yAxis={{
          dimension: 'y', hidden: true,
          label: selectedStat, min: 0, max: yMax + 1,
        }}
      />
    );
    i++;
  }

  return (
    <div
      style={{
        position: 'relative',
        height: 250,
      }}
    >
      {plots}
    </div>
  );
}


module.exports = GameOverModal;
