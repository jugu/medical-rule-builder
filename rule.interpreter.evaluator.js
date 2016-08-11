/**
 * @author Jugu Dannie Sundar <jugu [dot] 87 [at] gmail [dot] com>
 */
var evaluate = function (parseTree, vars) {

	var operators = {
        "||": function (a, b) { return a || b},
        "&&": function (a, b) { return a && b},
        ">": function (a, b) { return a > b},
        "<": function (a, b) { return a < b},
        ">=": function (a, b) { return a >= b},
        "<=": function (a, b) { return a <= b},
        "==": function (a, b) { return a == b},
        "==-1": function (a) { return a == -1},
        "!=-1": function (a) { return a != -1},
		"+": function (a, b) { return a + b; },
		"-": function (a, b) {
			if (typeof b === "undefined") return -a;
			return a - b;
		},
		"*": function (a, b) { return a * b; },
		"/": function (a, b) { return a / b; },
		"%": function (a, b) { return a % b; },
		"^": function (a, b) { return Math.pow(a, b); }
	};

	
    function extend(target) {
        var sources = [].slice.call(arguments, 1);
        sources.forEach(function (source) {
            for (var prop in source) {
                target[prop] = source[prop];
            }
        });
        return target;
    }    
    
    var variables = extend({},vars,{pi: Math.PI,e: Math.E});

	var functions = {
		sin: Math.sin,
		cos: Math.cos,
		tan: Math.cos,
		asin: Math.asin,
		acos: Math.acos,
		atan: Math.atan,
		abs: Math.abs,
		round: Math.round,
		ceil: Math.ceil,
		floor: Math.floor,
		log: Math.log,
		exp: Math.exp,
		sqrt: Math.sqrt,
		max: Math.max,
		min: Math.min,
		random: Math.random
	};
	var args = {
	};

	var parseNode = function (node) {
        if (!node) {
            return null;
        }
		if (operators[node.type]) {
			if (node.left) return operators[node.type](parseNode(node.left), parseNode(node.right));
			return operators[node.type](parseNode(node.right));
		}
		else if (node.type === "identifier") {
			var value = args.hasOwnProperty(node.value) ? args[node.value] : variables[node.value];
			if (typeof value === "undefined") throw node.value + " is undefined";
			return value;
		}
        else if (node.type === "number") {
            return node.value;
        }
		else if (node.type === "assign") {
			variables[node.name] = parseNode(node.value);
		}
		else if (node.type === "call") {
			for (var i = 0; i < node.args.length; i++) node.args[i] = parseNode(node.args[i]);
			return functions[node.name].apply(null, node.args);
		}
		else if (node.type === "function") {
			functions[node.name] = function () {
				for (var i = 0; i < node.args.length; i++) {
					args[node.args[i].value] = arguments[i];
				}
				var ret = parseNode(node.value);
				args = {};
				return ret;
			};
		}
	};

    var output = false;
	for (var i = 0; i < parseTree.length; i++) {
		var value = parseNode(parseTree[i]);
		if (typeof value !== "undefined") output = value;
	}
	return output;
	/*var output = "";
	for (var i = 0; i < parseTree.length; i++) {
		var value = parseNode(parseTree[i]);
		if (typeof value !== "undefined") output += value + "\n";
	}
	return output;*/
};