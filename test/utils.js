'use strict'

const spawn = require('cross-spawn');

const CMDLINEUTILITY = __dirname + '/../index.js';

function formatterPromise(args, input) {
  return new Promise(function(resolve) {
    var outStuff = {};
    var cmdLineFormatter = spawn(CMDLINEUTILITY, args);

    //set up data collection
    //TODO: encoding stuff...
    cmdLineFormatter.stdout.on('data', stuff => outStuff.stdout = (outStuff.stdout||'') + stuff );
    cmdLineFormatter.stderr.on('data', stuff => outStuff.stderr = (outStuff.stderr||'') + stuff );
    cmdLineFormatter.stdout.on('error', stuff => outStuff.stdoutError = (outStuff.stdoutError||'') + stuff );
    cmdLineFormatter.stderr.on('error', stuff => outStuff.stderrError = (outStuff.stderrError||'') + stuff );
    cmdLineFormatter.stdin.on('error', stuff => outStuff.stdinError = (outStuff.stdinError||'') + stuff );

    //resolve the promise on exit
    cmdLineFormatter.on('exit', exitCode => { outStuff.exitCode = exitCode; resolve(outStuff); } );

    //actually queue feeding the process data, if appropriate;
    //TODO: encoding stuff...
    if (input)
      cmdLineFormatter.stdin.write(input);

    //finish the data feed... UNCLEAR whether this is a necessary call in the absence of stdin input.
    cmdLineFormatter.stdin.end();
  });
} 

module.exports.formatterPromise = formatterPromise;