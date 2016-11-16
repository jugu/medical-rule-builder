/**
 * @author Jugu Dannie Sundar <jugu [dot] 87 [at] gmail [dot] com>
 */

var parse = function (tokens) {
	var symbols = {},
	symbol = function (id, nud, lbp, led) {
		var sym = symbols[id] || {};
		symbols[id] = {
			lbp: sym.lbp || lbp,
			nud: sym.nud || nud,
			led: sym.lef || led
		};
	};

	var interpretToken = function (token) {   
		var sym = Object.create(symbols[token.type]);
		sym.type = token.type;
		sym.value = token.value;
		return sym;
	};

	var i = 0, token = function () { return interpretToken(tokens[i]); };
	var advance = function () { i++; return token(); };

	var expression = function (rbp) {
		var left, t = token();
		advance();
		if (!t.nud) throw "Unexpected token: " + t.type;
		left = t.nud(t);		
        while (rbp < token().lbp) {
			t = token();
			advance();
			if (!t.led) throw "Unexpected token: " + t.type;            
			left = t.led(left);
            if (t.type == '||') {
                left.value = t.value;
            }
		}
        if (t.type == '||') {
            left.value = t.value;
        }
		return left;
	};

	var infix = function (id, lbp, rbp, led) {
		rbp = rbp || lbp;
		symbol(id, null, lbp, led || function (left) {     
			return {
				type: id,
				left: left,
				right: expression(rbp)
			};
		});
	},
	prefix = function (id, rbp) {
		symbol(id, function () {
			return {
				type: id,
				right: expression(rbp)
			};
		});
	},
    nofix = function (id, lbp, rbp, led) {
		rbp = rbp || lbp;
		symbol(id, null, lbp, led || function (left) {
			return {
				type: id,
				left: left
			};
		});
	};


	symbol(",");
	symbol(")");
	symbol("(end)");
    
    symbol("constant", function (constant) {
       return constant; 
    });

	symbol("number", function (number) {
		return number;
	});
	symbol("identifier", function (name) {
		if (token().type === "(") {
			var args = [];
			if (tokens[i + 1].type === ")") advance();
			else {
				do {
					advance();
					args.push(expression(2));
				} while (token().type === ",");
				if (token().type !== ")") throw "Expected closing parenthesis ')'";
			}
			advance();
			return {
				type: "call",
				args: args,
				name: name.value
			};
		}
		return name;
	});

	symbol("(", function () {
		value = expression(2);
        value.group = 'true';
		if (token().type !== ")") throw "Expected closing parenthesis ')'";
		advance();
		return value;
	});
        
	prefix("-", 8);    
	infix("^", 7, 7);
	infix("*", 6);
	infix("/", 6);
	infix("%", 6);
	infix("+", 5);
	infix("-", 5);
    infix(">", 4);
    infix("<", 4);
    infix("<=", 4);
    infix(">=", 4);
    infix("==", 4);
    infix("!=", 4);
    nofix("!=-1", 4);
    nofix("==-1", 4);
    infix("&&", 3);
    infix("||", 3);

	infix("=", 1, 2, function (left) {
		if (left.type === "call") {
			for (var i = 0; i < left.args.length; i++) {
				if (left.args[i].type !== "identifier") throw "Invalid argument name";
			}
			return {
				type: "function",
				name: left.name,
				args: left.args,
				value: expression(2)
			};
		} else if (left.type === "identifier") {
			return {
				type: "assign",
				name: left.value,
				value: expression(2)
			};
		}
		else throw "Invalid lvalue";
	});

	var parseTree = [];
	while (token().type !== "(end)") {
		parseTree.push(expression(0));
	}
	return parseTree;
};