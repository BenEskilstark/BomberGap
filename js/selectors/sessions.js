
const getSession = (state) => {
  for (const id in state.sessions) {
    const session = state.sessions[id];
    if (session.clients.includes(state.clientID)) return session;
  }
  return null;
}

const isHost = (state) => {
  const session = getSession(state);
  if (!session) return false;
  return session.clients[0] == state.clientID;
}

module.exports = {
  getSession,
  isHost,
};
