# taint-analysis.js

Taint analysis is a method of automated static analysis that detects
user-controlled values (i.e. "sources") and traces their execution to
potentially dangerous function calls (i.e. "sinks"). It likely does not work
out the box because I initially wrote it to be tailored to a particular API
(and I removed that information which is important).

`taint-analysis.js` also does variable scope bookkeeping to reduce false
positives.

# usage

`npm install esprima`

`npm install estraverse`

`node taint-analysis.js sample.js`
