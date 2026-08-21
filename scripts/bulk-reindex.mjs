// Bulk Reindex Script — submits all active posts to Google Indexing API + IndexNow
// Run: node scripts/bulk-reindex.mjs
// Quota: Google allows 200 URL_UPDATED requests/day. 37 posts = well within limit.

import { createClient } from '@supabase/supabase-js';
import { createSign } from 'crypto';
import { config } from 'dotenv';

config({ path: '.env.local' });

const BASE_URL = 'https://www.rojgarsuvidha.com';
const SITE_HOST = 'www.rojgarsuvidha.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const CREDS_JSON = process.env.GOOGLE_INDEXING_CREDENTIALS;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getGoogleToken() {
  const creds = JSON.parse(CREDS_JSON);
  const now = Math.floor(Date.now() / 1000);
  const enc = (obj) => Buffer.from(JSON.stringify(obj))
    .toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const header = enc({ alg: 'RS256', typ: 'JWT' });
  const claim = enc({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
  });
  const sigInput = `${header}.${claim}`;
  const sign = createSign('SHA256');
  sign.update(sigInput);
  const sig = sign.sign(creds.private_key).toString('base64')
    .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sigInput}.${sig}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function submitToGoogle(url, token) {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    return `FAIL(${res.status}: ${d.error?.message || ''})`;
  }
  return 'OK';
}

async function submitIndexNowBatch(urls) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
  return res.status;
}

(async () => {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  BULK REINDEX — Submitting all active posts to Google');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Fetch all active posts
  const { data: posts, error } = await sb
    .from('jobs')
    .select('slug, category, title')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) { console.error('DB Error:', error.message); process.exit(1); }

  const urls = posts.map(p => `${BASE_URL}/job/${p.slug}`);
  console.log(`📋 Total posts to submit: ${urls.length}\n`);

  // 2. Get Google OAuth2 token
  console.log('🔑 Getting Google OAuth2 token...');
  let token = null;
  try {
    token = await getGoogleToken();
    console.log('✅ Token obtained successfully\n');
  } catch (e) {
    console.error('❌ Token error:', e.message, '\n');
  }

  // 3. Google Indexing API — one by one with 350ms gap
  let googleOk = 0, googleFail = 0;
  if (token) {
    console.log('📡 Submitting to Google Indexing API...');
    for (let i = 0; i < posts.length; i++) {
      const url = urls[i];
      const result = await submitToGoogle(url, token);
      const icon = result === 'OK' ? '✅' : '❌';
      const label = posts[i].slug.slice(0, 55).padEnd(56);
      console.log(`  ${icon} [${String(i+1).padStart(2)}/${posts.length}] ${label} ${result}`);
      if (result === 'OK') googleOk++; else googleFail++;
      await new Promise(r => setTimeout(r, 350)); // rate-limit safe
    }
    console.log(`\n  Google API result: ${googleOk} submitted ✅  |  ${googleFail} failed ❌`);
  } else {
    console.log('⚠️  Skipping Google Indexing API (no token)');
  }

  // 4. IndexNow batch submission
  console.log('\n📡 IndexNow batch submission (all URLs at once)...');
  const indexNowStatus = await submitIndexNowBatch(urls);
  const indexNowOk = indexNowStatus === 200 || indexNowStatus === 202;
  console.log(`  Status: ${indexNowStatus} ${indexNowOk ? '✅ Accepted' : '⚠️ Check key'}`);

  // 5. Sitemap pings
  console.log('\n📡 Pinging sitemaps (Google + Bing + Yandex)...');
  const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
  const pings = await Promise.allSettled([
    fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`),
    fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`),
    fetch(`https://webmaster.yandex.com/ping?sitemap=${sitemapUrl}`),
  ]);
  ['Google', 'Bing', 'Yandex'].forEach((name, i) => {
    const r = pings[i];
    const ok = r.status === 'fulfilled';
    console.log(`  ${ok ? '✅' : '❌'} ${name} sitemap ping`);
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  DONE! Googlebot should crawl new pages within 2-15 min');
  console.log('  Check: https://search.google.com/search-console');
  console.log('═══════════════════════════════════════════════════════\n');
})().catch(e => { console.error('Fatal error:', e); process.exit(1); });
