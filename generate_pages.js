// Build script (run by Vercel): splits catalog data out of the HTML and
// prerenders one static page per bearing/type with unique SEO meta.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('parasmani_enterprise.html', 'utf8');
const bearsLine = html.match(/^const BEARS = .*$/m)[0];
const typeMetaLine = html.match(/^const TYPE_META = .*$/m)[0];
const BEARS = JSON.parse(bearsLine.replace(/^const BEARS = /, '').replace(/;\s*$/, ''));
const TYPE_META = JSON.parse(typeMetaLine.replace(/^const TYPE_META = /, '').replace(/;\s*$/, ''));

// same imgUrl fix-up as the app runs at load time (kept in sync manually)
const extMap = {"117":"jpg","2":"avif","23":"avif","2924":"jpg","29413M":"jpg","3032":"jpg","32005x":"jpg","32006J":"jpg","32007":"jpg","32008q":"jpg","32010x":"jpg","32011x":"jpg","32012x":"jpg","32012xu":"jpg","32013xf":"jpg","32015jr":"jpg","32018xf":"jpg","51416M":"avif","52411":"avif","53178D":"jpg","558":"jpg","6215-2RS1":"avif","6311l":"jpg","7000":"avif","7221":"jpg","81208":"avif","81236":"avif","C2215V":"avif","COP":"jpg","COPM":"avif","CY":"avif","CYR":"jpg","DOUBLEDITHBE":"avif","DP1":"jpg","FY":"avif","FYTJ":"avif","KMT":"avif","LRJA":"webp","NJ205":"avif","NR1":"webp","NR11":"jpeg","NRO":"png","NU205":"avif","NU205M":"avif","PILLOW":"avif","SHP1":"avif","SLEEVE":"avif","SP1":"jpeg","STEEL":"avif","TDO":"jpg","THRUST":"webp","TUJ":"avif","UC":"jpg","UCF":"avif","UCFC":"avif","WF":"avif","YAR":"avif","bearing background light":"png","cone":"jpeg","cone2":"webp","cr1":"avif","cup":"jpg","dr1":"avif","drt1":"avif","fp1":"avif","h&b":"jpg","hero-bg":"png","logo":"jpg","nutr":"avif","sb":"jpg","sf1":"avif","spr1":"jpeg","tp1":"avif","trtb1":"webp"};
for (const b of BEARS) {
  let base = b.img;
  if (base === '53178') base = '53178D';
  if (base === '51416') base = '51416M';
  if (base === 'Sb') base = 'sb';
  let ext = extMap[base];
  if (!ext) {
    if (base && base.startsWith('SP')) { ext = 'jpeg'; base = 'SP1'; }
    else if (!base) { ext = 'jpg'; base = 'DP1'; }
    else { ext = 'avif'; base = 'tp1'; }
  }
  b.imgUrl = `/photos/${base}.${ext}`;
}

// shell: data moved to /data.js, loaded before the app script
let shell = html.replace(bearsLine, '').replace(typeMetaLine, '');
shell = shell.replace('<script>\n// ── DATA ──', '<script src="/data.js"></script>\n<script>\n// ── DATA ──');
if (!shell.includes('src="/data.js"')) throw new Error('data.js injection point not found');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function stamp(page, { title, desc, canonical, ldJson }) {
  page = page.replace(/<title id="pageTitle">[^<]*<\/title>/, `<title id="pageTitle">${esc(title)}</title>`);
  page = page.replace(/(<meta name="description" id="pageDesc" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  page = page.replace(/(<meta property="og:title" id="ogTitle" content=")[^"]*(")/, `$1${esc(title)}$2`);
  page = page.replace(/(<meta property="og:description" id="ogDesc" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  page = page.replace(/(<meta property="og:url" id="ogUrl" content=")[^"]*(")/, `$1${esc(canonical)}$2`);
  page = page.replace(/(<link rel="canonical" id="canonical" href=")[^"]*(")/, `$1${esc(canonical)}$2`);
  if (ldJson) page = page.replace(/(<script type="application\/ld\+json" id="ldJson">)[\s\S]*?(<\/script>)/, `$1${JSON.stringify(ldJson)}$2`);
  return page;
}

const normCond = c => {
  c = (c || '').toUpperCase().trim();
  if (c.includes('NEW') && (c.includes('OLD') || c.includes('USED'))) return 'NEW & OLD';
  if (c.includes('NEW')) return 'NEW';
  if (c.includes('OLD') || c.includes('USED')) return 'USED';
  return c || 'N/A';
};

const OUT = 'dist';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'type'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'bearing'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), shell);
fs.writeFileSync(path.join(OUT, 'data.js'), bearsLine + '\n' + typeMetaLine + '\n');
for (const f of ['photos', 'favicon', 'robots.txt', 'sitemap.xml']) fs.cpSync(f, path.join(OUT, f), { recursive: true });

// type pages
const types = [...new Set(BEARS.map(b => b.type.trim()).filter(Boolean))];
let nType = 0;
for (const type of types) {
  if (!/^[A-Za-z0-9&._-]+$/.test(type)) continue;
  const meta = TYPE_META[type] || {};
  const label = meta.label || type.replace(/-/g, ' ');
  const bears = BEARS.filter(b => b.type.trim() === type);
  const brands = [...new Set(bears.map(b => b.brand.split(',')[0].split('/')[0].trim()).filter(Boolean))].slice(0, 5);
  fs.writeFileSync(path.join(OUT, 'type', type + '.html'), stamp(shell, {
    title: `${label} – Buy New & Used | Parasmani Enterprise`,
    desc: `Parasmani Enterprise stocks ${bears.length} models of ${label.toLowerCase()}. New and used. Brands: ${brands.join(', ')}. Export from Gujarat, India. WhatsApp inquiry.`,
    canonical: `https://parasmanienterprise.com/type/${type}`,
  }));
  nType++;
}

// bearing pages (first occurrence wins, matching BEARS.find in the app)
const seen = new Set();
let nBear = 0;
for (const b of BEARS) {
  const slug = b.slug;
  if (!/^[A-Za-z0-9._-]+$/.test(slug) || seen.has(slug)) continue;
  seen.add(slug);
  const typeLabel = (TYPE_META[b.type.trim()] || {}).label || b.type.replace(/-/g, ' ');
  const cond = normCond(b.cond);
  const descLines = b.desc ? b.desc.split('\n').filter(l => l.trim()) : [];
  fs.writeFileSync(path.join(OUT, 'bearing', slug + '.html'), stamp(shell, {
    title: `${b.model || b.name} ${typeLabel} | Buy New & Used | Parasmani Enterprise`,
    desc: `Buy ${b.model || b.name} ${typeLabel.toLowerCase()} bearing. Brand: ${b.brand}. ID: ${b.id_mm}mm, OD: ${b.od_mm}mm. Condition: ${cond}. Exporter from Gujarat, India. WhatsApp inquiry.`,
    canonical: `https://parasmanienterprise.com/bearing/${slug}`,
    ldJson: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${b.model || b.name} Bearing`,
      description: descLines.join('. ') || `${typeLabel} bearing – ${b.brand}.`,
      brand: { '@type': 'Brand', name: b.brand.split(',')[0].trim() },
      model: b.model,
      sku: b.model || b.name,
      image: `https://parasmanienterprise.com${b.imgUrl}`,
      offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Parasmani Enterprise' }, priceCurrency: 'INR', price: '0', url: `https://parasmanienterprise.com/bearing/${slug}` },
    },
  }));
  nBear++;
}

console.log(`dist ready: shell + data.js + ${nType} type pages + ${nBear} bearing pages`);
