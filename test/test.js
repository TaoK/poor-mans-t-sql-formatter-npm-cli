'use strict'

const assert = require('chai').assert;
const utils = require('./utils');
const temp = require('temporary');
const fs = require('fs');

describe('PoorMansTSqlFormatterLib', function() {

  it('Invalid SQL fails with exit code 2', () => {
    return utils.formatterPromise([], "select if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 2);
        assert.exists(outStuff.stderr);
        assert.equal(outStuff.stdout, "--WARNING! ERRORS ENCOUNTERED DURING SQL PARSING!\nSELECT\n\nIF \n");
      });
  });

  it('Invalid SQL succeeds if --ignoreErrors provided', () => {
    return utils.formatterPromise(["--ignoreErrors"], "select if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stderr);
        assert.equal(outStuff.stdout, "--WARNING! ERRORS ENCOUNTERED DURING SQL PARSING!\nSELECT\n\nIF \n");
      });
  });

  it('Invalid SQL succeeds if -e provided', () => {
    return utils.formatterPromise(["-e"], "select if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stderr);
        assert.equal(outStuff.stdout, "--WARNING! ERRORS ENCOUNTERED DURING SQL PARSING!\nSELECT\n\nIF \n");
      });
  });

  it('Valid SQL succeeds with exit code 0', () => {
    return utils.formatterPromise([], "select")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stderr);
        assert.equal(outStuff.stdout, "SELECT\n");
      });
  });

  it('Empty SQL succeeds with exit code 0', () => {
    return utils.formatterPromise([], "")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stderr);
        assert.equal(outStuff.stdout, "\n");
      });
  });

  it('Arbitrary long parameter fails with exit code 1', () => {
    return utils.formatterPromise(["--SomeParameter"], "select 1")
      .then(outStuff => {
        assert.isAtLeast(outStuff.exitCode, 1);
        assert.notExists(outStuff.stdout);
      });
  });

  it('Arbitrary short parameter fails with exit code 1', () => {
    return utils.formatterPromise(["-Z"], "select 1")
      .then(outStuff => {
        assert.isAtLeast(outStuff.exitCode, 1);
        assert.notExists(outStuff.stdout);
      });
  });

  it('Unknown file input (short) fails with exit code > 2', () => {
    return utils.formatterPromise(["-f", "SomeTestFile"], "")
      .then(outStuff => {
        assert.isAtLeast(outStuff.exitCode, 3);
        assert.notExists(outStuff.stdout);
      });
  });

  it('File input (long) succeeds, and stdin is ignored when file provided', () => {
    var inputFile = new temp.File();
    inputFile.writeFileSync("select 1");

    return utils.formatterPromise(["--inputFile", inputFile.path], "select 2")
      .then(outStuff => {
        assert.isAtLeast(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1\n");
        inputFile.unlinkSync();
      })
      .catch(err => {
        inputFile.unlinkSync();
        throw err;
      });
  });

  it('Invalid file output (short) fails with exit code > 2', () => {
    var lostDir = new temp.Dir();
    return utils.formatterPromise(["-g", lostDir.path + "/somewherecrazy/file.txt"], "select 1")
      .then(outStuff => {
        assert.isAtLeast(outStuff.exitCode, 3);
        assert.notExists(outStuff.stdout);
      })
      .catch(err => {
        lostDir.rmdirSync();
        throw err;
      });
  });

  it('File output (long) succeeds', () => {
    var lostDir = new temp.Dir();
    return utils.formatterPromise(["--outputFile", lostDir.path + "/SomeTestFile.txt"], "select 1")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notExists(outStuff.stdout);
        var resultText = fs.readFileSync(lostDir.path + "/SomeTestFile.txt");
        assert.equal(resultText, "SELECT 1\n");
      })
      .catch(err => {
        lostDir.rmdirSync();
        throw err;
      });
  });

  it('File output doesn\'t happen if there is a problem with the SQL', () => {
    var lostDir = new temp.Dir();
    return utils.formatterPromise(["--outputFile", lostDir.path + "/SomeTestFile.txt"], "if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 2);
        assert.notExists(outStuff.stdout);
        var fileExists;
        try {
          fs.statSync(lostDir.path + "/SomeTestFile.txt");
          fileExists = true;
        } catch (err) {
          if (err && err.code === 'ENOENT')
            fileExists = false;
          else
            throw err;
        }
        assert.equal(fileExists, false);
      })
      .catch(err => {
        lostDir.rmdirSync();
        throw err;
      });
  });

  it('Indent parameter works (short)', () => {
    return utils.formatterPromise(["-d", "  "], "select 1, 2, 3")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1,\n  2,\n  3\n");
      });
  });

  it('Indent parameter works (long)', () => {
    return utils.formatterPromise(["--indent", "\t\t"], "select 1, 2, 3")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1,\n\t\t2,\n\t\t3\n");
      });
  });

  it('Max width works (short), and no-expandCommaLists', () => {
    return utils.formatterPromise(["-Cm", "9"], "select 1, 2, 3, 4, 5, 6")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1, 2\n\t, 3, 4, \n\t5, 6\n");
      });
  });

  it('Max width works (long) and spacesPerTab also', () => {
    return utils.formatterPromise(["--maxLineWidth", "9", "--no-expandCommaLists", "-s", "2"], "select 1, 2, 3, 4, 5, 6")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1, 2\n\t, 3, 4, 5, \n\t6\n");
      });
  });

  it('spacesPerTab (long) works and clauseBreaks (long) also', () => {
    return utils.formatterPromise(["--spacesPerTab", "1", "--clauseBreaks", "2"], "select 1, 2, 3 from a ")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1,\n\t2,\n\t3\n\nFROM a\n\n");
      });
  });

  it('clauseBreaks (short) and statementbreaks (short) work', () => {
    return utils.formatterPromise(["-l", "2", "-b", "1"], "select 1, 2, 3 from a select 1")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1,\n\t2,\n\t3\n\nFROM a\nSELECT 1\n\n");
      });
  });

  it('statementbreaks (long) and no-trailingCommas (long) work', () => {
    return utils.formatterPromise(["--statementBreaks", "1", "--no-trailingCommas"], "select 1, 2, 3 from a select 1")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1\n\t,2\n\t,3\nFROM a\nSELECT 1\n");
      });
  });

  it('no-trailingCommas (short) works and spaceAfterExpandedComma works', () => {
    return utils.formatterPromise(["-T", "--spaceAfterExpandedComma"], "select 1, 2, 3")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT 1\n\t, 2\n\t, 3\n");
      });
  });

  it('no-expandBooleanExpressions, no-expandCaseStatements and no-expandBetweenConditions (short) all work', () => {
    return utils.formatterPromise(["-OAW"], "select (1 and 2), (case 3 when 2 then 4 END), (between 1 and 2)")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT (1 AND 2),\n\t(CASE 3 WHEN 2 THEN 4 END),\n\t(BETWEEN 1 AND 2)\n");
      });
  });

  it('no-expandBooleanExpressions (long) and expandInLists (short) work', () => {
    return utils.formatterPromise(["--no-expandBooleanExpressions", "-i"], "select (1 and 2), (1 in (3, 4))")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT (1 AND 2),\n\t(\n\t\t1 IN (\n\t\t\t3,\n\t\t\t4\n\t\t\t)\n\t\t)\n");
      });
  });

  it('no-expandCaseStatements (long) and expandInLists (long) work', () => {
    return utils.formatterPromise(["--no-expandCaseStatements", "--expandInLists"], "select (CASE 1 WHEN 2 THEN 3 END), (1 in (3, 4))")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT (CASE 1 WHEN 2 THEN 3 END),\n\t(\n\t\t1 IN (\n\t\t\t3,\n\t\t\t4\n\t\t\t)\n\t\t)\n");
      });
  });

  it('no-expandBetweenConditions (long) and breakJoinOnSections (short) work', () => {
    return utils.formatterPromise(["--no-expandBetweenConditions", "-j"], "select (1 BETWEEN 2 AND 3) from a join b on (c)")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT (1 BETWEEN 2 AND 3)\nFROM a\nJOIN b\n\tON (c)\n");
      });
  });

  it('breakJoinOnSections (long) and no-uppercaseKeywords (short) work', () => {
    return utils.formatterPromise(["--breakJoinOnSections", "-U"], "select 1 FROM a join b on (c)")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "select 1\nfrom a\njoin b\n\ton (c)\n");
      });
  });

  it('no-uppercaseKeywords (long) and keywordStandardization work', () => {
    return utils.formatterPromise(["--no-uppercaseKeywords", "--keywordStandardization"], "select 1 FROM a join b on (c)")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "select 1\nfrom a\ninner join b on (c)\n");
      });
  });

  it('min command works', () => {
    return utils.formatterPromise(["min"], "select 1 from 2")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "select 1from 2");
      });
  });

  it('obfuscation Command works, and so does randomizeKeywordCase', () => {
    return utils.formatterPromise(["obfuscation", "--randomizeKeywordCase"], "select 1 from 2 where 3 and 4select 1 from 2 where 3 and 4select 1 from 2 where 3 and 4")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        var lowercaseOutcome = "select 1from 2where 3and 4select 1from 2where 3and 4select 1from 2where 3and 4";
        assert.equal(outStuff.stdout.toLowerCase(), lowercaseOutcome);
        assert.notEqual(outStuff.stdout, lowercaseOutcome);
        assert.notEqual(outStuff.stdout, lowercaseOutcome.toUpperCase());
      });
  });

  it('randomizeLineLengths works', () => {
    return utils.formatterPromise(["min", "--randomizeLineLengths"], "select 1 from 2 where 3 and 4\nselect 1 from 2 where 3 and 4\nselect 1 from 2 where 3 and 4\nselect 1 from 2 where 3 and 4")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        var standardOutcome = "select 1from 2where 3and 4select 1from 2where 3and 4select 1from 2where 3and 4select 1from 2\nwhere 3and 4";
        var lineRegex = new RegExp("\n", 'g')
        assert.equal(outStuff.stdout.replace(lineRegex, ""), standardOutcome.replace(lineRegex, ""));
        assert.notEqual(outStuff.stdout, standardOutcome);
      });
  });

  it('no-preserveComments works', () => {
    return utils.formatterPromise(["min", "--no-preserveComments"], "//hi\nselect 1\n--there")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "select 1");
      });
  });

  //KINDA works... it's supposed to use the less common forms, like LEFT OUTER JOIN in this case...
  // -> but that's an upstream library issue, not a command-line tool issue as such.
  it('enableKeywordSubstitution works', () => {
    return utils.formatterPromise(["min", "--enableKeywordSubstitution"], "//hi\nselect 1 from 2 left join 3 on (4)")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "//hi\nselect 1from 2LEFT JOIN 3on(4)");
      });
  });

  it('errorOutputPrefix short', () => {
    return utils.formatterPromise(["min", "-p", "HAHA ERROR"], "if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 2);
        assert.equal(outStuff.stdout, "HAHA ERRORif");
      });
  });

  it('errorOutputPrefix long', () => {
    return utils.formatterPromise(["--errorOutputPrefix", "HAHA ERROR"], "if")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 2);
        assert.equal(outStuff.stdout, "HAHA ERRORIF \n");
      });
  });

  it('pass in content in the wrong encoding, get nonsense back', () => {
    return utils.formatterPromise([], "select", 'utf-16le')
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notEqual(outStuff.stdout, "SELECT\n");
      });
  });

  it('expect some other encoding, be disappointed', () => {
    return utils.formatterPromise([], "select", 'utf-8', 'utf-16le')
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.notEqual(outStuff.stdout, "SELECT\n");
      });
  });

  it('actually warn the app about input encoding, and be pleased', () => {
    return utils.formatterPromise(["--inputEncoding", "utf-16le"], "select", 'utf-16le')
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT\n");
      });
  });

  it('Request an output encoding, and be indulged', () => {
    return utils.formatterPromise(["--outputEncoding", "utf-16le"], "select", 'utf-8', 'utf-16le')
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "SELECT\n");
      });
  });

  it('Request a BOM, and be indulged', () => {
    return utils.formatterPromise(["--forceOutputBOM"], "select")
      .then(outStuff => {
        assert.equal(outStuff.exitCode, 0);
        assert.equal(outStuff.stdout, "\ufeffSELECT\n");
      });
  });
});

