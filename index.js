#!/usr/bin/env node

'use strict';

//originally broken out into a separate file for testing... but INCOMPLETE because the "commander" library messes with STDOUT and exit codes directly.
// So testing actually uses a sub-process now, and this separation is only part
const cmdLineUtil = require('./cmdLineUtil');

//call the lib, passing in all the "process" bits (statics) that we don't want to go messing with when testing.
cmdLineUtil(process.argv, process.stdin, process.stdout)
  .then(result => {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.exitCode);
  })
  .catch(err => {
    console.error(err);
    process.exit(2);
  });
