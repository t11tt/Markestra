/**
 * Poster generation seam.
 *
 * The browser currently composes a poster from the merchant's photos plus
 * category, offer, and intent (`renderPoster` in src/lib/poster.ts).
 * When POSTER_API_URL is set, a later route can POST that same brief and
 * replace the local PNG. Nothing calls a remote service until that URL exists.
 */
export function posterApiUrl() {
  const url = process.env.POSTER_API_URL?.trim();
  return url || null;
}
