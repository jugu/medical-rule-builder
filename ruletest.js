var express = require("express");
var app = express();
app.use(express.static("./")).listen(3000);
module.exports = app;

//var lexer = require('./lexer.js');
//var parser = require('./parser.js');
//var rule = `Anemia#Normal: ( ( a > b ) && ( c > d ) )`;

/*var rule = `Anemia--
	Normal:
		((MinHb > lowHb) && (MinHc > lowHc))$$
	Acute:
		(((MinHb < lowHb) || (MinHc < lowHc)) && ((prevMinHb > lowHb) && (prevMinHc > lowHc)))$$
	Anemic:
		(((MinHb < lowHb) || (MinHc < lowHc)) &&((prevMinHb == -1) && (prevMinHc == -1)))$$
	Chronic:
		(((MinHb < lowHb) || (MinHc < lowHc)) &&((prevMinHb < lowHb) || (prevMinHc < lowHc)))$$++`;
*/
/*
1:[MinHb > lowHb, MinHc > lowHc]
0:[(MinHb > lowHb && MinHc > lowHc)]

2:[MinHb < lowHb, MinHc < lowHc, prevMinHb > lowHb, prevMinHc > lowHc]
1:[MinHb < lowHb || MinHc < lowHc, prevMinHb > lowHb && prevMinHc > lowHc]
0:[(minHb < lowHb || MinHc < lowHc) && (prevMinHb > lowHb && prevMinHc > lowHc)]
*/

/*var conditionMap = {};
var conditionList = [];
var cachedMap = {};
conditionMap[0] = eval("MinHb > lowHb");
conditionMap[1] = eval("MinHc > lowHc");
conditionMap[2] = conditionMap[0] && conditionMap[2];

function parseRule(allrules)
{	
	var rulesArr = allrules.split("++");
	var conditions = [];
	var ruleMap = {};
	rulesArr.forEach(function (ruleString, index){
		if (index == rulesArr.length - 1)
			return;
		var ruleArr = ruleString.split("--");
		var ruleHead = ruleArr[0];
		var ruleDef = ruleArr[1];
		var ruleDefArr = ruleDef.split("$$");
		ruleDefArr.forEach(function (ruleCategory, catIndex) {
			if (catIndex == ruleDefArr.length - 1)
				return;
			var categoryArr = ruleCategory.split(":");
			var category = categoryArr[0];
			var categoryRule = categoryArr[1];						
			conditions.push(categoryRule.trim());					
			//console.log(result);
		});		
	});
    
    conditions.forEach(parseCondition);
	//console.log(conditions);
}

function parseCondition(condition)
{
    var varcond = "";    
    var tempcond = "";
    var level = 0;
    var condMap = {};
    var maxLevel = 0;    
    for (var i = 0; i < condition.length; i++)
    {   
        varcond += condition[i];
        if (condition[i] == '(')
        {   
            level++;
            if (!condMap.hasOwnProperty(level))
                condMap[level] = [];                        
            maxLevel++;            
            tempcond = "";
        }
        else if (condition[i] == ')')
        {            
            condMap[level].push(varcond);
            level--;            
            varcond = "";
        }                
    }
    console.log(condMap)
}


var minHb = 50;
var minHc = 40;
var prevMinHb = -1;
var prevMinHc = -1;
var lowHb = 13.5;
var lowHc = 40;
for ()
console.log(eval("minHb < minHc"))
//parseRule(rule);*/