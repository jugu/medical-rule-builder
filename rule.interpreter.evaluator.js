/**
 * @author Jugu Dannie Sundar <jugu [dot] 87 [at] gmail [dot] com>
 */
var evaluate = function (parseTree, vars, processedResult) {

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
    
    var variables = extend({},{pi: Math.PI,e: Math.E},vars);

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
		random: Math.random,
        bmi : function(obj) {
                if (obj.hasOwnProperty("height") && obj.hasOwnProperty("weight")) {
                    var height = obj["height"];
                    var weight = obj["weight"];
                    if (height > 0 && weight > 0)
                        return (weight)/((height/100)*(height/100));
                }
                return -1;
               }
	};    
    var checkInBuiltFn = function (keyToCheck) {
        if (functions.hasOwnProperty(keyToCheck))
            return true;
        return false;
    }    
	var args = {};
    // This function is used for cases where we are using a previously defined comorbidity condition as part of current condition. 
    // We check for the current condition argument in the list of previously defined comorbidity conditions (and its evaluated value)
    //  and then plug in the values of the result
    var checkValueAsPreviouslyDefinedRule = function (currentValue, oldResultObj) {
        var currvalArr = currentValue.split("_"); // 
        var currval = currvalArr.join(" ");
        if (oldResultObj.hasOwnProperty(currval)) {
            var resultVal = oldResultObj[currval];
            if (typeof(resultVal) == 'object') {
                for (var j = 0; j < resultVal.length; j++)
                {
                    var valObj = resultVal[j];
                    var valKey = Object.keys(valObj)[0];
                    var valRule = valObj[valKey]; 
                    if (valRule == true)
                        return 1; 
                }
                return -1;
            } 
            else {
                return (oldResultObj[currval] == true) ? 1 : -1;                
            }
        }
        else {
            for (key in oldResultObj) {
                if (oldResultObj[key].hasOwnProperty(currval)) {
                    if (oldResultObj[key][currval] === true) {
                        return 1;
                    }
                }
            }
            return -1;
        }
    }
    
    var levelToKMap= {};	
    var parseNode = function (node, anyKLevel, oldResults) {
        if (!node) {
            return null;
        }
		if (operators[node.type]) {
            //debugger;
            if (node.type == '||') {   
                if (anyKLevel == -1) {
                    anyKLevel = 0;
                }
                if (node.hasOwnProperty("group")) {
                    anyKLevel++;
                    levelToKMap[anyKLevel] = node.value;
                }
                if (!levelToKMap.hasOwnProperty(anyKLevel)) {
                    levelToKMap[anyKLevel] = node.value;
                }
            }
			if (node.right) {
                var leftval = parseNode(node.left, anyKLevel, oldResults);
                var rightval = parseNode(node.right, anyKLevel, oldResults);
                var outval = operators[node.type](leftval, rightval);
                if (node.type == '||') {
                    if (leftval)
                        levelToKMap[anyKLevel] = levelToKMap[anyKLevel] - 1;
                    if (rightval)
                        levelToKMap[anyKLevel] = levelToKMap[anyKLevel] - 1;
                    if (levelToKMap[anyKLevel] <= 0)
                        return true;
                    else
                        return false;
                }                
                return outval;
            }
			return operators[node.type](parseNode(node.left, anyKLevel, oldResults));
		}
		else if (node.type === "identifier") {            
			var value = args.hasOwnProperty(node.value) ? args[node.value] : variables[node.value];
            if (typeof value === "undefined") {
                if (checkInBuiltFn(node.value)) {
                    return functions[node.value](variables);
                }
                value = checkValueAsPreviouslyDefinedRule(node.value, oldResults);
            }
			if (typeof value === "undefined") throw node.value + " is undefined";
			return value;
		}
        else if (node.type === "constant") {
            return node.value;
        }
        else if (node.type === "number") {
            return node.value;
        }
		else if (node.type === "assign") {
			variables[node.name] = parseNode(node.value, anyKLevel, oldResults);
		}
		else if (node.type === "call") {
			for (var i = 0; i < node.args.length; i++) node.args[i] = parseNode(node.args[i], anyKLevel, oldResults);
			return functions[node.name].apply(null, node.args);
		}
		else if (node.type === "function") {
			functions[node.name] = function () {
				for (var i = 0; i < node.args.length; i++) {
					args[node.args[i].value] = arguments[i];
				}
				var ret = parseNode(node.value, anyKLevel, oldResults);
				args = {};
				return ret;
			};
		}
	};

    var output = false;
	for (var i = 0; i < parseTree.length; i++) {
		var value = parseNode(parseTree[i], -1, processedResult);
		if (typeof value !== "undefined") output = value;
	}
	return output;
};