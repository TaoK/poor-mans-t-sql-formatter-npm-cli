'use strict'

const assert = require('chai').assert;
const utils = require('./utils');

describe('PoorMansTSqlFormatterLib', function() {

  it('Invalid SQL fails with exit code 1', function() {
    return utils.formatterPromise([], "select if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 1);
        assert.exists(outStuff.stderr);
        assert.equal(outStuff.stdout, "--WARNING! ERRORS ENCOUNTERED DURING SQL PARSING!\nSELECT\n\nIF \n");
      });
  });

  it('Invalid SQL succeeds if --ignoreErrors provided', function() {
    return utils.formatterPromise(["--ignoreErrors"], "select if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stderr);
        assert.equal(outStuff.stdout, "--WARNING! ERRORS ENCOUNTERED DURING SQL PARSING!\nSELECT\n\nIF \n");
      });
  });

  it('Invalid SQL succeeds if -e provided', function() {
    return utils.formatterPromise(["-e"], "select if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stderr);
        assert.equal(outStuff.stdout, "--WARNING! ERRORS ENCOUNTERED DURING SQL PARSING!\nSELECT\n\nIF \n");
      });
  });

  it('Valid SQL succeeds with exit code 0', function() {
    return utils.formatterPromise([], "select")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stderr);
        assert.equal(outStuff.stdout, "SELECT\n");
      });
  });

  it('Empty SQL succeeds with exit code 0', function() {
    return utils.formatterPromise([], "")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stderr);
        assert.equal(outStuff.stdout, "\n");
      });
  });

  //encoding
  //BOM handling

  // look up / research how filename vs stdin typically works in unix. Should pipe take precedence when both provided, or should file? Should error if both??
  //  CONSIDER JUST STDIN for the time being... (change usage doc)

  //filename input
  //filename output??

  //every option tested...

  //README!!

});

