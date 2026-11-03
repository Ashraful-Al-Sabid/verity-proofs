export function guestLimitReached(state, user) {
  const loggedIn = user && (!user.isLocalFallback || user.isDemo);
  return !loggedIn && (state.guestSubmissions || 0) >= 1;
}

export function recordGuestSubmission(state, user) {
  if (!user || (user.isLocalFallback && !user.isDemo)) {
    state.guestSubmissions = (state.guestSubmissions || 0) + 1;
  }
}
