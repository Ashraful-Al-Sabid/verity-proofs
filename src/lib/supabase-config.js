export function cleanSupabaseUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim().replace(/^["']|["']$/g, '').trim();
  if (!url) return '';

  const dashMatch = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashMatch) {
    return `https://${dashMatch[1]}.supabase.co`;
  }

  if (!/^https?:\/\//i.test(url)) {
    if (/^[a-z0-9_-]{15,40}$/i.test(url)) {
      return `https://${url}.supabase.co`;
    }
    url = 'https://' + url;
  }

  // Strip trailing endpoints like /auth/v1, /rest/v1, /functions/v1, /storage/v1, or trailing slashes
  url = url.replace(/\/+(auth|rest|functions|storage)\/v\d+.*$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

export function cleanSupabaseKey(rawKey) {
  if (typeof rawKey !== 'string') return '';
  return rawKey.trim().replace(/^["']|["']$/g, '').trim();
}

export function sanitizeSupabaseConfig(rawUrl, rawKey) {
  let urlStr = typeof rawUrl === 'string' ? rawUrl.trim().replace(/^["']|["']$/g, '').trim() : '';
  let keyStr = typeof rawKey === 'string' ? rawKey.trim().replace(/^["']|["']$/g, '').trim() : '';

  // If user accidentally swapped URL and Key:
  // Anon key usually starts with "eyJ" (JWT) or "sb_publishable_" or has no dot/hostname
  // URL starts with "http" or contains "supabase.co"
  if (urlStr && keyStr && (urlStr.startsWith('eyJ') || (!urlStr.includes('.') && keyStr.includes('.')) || (!urlStr.includes('supabase') && keyStr.includes('supabase')))) {
    const temp = urlStr;
    urlStr = keyStr;
    keyStr = temp;
  }

  const url = cleanSupabaseUrl(urlStr);
  const key = cleanSupabaseKey(keyStr);
  const isConfigured = !!(url && key && !url.includes('xyzcompany') && !url.includes('YOUR_PROJECT'));
  return { url, key, isConfigured };
}
