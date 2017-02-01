var esprima = require('esprima');
var estraverse = require('estraverse');
var fs = require('fs');

//Get the filename from command line arguments
var filename = process.argv[2];
var program = fs.readFileSync(filename);
var lines = program.toString().split("\n"); //Used to extract lines from the source.
var ast = esprima.parse(program, {loc: true, tolerant: true});

//Some helper variables to maintain state.
var sources = [];
var scopeChain = [];
var currentScope;

//pretty print the affected line of source code.
function printSource(node) { console.log(filename + ":" + node.loc.start.line + " - " + lines[node.loc.start.line-1].replace(/^\s+|\s+$/g, '')) }

//createsNewScope will return bool based on whether the node creates a new
//variable scope
function createsNewScope(node){
	  return node.type === 'FunctionDeclaration' ||
		    node.type === 'FunctionExpression' ||
		    node.type === 'Program';
}

//isParameterSource will return a bool based on whether the node is setting a
//variable to a user-controlled value (e.g. through `XXX`)
function isParameterSource(node) {
	if (node.init !== null && node.init.type === "CallExpression") {
		if (node.init.callee.type === "MemberExpression") {
			if (node.init.callee.property.name === "XXX") {
				if (node.init.arguments.length != 0) {
					varname = node.id.name
					arg = node.init.arguments[0]
					if (typeof arg.value !== "undefined" && arg.value.search("Dangerous Input in Argument") != -1) {
						return varname
					}
				}
			}
		}
	}
	return ""
}

//isDangerousMethod will return true if a user-controlled source variable is
//used in a DangerouMethod.
function isDangerousSink(node) {
	if (node.init !== null && node.init.type === "NewExpression") {
		var initl = node.init
		if (initl.callee.name === "DangerousMethod") {
            //obvi arg length can be changed
			if (typeof initl.arguments !== "undefined" && initl.arguments.length == 1) {
				var sink = initl.arguments[0].name
				for (s in currentScope) {
					sr = currentScope[s]
					if (sr === sink) {
						return true
					}
				}
			}
		}
	}
}


//checkAST traverses the AST and identifies user-controlled sources that are
//leveraged in potential dangerous sinks.
function checkAST(ast) {
	estraverse.traverse(ast, {
		enter: function(node) {

			if (createsNewScope(node)){
				scopeChain.push([]);
			}

			if (node.type === 'VariableDeclarator'){
				currentScope = scopeChain[scopeChain.length - 1];
				var name = isParameterSource(node);
				if (name !== "") {
					currentScope.push(name);
				}

				if (isDangerousMethod(node)) {
					printSource(node)
				}
			}
		},
		leave: function(node){
			if (createsNewScope(node)){
				currentScope = scopeChain.pop();
			}
		}
	});
}

//Check sources against sinks in the AST
checkAST(ast)
