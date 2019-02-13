const cheerio = require('cheerio');
const fs = require('fs');
const merge = require('lodash.merge');
const randomUseragent = require('random-useragent');
const request = require('superagent');

require('colors');
require('superagent-proxy')(request);

const RANDOM_USER_AGENT = randomUseragent.getRandom(ua => ua.osName === 'Mac OS' && ua.browserName === 'Chrome' && parseFloat(ua.browserVersion) >= 50);
const STATUS = /^[2-3][0-9][0-9]$/;
const TIMEOUT = 30000;
const HEADERS = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'authority': 'www.google.fr',
  'cache-control': 'no-cache',
  'cookie': 'SID=fakesidforproxy',
  'pragma': 'no-cache',
  'upgrade-insecure-requests': '1',
  'user-agent': RANDOM_USER_AGENT,
  'x-chrome-uma-enabled': 1
};

/**
 * Format superagent error for better logging
 * @param  {String} reason
 * @param  {Object} response
 * @return {String}
 */
const formatError = (reason, response) => {
  const splitMessage = response.message ? response.message.split('\n') : [response.error];
  const message = splitMessage[splitMessage.length - 1];
  const status = response.status || response.type || response.name;

  return `${reason} - ${status} - ${message}`;
};

// NOTE:
// I chose the User-Agent value from http://www.browser-info.net/useragents
// Not setting one causes Google search to not display results

const googleIt = configuration => {
  const {headers, output, proxy, query} = configuration;
  let message = '';
  let rqst;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      rqst.abort();
      reject('STRICT_TIMEOUT');
    }, TIMEOUT);

    rqst = request.agent()
      .get('https://www.google.com/search')
      .query({
        'q': query,
        'gws_rd': 'ss',
        'num': 10
      })
      .set(merge(HEADERS, headers))
      .timeout(TIMEOUT);

    if (proxy) {
      rqst = rqst.proxy(`http://${proxy}`);
    }

    rqst
      .end((err, res) => {
        clearTimeout(timer);
        if (err) {
          message = formatError('UNTRACKED_ERROR', err);

          if (err.status === 404) {
            message = 'PAGE_NOT_FOUND';
          } else if (res && ! STATUS.test(res.status)) {
            message = formatError('STATUS_4xx_5xx', res);
          }

          return reject(message);
        }

        if (! STATUS.test(res.status)) {
          message = formatError('STATUS_4xx_5xx', res);
          return reject(message);
        }

        const results = getResults(res.text, configuration['no-display']);

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
          return reject('NO_RESULT_FOUND');
        }

        return resolve(results);
      });
  });
};

function getResults (data, noDisplay) {
  const $ = cheerio.load(data);
  const results = $('div.rc > div.r').map((i, element) => {
    return {'title': $(element).find('h3').text(), 'link': $(element).find('a').attr('href')};
  }).get();

  // result snippets
  $('div.rc > div.s > div > span.st').map((index, elem) => {
    if (index < results.length) {
      const snippet = $(elem).text();
      const html = $(elem).html();

      results[index] = Object.assign(results[index], {html, snippet});
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
