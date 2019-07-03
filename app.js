import fs from 'fs';
import { app, query } from 'mu';
import xmlbuilder from 'xmlbuilder';
import path from 'path';
import moment from 'moment';

const sitemapPath = '/data/sitemap.xml';
const sitemapMaxAge = process.env.SITEMAP_MAX_AGE || 5;

if (!fs.existsSync('/data')) {
  fs.mkdirSync('/data');
}

app.get('/sitemap.xml', async function(req, res, next) {
  try {
    await ensureSitemapIsRecent();
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

async function ensureSitemapIsRecent() {
  if (fs.existsSync(sitemapPath)) {
    const birthtime = fs.statSync(sitemapPath).birthtime;
    const datetime = new Date();

    if (moment(datetime).diff(moment(birthtime), 'minutes') >= sitemapMaxAge) {
      console.log('Sitemap is too old, deleting.');
      fs.unlinkSync(sitemapPath);
    }
  }
}

async function ensureSitemapExists() {
  if (!fs.existsSync(sitemapPath)) {
    // if file doesn't exist
    var urls = await querySitemapResources([], '/config/', '.rq');

    if (urls.length) {
      const baseUrl = new URL(urls[0]).origin;
      urls.unshift(baseUrl);
    }
    console.log('Creating a new sitemap.');
    await buildSitemap(urls);
  } else {
    console.log('Serving an existing sitemap.');
  }
}

async function querySitemapResources(urls, folderPath, fileExtension) {
  const files = fs.readdirSync(folderPath);
  for (var i = 0; i < files.length; i++) {
    const filename = path.join(folderPath, files[i]);
    const stat = fs.statSync(filename);
    if (stat.isDirectory()) {
      // Recursive call
      urls = urls.concat(await querySitemapResources(urls, filename, fileExtension));
    } else if (filename.indexOf(fileExtension) >= 0) {
      const queryString = fs.readFileSync(filename).toString('utf-8');
      const result = await query(queryString);
      urls = result.results.bindings.map((row) => row['url'].value);
    };
  };
  return urls;
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
