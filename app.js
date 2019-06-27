import fs from 'fs';
import { app, query } from 'mu';
import xmlbuilder from 'xmlbuilder';

const sitemapPath = 'sitemap.xml';

app.get('/sitemap.xml', async function(req, res, next) {
  try {
    await ensureSitemapExists();
    returnSitemap(res);
  } catch (e) {
    return next(new Error(e.message));
  }
});

function returnSitemap(res) {
  var stat = fs.statSync(sitemapPath);
  res.set('Content-Type', 'application/xml');
  res.set('Content-Length', stat.size);
  const stream = fs.createReadStream(sitemapPath);
  stream.pipe(res);
}

async function ensureSitemapExists() {
  if (!fs.existsSync(sitemapPath)) {
    // if file doesn't exist
    var urls = await querySitemapResources();
    if (urls.length) {
      const baseUrl = new URL(urls[0]).origin;
      urls.unshift(baseUrl);
    }
    await buildSitemap(urls);
  }
}

async function querySitemapResources() {
  const queryString = fs.readFileSync('/config/query.rq').toString('utf-8');

  const result = await query(queryString);
  return result.results.bindings.map((row) => row['url'].value);
}

async function buildSitemap(urls) {
  const xml = xmlbuilder.create('urlset', {}, {}, {separateArrayItems: true})
          .att('xmlns', "http://www.sitemaps.org/schemas/sitemap/0.9");
  for (var url of urls) {
    xml.ele({url: {loc: url}});
  }
  const output = xml.end({pretty: true});
  await new Promise(function (resolve, reject) {
    fs.writeFile(sitemapPath, output, (err) => {
      if (err)
        reject(err);
      else
        resolve();
    });
  });
}
