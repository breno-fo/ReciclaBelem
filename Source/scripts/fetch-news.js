/**
 * ReciclaBelém - Coletor Automático de Notícias (Notícias de Ecologia & Reciclagem em Belém/Ananindeua/Outeiro)
 * Extrai foto real (og:image / News:Image) e texto completo dos sites originais.
 * Execução manual: `node scripts/fetch-news.js`
 * Execução automática: agendada no `server.js` todos os dias (08h e 20h).
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

const QUERIES = [
  'reciclagem coleta seletiva Belém Pará',
  'ecologia sustentabilidade meio ambiente Belém Ananindeua Outeiro Pará'
];

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(regex);
  return m ? m[1].trim() : '';
}

function extractMetaContent(html, keys) {
  for (const key of keys) {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, 'i')
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m && m[1]) return decodeHtmlEntities(m[1]);
    }
  }
  return '';
}

function extractArticleParagraphs(html) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');

  const matches = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const paragraphs = matches
    .map((p) => decodeHtmlEntities(p))
    .filter(
      (txt) =>
        txt.length > 60 &&
        !/cookie|privacidade|assine|inscreva-se|copyright|todos os direitos|javascrip/i.test(txt)
    );

  if (paragraphs.length === 0) return '';
  return paragraphs.slice(0, 2).join(' ').slice(0, 440).trim();
}

function formatDatePtBr(pubDateStr) {
  const dt = pubDateStr ? new Date(pubDateStr) : new Date();
  if (Number.isNaN(dt.getTime())) {
    return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function unwrapRealUrl(rssLink) {
  try {
    const u = new URL(rssLink);
    const inner = u.searchParams.get('url');
    if (inner && /^https?:\/\//i.test(inner)) {
      return inner;
    }
  } catch (e) {}
  return rssLink;
}

async function fetchOriginalArticleDetails(articleUrl, fallbackSummary, fallbackImage, fallbackSource) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7500);

  try {
    const res = await fetch(articleUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });
    clearTimeout(timer);

    const finalUrl = res.url || articleUrl;
    if (!res.ok) {
      return {
        imageUrl: fallbackImage || '',
        summary: fallbackSummary,
        sourceUrl: finalUrl,
        sourceName: fallbackSource
      };
    }

    const html = await res.text();
    let imageUrl = extractMetaContent(html, ['og:image', 'twitter:image', 'twitter:image:src']);
    if (imageUrl && imageUrl.startsWith('//')) {
      imageUrl = `https:${imageUrl}`;
    }
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      try {
        imageUrl = new URL(imageUrl, finalUrl).href;
      } catch (e) {
        imageUrl = '';
      }
    }
    if (!imageUrl && fallbackImage) {
      imageUrl = fallbackImage;
    }

    const ogDesc = extractMetaContent(html, ['og:description', 'description', 'twitter:description']);
    const bodyText = extractArticleParagraphs(html);

    let summary = fallbackSummary;
    if (bodyText && bodyText.length > (fallbackSummary?.length || 0)) {
      summary = bodyText + (bodyText.length >= 435 ? '...' : '');
    } else if (ogDesc && ogDesc.length > (fallbackSummary?.length || 0)) {
      summary = ogDesc;
    }

    let sourceName = fallbackSource;
    if (!sourceName) {
      try {
        sourceName = new URL(finalUrl).hostname.replace(/^www\./, '');
      } catch (e) {
        sourceName = 'Portal de Notícias';
      }
    }

    return {
      imageUrl,
      summary,
      sourceUrl: finalUrl,
      sourceName
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      imageUrl: fallbackImage || '',
      summary: fallbackSummary,
      sourceUrl: articleUrl,
      sourceName: fallbackSource
    };
  }
}

async function fetchBingNewsRss(query) {
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&mkt=pt-BR`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao consultar Bing News`);
  const xml = await res.text();

  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  return items
    .map((itemXml) => {
      const title = decodeHtmlEntities(extractTag(itemXml, 'title'));
      const rawLink = decodeHtmlEntities(extractTag(itemXml, 'link'));
      const link = unwrapRealUrl(rawLink);
      const pubDate = extractTag(itemXml, 'pubDate');
      const source = decodeHtmlEntities(extractTag(itemXml, 'News:Source')) || '';
      const image = decodeHtmlEntities(extractTag(itemXml, 'News:Image')) || '';
      const desc = decodeHtmlEntities(extractTag(itemXml, 'description'));

      return {
        title,
        link,
        pubDate,
        source,
        fallbackImage: image,
        fallbackSummary: desc || title
      };
    })
    .filter((item) => !/Belém do Piauí|Belém de Maria|Belém do São Francisco/i.test(item.title));
}

async function fetchAndUpdateNews() {
  const collected = [];
  const seenTitles = new Set();

  for (const q of QUERIES) {
    try {
      const items = await fetchBingNewsRss(q);
      for (const item of items) {
        const key = item.title.toLowerCase().slice(0, 60);
        if (!seenTitles.has(key) && collected.length < 10) {
          seenTitles.add(key);
          collected.push(item);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Falha ao buscar query "${q}":`, err.message);
    }
  }

  if (collected.length === 0) {
    return { ok: false, added: 0, message: 'Nenhuma notícia retornada no momento.' };
  }

  const topItems = collected.slice(0, 6);
  const enrichedNews = [];

  for (let i = 0; i < topItems.length; i++) {
    const item = topItems[i];
    const details = await fetchOriginalArticleDetails(
      item.link,
      item.fallbackSummary,
      item.fallbackImage,
      item.source
    );

    enrichedNews.push({
      id: `gnews-${Date.now()}-${i}`,
      title: item.title,
      category: 'Ecologia & Região',
      date: formatDatePtBr(item.pubDate),
      author: details.sourceName || 'Portal de Notícias',
      featured: i === 0,
      summary: details.summary,
      imageUrl: details.imageUrl || '',
      sourceUrl: details.sourceUrl || item.link,
      isAuto: true
    });
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const manualNews = (db.news || []).filter((n) => !n.isAuto && !String(n.id).startsWith('gnews-'));

  db.news = [...enrichedNews, ...manualNews];
  db.meta = db.meta || {};
  db.meta.lastNewsSync = new Date().toISOString();
  db.meta.lastUpdated = new Date().toISOString();

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

  return {
    ok: true,
    added: enrichedNews.length,
    withImages: enrichedNews.filter((n) => !!n.imageUrl).length,
    lastNewsSync: db.meta.lastNewsSync
  };
}

module.exports = { fetchAndUpdateNews };

if (require.main === module) {
  console.log('🔎 Buscando notícias de ecologia em Belém, Ananindeua e Outeiro...');
  fetchAndUpdateNews()
    .then((res) => {
      console.log('✅ Resultado:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Erro:', err);
      process.exit(1);
    });
}
