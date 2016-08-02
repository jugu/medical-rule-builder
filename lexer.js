//var exports = module.exports = {}

var lexer = function (input) {
    var operator_tokens = [];
    var t_LT = /</; operator_tokens.push(t_LT);
    var t_LTE = /<=/; operator_tokens.push(t_LTE);
    var t_GT = />/; operator_tokens.push(t_GT);
    var t_GTE = />=/; operator_tokens.push(t_GTE);
    var t_EQ = /==/; operator_tokens.push(t_EQ);
    var t_AND = /&&/; operator_tokens.push(t_AND);
    var t_OR = /\|\|/; operator_tokens.push(t_OR);
    var t_LBRACE = /\(/; operator_tokens.push(t_LBRACE);
    var t_RBRACE = /\)/; operator_tokens.push(t_RBRACE);
    var t_PLUS = /\+$/; operator_tokens.push(t_PLUS);
    var t_MINUS = /\-$/; operator_tokens.push(t_MINUS);
    var t_DIV = /\//; operator_tokens.push(t_DIV);
    var t_MUL = /\*/; operator_tokens.push(t_MUL);
        
    
    var t_ID = /^[a-zA-Z]\w*$/;
    var t_NUM = /^-?\d*(\.\d+)?$/;
    var t_RULE = /^[a-zA-Z]\w+#(\w+)?:$/
    
    var isOperator = function (str) {
        var found = false;
        operator_tokens.forEach(function(operator){
            if (operator.test(str))
            {
                found =  true;
                return;
            }
        });
        return found;
    }
    
    var isNumber = function (str) {
        return t_NUM.test(str);
    }
    
    var isRule = function (str) {
        return t_RULE.test(str);
    }
    
    var isIdentifier = function (str) {
        return t_ID.test(str);
    }
    var wordArr = input.replace(/^\s+|\s+$/gm,"").split(" ");
    var tokens = [];
    
    var addToken = function (type, value) {
		tokens.push({
			type: type,
			value: value
		});
	};
    
    wordArr.forEach(function (word){
        if (isOperator(word)) {
			addToken(word);
        }
        else if (isNumber(word)) {
            var num = parseFloat(word);
            addToken("number", num);
        }
        else if (isIdentifier(word)) {
            addToken("identifier", word);
        }
        else if (isRule(word)){
            addToken("rule", word);
        }
        else
            throw "unrecognized token"
    });
	addToken("(end)");
	return tokens;
};
