const googleIt = require('./googleIt');

async function sandbox () {
  try {
    const options = {
      'headers': {
        'cookies': 'CONSENT=YES+PT.fr+V7;'
      }
    };
    const results = await googleIt({options, 'query': 'covfefe irony', 'no-display': true});

    console.log(results);
  } catch (e) {
    console.error(e);
  }
}

sandbox();
