const googleIt = require('./googleIt');

async function sandbox (proxy, cookie) {
  try {
    const query = 'covfefe irony';
    const options = {
      cookie,
      proxy,
      'no-display': true,
      'limit': 75
    };
    const results = await googleIt(Object.assign({}, {query}, options));

    console.log(results);
    console.log(`${results.length} potential links from ${query}...`);
  } catch (e) {
    console.error(e);
  }
}

const [,, proxy, cookie] = process.argv;

sandbox(proxy, cookie);
