const googleIt = require('./googleIt');

async function sandbox (proxy) {
  try {
    const query = 'covfefe irony';
    const options = {
      proxy,
      'no-display': true,
      'limit': 150
    };
    const results = await googleIt(Object.assign({}, {query}, options));

    console.log(results);
    console.log(`${results.length} potential links from ${query}...`);
  } catch (e) {
    console.error(e);
  }
}

const [,, proxy] = process.argv;

sandbox(proxy);
