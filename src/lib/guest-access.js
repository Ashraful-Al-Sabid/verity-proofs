export function guestLoginRequired(user) {
  return !user || (!!user.isLocalFallback && !user.isDemo);
}
