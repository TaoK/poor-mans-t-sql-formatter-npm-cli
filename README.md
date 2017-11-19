# Poor Man's T-SQL Formatter - node command-line formatter

A command-line SQL formatter that runs in pretty much any environment (as long as node.js is installed).

It is based on the Poor Man's T-SQL Formatter NPM package (poor-mans-t-sql-formatter), which in turn is based 
on the C# library of the same name ( https://github.com/TaoK/PoorMansTSqlFormatter ).

This formatter should be equivalent in functionality to the C# command-line formatter that's existed for a few years 
(downloadable at http://architectshack.com/PoorMansTSqlFormatter.ashx), with two major differences:

* It's super easy to install, especially in unixey environments - as long as Node.js is available
* It's quite a bit slower than the .Net-based formatter.

## Installation

(assuming node.js is installed)

```
npm install --global poor-mans-t-sql-formatter-cli
```

## Usage

piped/stdin input & stdout output:

```
echo "select a from b join c on b.id = c.id where abc = 123 and def = N'whatêver' " | sqlformat
```

file input & output:

```
echo "with a as (select 1 as b) select * from a cros join c" > testfile.sql
sqlformat -f testfile.sql -g testfile.sql
cat testfile.sql
```

### Options

This command-line formatter will exit with a non-0 exit code if the SQL parsing "gets in trouble" - for example if it encounters 
an unfinished "IF" statement, suggesting that something about the SQL was not correctly understood/parsed, and may therefore "come 
out wrong". There's an option to disable this behavior if the SQL is known to be shady, or the parsing confusion is known to be 
innocuous.

If the parsing is aborted, any specified "output file" will be left untouched.

Command-line-utility-specific options:

| Option           | Description                                                                                                        | Type   | Default |
| ---              | ---                                                                                                                | ---    | ---     |
| --inputFile      | Read input to be formatted from a file rather than stdin (typed or piped input)                                    | string |         |
| --outputFile     | Write formatted output to a file - like shell redirection of stdout, except on error it leaves the file untouched  | string |         |
| --ignoreErrors   | Return 0 (success) exit code even if parsing failed (and so the formatted output is suspect)                       | bool   |         |
| --inputEncoding  | Use a specific character encoding supported by node for input - basically utf-16le or utf-8                        | string | utf-8   |
| --outputEncoding | Use a specific character encoding supported by node for output - basically utf-16le or utf-8                       | string | utf-8   |
| --forceOutputBOM | Add a byte order mark (BOM) to the start of the output                                                             | bool   |         |

Standard formatter options:

(please note, boolean options that normally default to "true" in the library have been flipped with a "no" prefix, 
following unixey command-line parameter conventions)

| Option                        | Description                                                                              | Type   | Default    |
| ---                           | ---                                                                                      | ---    | ---        |
| --indent                      | The unit of indentation - typically a tab (\t) or a number of spaces                     | string | \t         |
| --maxLineWidth                | Request that the formatter wrap long lines to avoid exceeding this line length           | int    | 999        |
| --spacesPerTab                | This is used to measure line length, and only applies if you use tabs                    | int    | 4          |
| --statementBreaks             | How many linebreaks should be added when starting a new statement?                       | int    | 2          |
| --clauseBreaks                | How many linebreaks should be added when starting a new clause within a statement?       | int    | 1          |
| --no-expandCommaLists         | Should comma-delimited lists (columns, group by args, etc) be broken out onto new lines? | bool   |            |
| --no-trailingCommas           | When starting a new line because of a comma, should the comma be at the end of line (VS the start of the next)? | bool   |            |
| --spaceAfterExpandedComma     | Should a space be added after the comma? (typically not if they are "trailing")          | bool   |            |
| --no-expandBooleanExpressions | Should boolean operators (AND, OR) cause a linebreak?                                    | bool   |            |
| --no-expandCaseStatements     | Should CASE expressions have their WHEN and THEN expressions be broken out on new lines? | bool   |            |
| --no-expandBetweenConditions  | Should BETWEEN expressions have the max argument broken out on a new line?               | bool   |            |
| --expandInLists               | Should IN() lists have each argument on a new line?                                      | bool   |            |
| --breakJoinOnSections         | Should the ON section of a JOIN clause be broken out onto its own line?                  | bool   |            |
| --no-uppercaseKeywords        | Should T-SQL keywords (like SELECT, FROM) be automatically uppercased?                   | bool   |            |
| --keywordStandardization      | Should less-common T-SQL keywords be replaced with their standard counterparts? (NOTE: only safe for T-SQL!) | bool   |            |

Obfuscating formatter ("min" command) options:

| Option                      | Description                                                                              | Type   | Default    |
| ---                         | ---                                                                                      | ---    | ---        |
| --randomizeKeywordCase      | Should the case of keywords be randomized, to minimize legibility?                       | bool   |            |
| --randomizeLineLengths      | Should the SQL be wrapped at arbitrary intervals, to minimize legibility?                | bool   |            |
| --no-preserveComments       | Should comments in the code be retained (vs being stripped out)?                         | bool   |            |
| --enableKeywordSubstitution | Should keywords with synonyms use less common forms? (NOTE: only safe for T-SQL!)        | bool   |            |


## Features

Please note, this command-line tool does NOT currently produce HTML (syntax-highlighted) output. This would be 
a reasonably trivial feature to add, it is definitely supported by the underlying library, but I haven't seen any
realistic use-case. If you have one, please let me know (and/or fork, add the option(s), let me know).

This formatter effectively "inherits" all the functionality of the Poor Man's T-SQL Formatter library:

* Full support for MS SQL Server T-SQL, with (as far as I know) no parsing failures
** Including full procedural/batch code support, DDL, DML, etc.
* Reasonable support for other SQL dialects (regularly used to format PL/SQL, PostgreSql, MySQL, etc queries)
** Specific constructs may not work or may not be correctly/faithfully preserved for those other dialects - please file issues when such concerns are identified
* A reasonable number of formatting configuration options, with more on the way.

## Status

As noted in the JS library package doc (https://github.com/TaoK/poor-mans-t-sql-formatter-npm-package), this 
formatter is rather **slow** at the moment. On my laptop, formatting just a single query takes about half a 
second. That suggests that for bulk formatting workloads, it it might make sense to offer a wildcard/recursive 
file input/output option.

The encoding support is also very limited - as we use node's built-in encoding support, it comes down to utf-8 or 
utf-16le. It might be worth addressing this with the iconv-lite library, but adding even more code to load 
would also have its downsides. Something to think about.

Besides these things I'm not aware of any major outstanding concerns (vs for example the C# / .Net version 
of this same command-line formatter downloadable at http://architectshack.com/PoorMansTSqlFormatter.ashx),
so any input / feature requests are welcome!

