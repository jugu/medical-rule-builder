var savedRules = [];
var globalSelectedRules = [];
function attachEventHandlesForTesting() {    
    $(".labvalueformdiv")
        .on("mouseover", "input", function() {
            $(this).parent().css({"background-color":"lightgrey"})})
        .on("mouseout", "input", function() {
            $(this).parent().css({"background-color":"white"}); 
            });
    
    $(".testtab").on("click" ,function() {
        $(".testrulesdiv").html("");
        $(".labvalueformdiv").html("");
        $(".testresultdiv").html("");        
        if (newSavedRules.length > 0) {  // newSavedRules and savedRulesJSON are declared/defined in rule.addedit.main.js
            for (var i = 0; i < newSavedRules.length; i++)
                savedRulesJSON.push(newSavedRules[i]);
            newSavedRules = [];
        }
        savedRules = savedRulesJSON;
        console.log("testtab", savedRulesJSON);
       $(".checkrule").first().prop("checked", "checked");
       populateTestRules(savedRules); // SavedRulesJSON object is created in rule.addedit.main.js 
    });
    
    $(".checkrule").first().click(function() {       
        if ($(this).prop("checked") === true) {
            $(".test .checkrule").not(":first").prop("checked", "checked");             
        }
        else {
            $(".test .checkrule").not(":first").prop("checked", "");   
        }
        loadCheckedRules();
    });
    
    $(".testrulesdiv").on("click", ".checkrule", function() {
        loadCheckedRules();
    });
    
    $(".executerules").on("click", function() {
       executeRules(); 
    });
    
    /*Realtime?*/
    $(".labvalueformdiv").on("change keyup","input", function() {
        executeRules();
    })
}

function executeRules()
{
    $(".testresultdiv").html("");
    $(".labformrow .nameerror").html("");
    var formObjArray = $(".labformrow");
    var variables = {};
    var doExecute = true;
    for (var i = 0; i < formObjArray.length; i++) {
        var key = $(formObjArray[i]).children("input").attr("id");
        var val = $(formObjArray[i]).children("input").val();
        if (val == '') {
            $(formObjArray[i]).children("span:last").html("Incorrect value");
            doExecute = false;
        }
        if (val == '')
            val = -1;
        variables[key] = val;
    }      
    if (!doExecute)
        return;
    var ruleJSON = globalSelectedRules;      
    var result = processRules(ruleJSON, variables);
    console.log(result);
    var htmlStr = "";
    htmlStr += "<ul>";
    var foundclass = "";
    for (var key in result)
    {
        if (!result.hasOwnProperty(key)) {
            continue;
        }
        if (typeof(result[key]) == 'object') {
            htmlStr += "<li>"+key+"</li><ul>";
            for (var inkey in result[key]) {
                if (!result[key].hasOwnProperty(inkey)) {
                    continue;
                }
                var foundclass = "style='color:black'";
                if (result[key][inkey]===true)
                    foundclass = "style='color:blue'";
                    htmlStr += "<li "+foundclass+">"+inkey+":"+result[key][inkey]+"</li>";
            }
            htmlStr += "</ul>";
        }
        else {
            var foundclass = "style='color:black'";
            if (result[key]===true)
                foundclass = "style='color:blue'";
            htmlStr += "<li "+foundclass+">"+key+":"+result[key]+"</li>"
        }
    }
    htmlStr += "</ul>";
    $(".testresultdiv").html(htmlStr);
}

function loadCheckedRules() {
    $(".labvalueformdiv").html("");
    $(".testresultdiv").html("");
    var checkedRules = $(".testrulesdiv .checkrule");
    var selectedRules = [];
    var allChecked = true;
    for (var i = 0; i < checkedRules.length; i++) {
        if ($(checkedRules[i]).prop("checked")) {
            var key = $(checkedRules[i]).val();
            var obj = {};
            for (var j = 0; j < savedRules.length; j++) {
                if (savedRules[j].hasOwnProperty(key)) {
                    obj[key] = savedRules[j][key];
                    selectedRules.push(obj);
                    break;
                }
            }            
        }
        else {
            allChecked = false;
        }
    }
    if (!allChecked) {
        $(".checkrule").first().prop("checked", "");
    } else {
        $(".checkrule").first().prop("checked", "checked");
    }
    populateLabForm(selectedRules);
    globalSelectedRules = selectedRules;
}

function populateTestRules(savedRules) {    
    for (var i = 0; i < savedRules.length; i++) {
        var ruleObj = savedRules[i];
        for (key in ruleObj) {
            $(".testrulesdiv").append("<br/><input type='checkbox' value = '"+key+"' class='checkrule' checked='checked'/>"+key);            
            break;
        }
    }
    populateLabForm(savedRulesJSON);
}

function pushTokens(tokens, labAttributes, labFormMap) {
    for (var k = 0; k < tokens.length; k++) {
        if (labValueMap.hasOwnProperty(tokens[k]) && !labFormMap.hasOwnProperty(tokens[k])) {            
            labFormMap[tokens[k]] = true;
            var inbuiltTokens = checkInBuilt(tokens[k]);
            console.log(inbuiltTokens);
            if (inbuiltTokens != null) {
                pushTokens(inbuiltTokens, labAttributes, labFormMap);
            }
            else 
                labAttributes.push({"id":tokens[k], "name":labValueMap[tokens[k]]});
        }
    }
}

function populateLabForm(selectedRules) {
    var labAttributes = [];
    var labFormMap = {};
    for (var i = 0; i < selectedRules.length; i++) {
        var ruleObj = selectedRules[i];
        for (key in ruleObj) {
            var subCategories = ruleObj[key];
            var valueType = Object.prototype.toString.call(subCategories);
            if (valueType === '[object Array]') {
                var subCategoriesCount = subCategories.length;
                for (var j = 0; j < subCategoriesCount; j++) {
                    for (key in subCategories[j]) {
                        var ruleStr = subCategories[j][key];      
                        var tokens = ruleStr.split(/\s+/);
                        pushTokens(tokens, labAttributes, labFormMap);
                    }
                }
            }
            else {
                var ruleStr = ruleObj[key];
                var tokens = ruleStr.split(/\s+/);
                pushTokens(tokens, labAttributes, labFormMap);
            }
            break;
        }
    }
    for (var i = 0; i < labAttributes.length; i++) {
        var id = labAttributes[i]["id"];
        var name = labAttributes[i]["name"];
        var val = 0;
        $(".labvalueformdiv").append("<div class='labformrow' style='height:30px'><span style='width:300px;display:inline-block'>"+name+":</span><input type='text' id='"+id+"' style='width:100px'/><span class='nameerror'></span></div>");
    }
}

function checkInBuilt(token) {
    var inmap = {
                    "bmi" : "height,weight"
                };
    if (inmap.hasOwnProperty(token)) {
        return inmap[token].split(",");
    }
    return null;
}