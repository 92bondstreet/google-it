const {curly} = require('node-libcurl');
const cheerio = require('cheerio');
const fs = require('fs');
const UserAgent = require('user-agents');

require('colors');

const GOOGLE_DEFAULT_RESULTS = 10;
const GOOGLE_LIMIT_RESULTS = 100;
const HIGHLIGHT_TAG = 'mark';
const STATUS = /^[2-3][0-9][0-9]$/;
const HEADERS = {
  'accept': '*/*',
  'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'authority': 'www.google.com',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'x-client-data': 'CIu2yQEIpbbJAQjEtskBCKmdygEIvLDKAQj3tMoBCJi1ygEI7LXKARirpMoBGNWxygE='
};
const ua = new UserAgent({'deviceCategory': 'desktop'});

const googleIt = async configuration => {
  const {cookie, headers, highlight = HIGHLIGHT_TAG, limit = GOOGLE_DEFAULT_RESULTS, output, proxy, query} = configuration;
  const num = limit > GOOGLE_LIMIT_RESULTS ? GOOGLE_LIMIT_RESULTS : limit;

  try {
    const url = new URL('https://www.google.com/search');
    const raiders = {...headers, ...HEADERS, 'User-Agent': ua.random().toString()};
    const HTTPHEADER = Object.entries(raiders).map(([key, value]) => `${key}: ${value}`);
    const params = {
      num,
      'q': query,
      'gws_rd': 'ss'
    };

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const options = {HTTPHEADER};

    if (proxy) {
      options.PROXY = proxy;
    }

    if (cookie) {
      options.COOKIE = cookie;
    }

    const {data, statusCode} = await curly.get(url.href, options);

    if (! STATUS.test(statusCode)) {
      console.error(statusCode);
      return Promise.reject(statusCode);
    }

    const results = getResults(data, configuration['no-display'], highlight);

    if (output !== undefined) { //eslint-disable-line
      fs.writeFile(
        output,
        JSON.stringify(results, null, 2),
        'utf8',
        error => {
          if (error) {
            console.err('Error writing to file ' + output + ': ' + error);
          }
        }
      );
    }

    if (results.length === 0) {
      return Promise.reject(`NO_RESULT_FOUND | ${statusCode}`);
    }
    return Promise.resolve(results);
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

/**
 * Decode the google dom results
 * @param  {Object} data
 * @param  {Boolean} noDisplay
 * @return {Array}
 */
function getResults (data, noDisplay, highlight) {
  const $ = cheerio.load(data);
  const results = $('div.rc > div.r').map((i, element) => {
    return {'title': $(element).find('h3').text(), 'link': $(element).find('a').attr('href')};
  }).get();

  // result snippets
  $('div.rc > div.s > div > span.st').map((index, elem) => {
    if (index < results.length) {
      // replace em tag with a custom hightlight tag
      $(elem).find('em').each((i, item) => {
        item.tagName = highlight;
      });

      const snippet = $(elem).text();
      const html = $(elem).html();

      results[index] = Object.assign(results[index], {html, snippet, 'rank': index});
    }
  });

  if (! noDisplay) {
    results.forEach(result => {
      console.log(result.title.blue);
      console.log(result.link.green);
      console.log(result.snippet);
      console.log('\n');
    });
  }
  return results;
}

module.exports = googleIt;
