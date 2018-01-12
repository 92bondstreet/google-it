const request = require('request');
const fs = require('fs');
const cheerio = require('cheerio');

// NOTE:
// I chose the User-Agent value from http://www.browser-info.net/useragents
// Not setting one causes Google search to not display results

function googleIt (config) {
  const {query, numResults, userAgent, output, options = {}} = config;
  const defaultOptions = {
    'url': `https://www.google.com/search?q=${query}&gws_rd=ssl&num=${numResults
      || 10}`,
    'headers': {
      'User-Agent':
        userAgent
        || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:34.0) Gecko/20100101 Firefox/34.0'
    }
  };

  return new Promise((resolve, reject) => {
    request(
      Object.assign({}, defaultOptions, options),
      (error, response, body) => {
        if (error) {
          return reject('Error making web request: ' + error, null);
        }
        var results = getResults(body, config['no-display']);

        if (output !== undefined) { //eslint-disable-line
          fs.writeFile(
            output,
            JSON.stringify(results, null, 2),
            'utf8',
            err => {
              if (err) {
                console.err('Error writing to file ' + output + ': ' + err);
              }
            }
          );
        }
        return resolve(results);
      }
    );
  });
}

function getResults (data, noDisplay) {
  const $ = cheerio.load(data);
  const results = [];

  // result titles
  const titles = $('div.rc > h3.r > a').contents();

  titles.each((index, elem) => {
    results.push({'title': elem.data});
  });

  // result links
  $('div.rc > h3.r > a').map((index, elem) => {
    if (index < results.length) {
      results[index] = Object.assign(results[index], {
        'link': elem.attribs.href
      });
    }
  });

  // result snippets
  $('div.rc > div.s > div > span.st').map((index, elem) => {
    if (index < results.length) {
      var snippet = elem.children
        .map(child => {
          if (child.data === null) {
            return child.children.map(c => c.data);
          }
          return child.data;
        })
        .join('');

      results[index] = Object.assign(results[index], {'snippet': snippet});
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
