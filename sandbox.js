const googleIt = require('./googleIt');

async function sandbox () {
  try {
    const query = 'covfefe irony';
    const options = {
      'no-display': true,
      'headers': {
        'cookie': 'CONSENT=WP.2690f0.269181'
      },
      'proxy': 'localhost:8118'
    };
    const results = await googleIt(Object.assign({}, {query}, options));

    console.log(results);
  } catch (e) {
    console.error(e);
  }
}

sandbox();
