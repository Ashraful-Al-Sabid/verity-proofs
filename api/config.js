// Vercel Serverless Function: Public App Configuration
// Returns public Supabase project URL & public Anon Key from Vercel environment variables.

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const hasServerGemini = !!process.env.GEMINI_API_KEY;

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    hasServerGemini
  });
}
