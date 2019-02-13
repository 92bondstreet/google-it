const googleIt = require('./googleIt');

async function sandbox () {
  try {
    const query = 'covfefe irony';
    const options = {
      'no-display': true,
      'proxy': 'localhost:8118',
      'limit': 150
    };
    const results = await googleIt(Object.assign({}, {query}, options));

    console.log(results);
    console.log(`${results.length} potential links from ${query}...`);
  } catch (e) {
    console.error(e);
  }
}

sandbox();
