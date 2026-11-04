export async function authenticate(client, { mode, email, password, name, redirectTo }) {
  if (!client) throw new Error('Account sign-in is unavailable. Continue as a guest or try the demo.');
  if (mode === 'google') {
    const targetUrl = redirectTo || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
    const response = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: targetUrl }
    });
    if (response.error) throw response.error;
    return { confirmationRequired: false, user: null, isOAuthRedirect: true };
  }
  const response = mode === 'signup'
    ? await client.auth.signUp({ email, password, options: { data: { full_name: name || email.split('@')[0] } } })
    : await client.auth.signInWithPassword({ email, password });
  if (response.error) throw response.error;
  if (mode === 'signup' && !response.data?.session) return { confirmationRequired: true, user: null };
  if (!response.data?.session || !response.data?.user) throw new Error('No authenticated session was returned. Please sign in again.');
  return { user: response.data.user, confirmationRequired: false };
}

export async function signInWithGoogle(client, redirectTo) {
  return authenticate(client, { mode: 'google', redirectTo });
}
