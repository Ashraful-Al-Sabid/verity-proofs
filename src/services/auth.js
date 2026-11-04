export async function authenticate(client, { mode, email, password, name }) {
  if (!client) throw new Error('Account sign-in is unavailable. Continue as a guest or try the demo.');
  const response = mode === 'signup'
    ? await client.auth.signUp({ email, password, options: { data: { full_name: name || email.split('@')[0] } } })
    : await client.auth.signInWithPassword({ email, password });
  if (response.error) throw response.error;
  if (mode === 'signup' && !response.data?.session) return { confirmationRequired: true, user: null };
  if (!response.data?.session || !response.data?.user) throw new Error('No authenticated session was returned. Please sign in again.');
  return { user: response.data.user, confirmationRequired: false };
}
