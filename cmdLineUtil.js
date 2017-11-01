const sqlFormatterLib = require('poor-mans-t-sql-formatter');
const fosi = require('file-or-stdin');
const fs = require('fs')

//A few significant differences from Library to CLI tool:
// - Need abbreviations for the options (well, not "need", but convenient)
// - Boolean options MUST default to negative - so to keep sane/consistent defaults, the option names need to be flipped
// - We're only going to support text output (not HTML, parse trees etc) at least initially
// - We're not going to treat "formatting type" as an option, we're going to consider these as different git-style sub-commands
// -> Because of this need to "sanity check" options, we're going to use a whitelist approach
const optionMap = {
  indent:                    {abbrev: 'd' },
  spacesPerTab:              {abbrev: 's' },
  maxLineWidth:              {abbrev: 'm' },
  statementBreaks:           {abbrev: 'b' },
  clauseBreaks:              {abbrev: 'l' },
  expandCommaLists:          {abbrev: 'c' },
  trailingCommas:            {abbrev: 't' },
  spaceAfterExpandedComma:   {},
  expandBooleanExpressions:  {abbrev: 'o' },
  expandCaseStatements:      {abbrev: 'a' },
  expandBetweenConditions:   {abbrev: 'w' },
  expandInLists:             {abbrev: 'i' },
  breakJoinOnSections:       {abbrev: 'j' },
  uppercaseKeywords:         {abbrev: 'u' },
  keywordStandardization:    {},

  randomizeKeywordCase:      {},
  randomizeLineLengths:      {},
  preserveComments:          {},
  enableKeywordSubstitution: {},
  errorOutputPrefix:         {abbrev: 'p'}
  
  };

//perform contortions to map options into "Commander"'s format.
// NOTE: despite complexity, the support for '--no-' options is very helpful...
// (and so is the auto-generated help with subcommand support)
function mapOption(optionName, target) {
  var flipBool = sqlFormatterLib.optionReference[optionName].type == 'bool' && sqlFormatterLib.optionReference[optionName].default;
  target.option(
    (optionMap[optionName].abbrev ? "-" + (flipBool ? optionMap[optionName].abbrev.toUpperCase() : optionMap[optionName].abbrev) + ", " : "") +
	"--" + (flipBool ? "no-" : "") + optionName +
    (sqlFormatterLib.optionReference[optionName].type == 'int' ? " <n>" : "") +
    (sqlFormatterLib.optionReference[optionName].type == 'string' ? " <value>" : "") + 
    (sqlFormatterLib.optionReference[optionName].type == 'enum' ? " <value>" : "")
    , sqlFormatterLib.optionReference[optionName].description +
    (sqlFormatterLib.optionReference[optionName].default && sqlFormatterLib.optionReference[optionName].type != 'bool' ? " [" + sqlFormatterLib.optionReference[optionName].default + "]" : "")
    );
}

function mapOptions(formattingType, target) {
  for (var optionName in sqlFormatterLib.optionReference) {
    if (optionMap[optionName]
      && sqlFormatterLib.optionReference[optionName].appliesToFormattingType
      && sqlFormatterLib.optionReference[optionName].appliesToFormattingType.indexOf(formattingType) >= 0
      )
      mapOption(optionName, target);
  }
}

function runCmdLineUtil(args, stdin, stdout) {

  //get a fresh Commander instance
  var commander = require('commander');
  
  //set up program
  const pckgJson = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));
  commander.version(pckgJson.version);
  commander.description(pckgJson.description);

  commander.option("-e, --ignoreErrors", "Return 0 (success) exit code even if parsing failed (and so the formatted output is suspect)");
  commander.option("--encoding", "Use a specific character encoding [utf-8]");
  mapOption('errorOutputPrefix', commander);
  
  //set up default options (for standard formatting)
  commander.allowUnknownOption(false);
  mapOptions('standard', commander);
  
  //set up obfuscation options
  var obfuscationSelected = false;
  var obfuscCommand = commander.command('obfuscation')
  obfuscCommand.description('Format your SQL to make it LESS legible instead of more... Typically used for minifying.');
  obfuscCommand.alias('min');
  obfuscCommand.allowUnknownOption(false);
  mapOptions('obfuscation', obfuscCommand);
  obfuscCommand.action(function(){obfuscationSelected = true;});
  
  //actually parse/process the options with the passed-in args - regardless of whether those are really from the command-line, or from test
  // WARNING: even though the intent was to make this code testable in-process, commander actually messes with process stuff - so we now use "spawn" for testing.
  commander.parse(args);
  
  //TEST: dump obfuscation options
  //if (obfuscationSelected) {
  //  console.log("dumping all option names on 'obfuscCommand'");
  //  for (var optionName in sqlFormatterLib.optionReference) {
  //    console.log(optionName + ": " + obfuscCommand[optionName]);
  //  }
  //  console.log("dumping args: " + obfuscCommand['args']);
  //}
  
  //TEST: dump regular options
  //console.log("dumping all option names on 'Commander'");
  //for (var optionName in sqlFormatterLib.optionReference) {
  //  console.log(optionName + ": " + commander[optionName]);
  //}
  //console.log("dumping args: " + commander['args'][0] + ", and then ");
  //console.log(commander['args'][1]);

  var filename = commander.args[0];
  var encoding = commander.encoding || 'utf-8';
  
  //Actually format! (return promise for error-handling / testing)
  return fosi(filename, encoding).then(function(inputSql){
    var libResult = sqlFormatterLib.formatSql(inputSql);

    var cmdResult = {exitCode: 0, stdout: libResult.text };

    if (!commander.ignoreErrors && libResult.errorFound) {
      cmdResult.exitCode = 1;
      cmdResult.stderr = (cmdResult.stderr || "") + "Parsing errors found. Result may be unsafely / unexpectedly modified.";
    }

    return cmdResult;
  });
};

module.exports = runCmdLineUtil;
