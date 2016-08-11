/**
 * @author Jugu Dannie Sundar <jugu [dot] 87 [at] gmail [dot] com>
 */

function parseRule(rule, variables)
{        
    var tokens = lexer(rule);
    //console.log(tokens);
    var parseTree = parse(tokens);
    //console.log(parseTree);
    var output = evaluate(parseTree, variables);
    return output;
}

var processRules = function(ruleJSON, variables){
    var result = [];    
    for(var i = 0; i < ruleJSON.length; i++) {
        var obj = ruleJSON[i];     
        var key = Object.keys(obj)[0];
        result[key] = {}
        var value = obj[key];
        if (typeof(value) == 'object')
        {
            for (var j = 0; j < value.length; j++)
            {
                var valObj = value[j];
                var valKey = Object.keys(valObj)[0];
                var valRule = valObj[valKey]; 
                var comorbidityPresent = parseRule(valRule, variables);
                result[key][valKey] = comorbidityPresent;
            }
        }
        else
        {                     
            result[key] = parseRule(value, variables);
        }    
    }
    return result;    
}