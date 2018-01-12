#! /usr/bin/env node

const ora = require('ora');
const spinner = ora({'text': 'Loading results', 'color': 'cyan'}).start();
const commandLineArgs = require('command-line-args');
const validateCLIArguments = require('./validateCLIArguments');
const googleIt = require('./googleIt');
const optionDefinitions = require('./optionDefinitions');
const cliOptions = commandLineArgs(optionDefinitions);

// first arg is 'node', second is /path/to/file/app.js, third is whatever follows afterward
if (process.argv.length > 2) {
  cliOptions.query = process.argv[2];
}
const validation = validateCLIArguments(cliOptions);

if (! validation.valid) {
  console.log(`Invalid options. Error: ${validation.error}`);
  spinner.stop();
} else {
  googleIt(cliOptions)
    .then(() => spinner.stop())
    .catch(err => console.err(err));
}
