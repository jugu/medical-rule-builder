/**
 * @author Jugu Dannie Sundar <jugu [dot] 87 [at] gmail [dot] com>
 */
var CONSTANTS = {
    "NUMBERSTRING" : "number",
    "MULTIPLESTRING" : "multiple",
    "PRESENT" : "!=-1",
    "NOTPRESENT" : "==-1"
};

var config = {
    "showpreselect" : true,
    "expandpreselect" : false,
    "editview_showlogicalbydefault" : false,
    "defaults" : []
};

var operators = [
    {"id":"<", "name":"less than"},
    {"id":">", "name":"greater than"},
    {"id":"==", "name":"equals"},
    {"id":"<=", "name":"less than / equal to"},
    {"id":">=", "name":"greater than / equal to"},
    {"id":"!=-1", "name":"is present"},
    {"id":"==-1", "name":"is not present"},
    {"id" : "&&", "name" : "and", "group" : "true"},
    {"id" : "||", "name" : "or", "group" : "true"},
    {"id" : "(", "name" : "(", "group" : "true"},
    {"id" : ")", "name" : ")", "group" : "true"}
];

var operatorMap = {};
$.map( operators, function( obj, index ) {
    operatorMap[obj.id] =  obj.name;
});

var operatorButtons = [];
$.merge(operatorButtons, operators);

var commonSelectors = [
    {"id":"number", "name":"value"},
    {"id":"multiple", "name":"multiple of"}
];

var labValueMap = {};
var labValuePairMap = {}; //Pairing value for RHS
var labValues = [];     
var savedRulesJSON = [];
var newSavedRules = []; // tracks newly added rules
var currentEditComorb = ""; // tracks currently edited comorbidity



function loadLabValues() {
    $.getJSON( "labValues.json", function( data ) {
      labValues = data;
      loadDefinedRules();
    }).error(function(data) {
      console.log("Error: ", data);
    });
}

function loadDefinedRules() {
    $.getJSON( "definedrules.json", function( data ) {
        savedRulesJSON = data;    
        populateDefinedRules(savedRulesJSON);
        postLoadData();
    }).error(function(data) {
      console.log("Error: ", data);
    });
}

function postLoadData() {
    $.map( labValues, function( obj, index ) {
        labValueMap[obj.id] =  obj.name;
        labValuePairMap[obj.id] = obj.pairwith;
    });

    // bunch of UI operation defaults
    $(".rulename").focus();							

    $(".multipreselect").select2(
        {width: 'resolve'
    });	            	

    if (!config.expandpreselect) {
        $('.preselect div').hide();
    }

    var $select = $('select.multipreselect');			
    //iterate over the data and append a select option
    $.each(labValues, function(key, val) {
        $select.append('<option id="' + val.id + '">' + val.name + '</option>');
    });

    $selectN = $(".operator");			
    $.each(operators, function(key, val) { 
        if (!val.hasOwnProperty("group")) {
            $selectN.append('<option value="' + val.id + '">' + val.name + '</option>');
        }
    });                        

    var preselectOptions = labValues;
    var firstCategory = true;
    addSubCategory($("#addrule"), firstCategory);
    organizeOptions(preselectOptions);
}

function populateDefinedRules(savedRulesJSON) {
    for (var i = 0; i < savedRulesJSON.length; i++) {
        for (key in savedRulesJSON[i]) {
            $(".definedrules").append("<p>"+key+"</p>");
            break;
        }
    }
}        
// This function is called to attach events to the statically or dynamically created templates for buiding rule
function attachEventHandlers() {
    
    $("#editrule").on("click", ".showlogicalform", function() {
        var text = $(this).html();
        if (text.search("Show") >= 0) {
            text = text.replace("Show","Hide");
        }
        else {
            text = text.replace("Hide","Show");
        }
        $(this).html(text);
        $(this).parent().next().toggle();
    });
    
    $("#editrule").on("click", ".reset", function() {
        var ruleObj = null;
        for (var i = 0; i < savedRulesJSON.length; i++) {
            if (savedRulesJSON[i].hasOwnProperty(currentEditComorb)) {                        
                ruleObj = savedRulesJSON[i];
                break;
            }
        }
        $(this).parent().parent().find(".rulename").val(currentEditComorb);
        if (ruleObj != null){
            generateRuleTemplateFromText(ruleObj);
        }
    });

    $(".export").mouseover(function() {
        $(".definedrules").css({'background-color':'yellow'})
    }).mouseout(function() {
        $(".definedrules").css({'background-color':'white'})
    }).click(function() {
        var text = JSON.stringify(savedRulesJSON);
        var filename = "rules.json"
        var link = document.createElement("a");            
        var mimeType = 'text/plain';
        link.setAttribute('download', filename);
        link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(text));
        link.click();
    });

    $(".edittab").click(function () {
        $(".definedrules p").removeClass();
        $(".vieweditright #editrule").hide();
        if (newSavedRules.length > 0) {
            populateDefinedRules(newSavedRules);
            for (var i = 0; i < newSavedRules.length; i++)
                savedRulesJSON.push(newSavedRules[i]);
            newSavedRules = [];
        }
    })

    $(".multipreselect").on("select2:select select2:unselect", function (e) {
        //this returns all the selected item
        var preselectOptions = [];                
        var items= $(this).children(":selected");				
        $.each(items, function (index, element){
            preselectOptions.push({"id":element.id, "name": element.value});
        });
        organizeOptions(preselectOptions);
    });

    $('.preselect h2').click(function(e) {
        $('.preselect div').slideToggle('slow');
        if ($(this).children("span").text() === '+')
            $(this).children("span").text('-')
        else
            $(this).children("span").text('+')
        //$(this).toggleClass('active');
        //e.preventDefault();
    });            

    $(".tabs-menu a").click(function(event) {
        event.preventDefault();
        $(this).parent().addClass("current");
        $(this).parent().siblings().removeClass("current");
        var tab = $(this).attr("href");
        $(".tab-content").not(tab).css("display", "none");
        $(tab).fadeIn();
    });

    $(".rulename").keyup(function() {									
        var obj = $(this).parent().parent().parent();
        $(obj).children("div.categorycomponent").find(".declaredrule").html($(this).val());
        if ($(obj).children("div.categorycomponent").find(".hassubcategory").is(":checked") === false) {                                                        $(obj).children("div.ruleconditioncomponent").find(".ruleconditions h2 .definition").val($(this).val()).attr("disabled", true);
        }
    });

    $(".addAnother button").click(function() {            
        addSubCategory($(this).parent().parent(), false);				
    });					

    $(".hassubcategory").change(function() {
        var obj = $(this).parent().parent().parent();
        if (this.checked) {
            $(obj).children(".addAnother").show();
            $(obj).find(".definition").attr("disabled", false).val('').focus();	
        } else {
            $(obj).find(".ruleconditioncomponent .ruleconditions").not(':first').remove();			
            $(obj).find(".definition").val($(obj).find(".rulename").val()).attr("disabled", true);
            $(obj).children(".addAnother").hide();		
        }
    });

    $(".ruleconditioncomponent").on("click", ".ruleconditions h2 input", function(e) {
        e.stopPropagation();
    });

    $(".ruleconditioncomponent").on("click", ".ruleconditions h2", function() {
        if ($(this).children(".expandcollapse").text() === '+') {
            $(this).children(".expandcollapse").text('-');                    
            $(this).next().show();
        }
        else {
            $(this).children(".expandcollapse").text('+');
            $(this).next().hide();
        }                                   
    });

    $(".ruleconditioncomponent").on("click",".ruleconditions h2 button", function(e){
        e.stopPropagation();
        $(this).parent().parent().remove();
        //populateRuleText();
    });

    $(".ruleconditioncomponent").on("click",".ruleTemplate .groupcondition", function() {			
        var html = $("#subcategoryTemplate .ruleTemplate").clone().wrap('<p/>').parent().html();				
        $(this).parent().parent().append(html); // append html to 'groupclass' div
        populateRuleText($(this).parents());
    });			

    $(".ruleconditioncomponent").on("click",".ruleTemplate .condition", function() {			
        var html = $("#conditionTemplate").html();
        $(this).parent().next().append(html); // append html to 'conditionclass' div                     
        var lhsId = $(this).parent().children("div.acondition").last().children(".lhs").children(":selected").attr("value");
        if (labValuePairMap.hasOwnProperty(lhsId)) {
            var pairWith = labValuePairMap[lhsId];
            $(this).parent().children("div.acondition").last().children(".rhs").val(pairWith);
        }
        populateRuleText($(this).parents());
    });

    $(".ruleconditioncomponent").on("click",".ruleTemplate .removecondition", function() {
        var cacheParents = $(this).parents();
        $(this).parent().remove(); // removes 'acondition' class div                
        populateRuleText(cacheParents);
    });

    $(".ruleconditioncomponent").on("click",".ruleTemplate .removegroupcondition", function() {
        var cacheParents = $(this).parents();
        $(this).parent().parent().remove();
        populateRuleText(cacheParents);
    });

    $(".ruleconditioncomponent").on("change", ".anyall", function() {
        populateRuleText($(this).parents());
    });

    $(".ruleconditioncomponent").on("change", ".acondition .lhs", function() {     
        var lhsId = $(this).children(":selected").attr("value");
        if (labValuePairMap.hasOwnProperty(lhsId)) {
            var pairWith = labValuePairMap[lhsId];
            $(this).parent().children(".rhs").val(pairWith);
        }                                
        populateRuleText($(this).parents());
    });

    $(".ruleconditioncomponent").on("change", ".acondition .operator", function() {
        var selectedId = $(this).children(":selected").attr("value");
        if (selectedId === CONSTANTS.NOTPRESENT || selectedId === CONSTANTS.PRESENT) {
            $(this).next().hide();
        }
        else {
            $(this).next().show();
        }
        populateRuleText($(this).parents());
    });

    $(".ruleconditioncomponent").on("change", ".acondition .rhs", function() {
        var rhsVal = $(this).children(":selected").attr("value");
        if (rhsVal == CONSTANTS.NUMBERSTRING) {
            if ($(this).next().prop("nodeName") !== 'INPUT') {
                $("<input type='text' value='0' style='width:50px;margin-left:5px;margin-right:5px'/>").insertBefore($(this).parent().children().last());
                $(this).next().focus();
                $(this).next().select();
            } else if ($(this).next().next().attr("class") === 'rhs') {
                $(this).next().next().remove();
            }
        } else if ( rhsVal == CONSTANTS.MULTIPLESTRING) {
            if ($(this).next().prop("nodeName") !== 'INPUT') {
                $("<input type='text' value='0' style='width:50px;margin-left:5px;margin-right:5px'/>").insertAfter($(this));
                if ($(this).next().next().attr("class") !== 'rhs') {
                    $(this).clone().insertBefore($(this).parent().children().last());
                }
                $(this).next().focus();
                $(this).next().select();
            }
            if ($(this).next().next().attr("class") !== 'rhs') {
                $(this).clone().insertBefore($(this).parent().children().last());                        
                $(this).next().focus();
                $(this).next().select();
            }                    
        }
        else {
            if ($(this).next().prop("nodeName")==='INPUT')
                $(this).next().remove();
            if ($(this).next().attr("class") === 'rhs') {
                $(this).next().remove();
            }                    
        }
        populateRuleText($(this).parents());
    });

    $(".ruleconditioncomponent").on("change keyup", ".acondition input", function() {
        populateRuleText($(this).parents());
    });

    $(".ruleconditioncomponent").on("click", ".isrulevalid button.clear", function() {
        var obj = $(this).parent().parent().children(".textrule");                          
        obj.html("");
        obj.focus();                
        ruleError(obj);
        $(this).parents(".textandlogicalform").children(" .logicalform").html("");
        $(this).parents(".textandlogicalform").children(".logicalform").append($("#subcategoryTemplate .logicalform").html());
        console.log($(this).parents(".textandlogicalform").children(".logicalform").children());
        $(this).parents(".textandlogicalform").find(".removegroupcondition").remove();	                
    });

    $(".vieweditparent").on("click", ".definedrules p", function() {
        $(".definedrules p").removeClass("selected_edit_rule");
        $(this).addClass("selected_edit_rule");
        $(".vieweditright #editrule").show();
        var comorb = $(this).text();
        currentEditComorb = comorb;
        var ruleObj = null;
        for (var i = 0; i < savedRulesJSON.length; i++) {
            if (savedRulesJSON[i].hasOwnProperty(comorb)) {                        
                ruleObj = savedRulesJSON[i];
                break;
            }
        }
        if (ruleObj != null){
            generateRuleTemplateFromText(ruleObj);
        }
    });

    $("#addrule").on("click", ".saveAdd", function() {  // Save Function
        if (!validateFieldsOnAddition()) {
            return;
        }
        var saveObject = {};                
        var comorbidityName = $("#addrule .rulename").val();
        saveObject[comorbidityName] = null;
        var hasSubCategories = $("#addrule .hassubcategory").prop("checked");
        if (hasSubCategories) {
            saveObject[comorbidityName] = [];
            var categorycount = $("#addrule .ruleconditioncomponent .ruleconditions").length;
            var obj = null;
            for (var i = 1; i <= categorycount; i++) {
                obj = $("#addrule .ruleconditioncomponent .ruleconditions:nth-child("+i+")");
                var definition = $(obj).find(".definition").val();
                var rule = $(obj).find(".textrule").data("itext");
                var categoryObj = {};
                categoryObj[definition] = rule;
                saveObject[comorbidityName].push(categoryObj);
            }
        } else {
            var obj = $("#addrule .ruleconditioncomponent .ruleconditions").first();
            var rule = $(obj).find(".textrule").data("itext");
            saveObject[comorbidityName] = rule;                    
        }
        newSavedRules.push(saveObject);
        console.log(newSavedRules);
        triggerSuccessfulAddition();
    });
    
    $("#editrule").on("click", ".saveEdit", function() {  // Save Function
        if (!validateFieldsOnAddition()) {
            return;
        }
        var saveObject = {};                
        var comorbidityName = $("#editrule .rulename").val();
        saveObject[comorbidityName] = null;
        var hasSubCategories = $("#editrule .hassubcategory").prop("checked");
        if (hasSubCategories) {
            saveObject[comorbidityName] = [];
            var categorycount = $("#editrule .ruleconditioncomponent .ruleconditions").length;
            var obj = null;
            for (var i = 1; i <= categorycount; i++) {
                obj = $("#editrule .ruleconditioncomponent .ruleconditions:nth-child("+i+")");
                var definition = $(obj).find(".definition").val();
                var rule = $(obj).find(".textrule").data("itext");
                var categoryObj = {};
                categoryObj[definition] = rule;
                saveObject[comorbidityName].push(categoryObj);
            }
        } else {
            var obj = $("#editrule .ruleconditioncomponent .ruleconditions").first();
            var rule = $(obj).find(".textrule").data("itext");
            saveObject[comorbidityName] = rule;                    
        }
        for (var i = 0; i < savedRulesJSON.length; i++) {
            for (var key in savedRulesJSON[i]) {
                if (currentEditComorb === key) {
                    savedRulesJSON[i] = saveObject;
                }
            }
        }//TODO beautify successful operation message
        var message = "Changes saved Successfully!"
        invokeModal(message, "SUCESSS");        
    });
    
    $(".modalclose").click(function() {
        $("div.modalTemplate").hide();
        $("div.modalTemplate").removeClass("successdiv");
        $("#tabs-container").css({"opacity" : 1});    
        $("body").css({"background-color" : "white"});
    });
}  // end of attachEventHandlers function

function invokeModal(message, kindOfMessage) {
    $(".vieweditright").hide();
    $("div.modalTemplate").show();
    if (kindOfMessage == 'SUCCESS')
        $("div.modalTemplate").addClass("successdiv");
    $("div#modalmessage").html(message);
    $("#tabs-container").css({"opacity" : 0.1});
    $("body").css({"background-color" : "brown"});
}

function triggerSuccessfulAddition() {//TODO beautify alert
    alert("Rule Saved Successfully");
    $("#addrule .rulename").val("");
    $("#addrule .declaredrule").html("");
    $("#addrule .hassubcategory").prop("checked", "");
    $("#addrule .ruleconditioncomponent .ruleconditions").not(":first").remove();
    $("#addrule .ruleconditions .definition").val("");
    $("#addrule .ruleconditions .textrule").text("");
    $("#addrule .ruleconditions .ruleTemplate").not(":first").remove();
    $("#addrule .acondition").remove();
    $("#addrule .multipreselect").select2("val","");
    organizeOptions(labValues);
    ruleError($("#addrule .textrule"));
}

function validateFieldsOnAddition() {//TODO
    return true;
}

function organizeOptions(optionsToPopulate) {
    var $selectN = $(".lhs");
    $(".lhs").empty();
    $.each(optionsToPopulate, function(key, val){ 
        $selectN.append('<option value="' + val.id + '">' + val.name + '</option>');                
    });

    $selectN = $(".rhs");
    $(".rhs").empty();
    var rhsValues = [];
    $.extend(rhsValues, optionsToPopulate);
    $.merge(rhsValues, commonSelectors);            
    $.each(rhsValues, function(key, val){ 
        $selectN.append('<option value="' + val.id + '">' + val.name + '</option>');
      });
    $(".labattributes").empty();
    $.each(optionsToPopulate, function(key, val){ 
        $(".labattributes").append('<p class="labvals">' + val.name + '</p>');                 
        $(".labattributes").children().last().data("value", val.id);                                        
    });	

}

function determineCurrentRuleDiv(parents) {
    for (var i = 0; i < parents.length; i++) {
        if( parents[i].className === 'textandlogicalform')
            return parents[i];
    }
    return null;
}

function populateRuleText(parents) {
    var parentObj = determineCurrentRuleDiv(parents);
    if (parentObj) {                
        var interpretedRuleText = getRuleString($(parentObj).children(".logicalform").children(".ruletemplate"));
        var obj = $(parentObj).find(".textform .textrule");
        try {
            var displayRuleText = verboseRuleText(interpretedRuleText);
            $(obj).data("itext", interpretedRuleText);
            $(obj).html(displayRuleText);                    
            ruleIsFine(obj);
        } catch (err) {
            ruleError(obj);
        }
    }
}

function ruleIsFine(obj) {
    $(obj).next().find("span").css({"color":"green"}).html("Definition is valid");
    $(obj).css({"border-color":"green"}); 
}

function ruleError(obj) {
    $(obj).next().find("span").html("Definition is Invalid").css({"color":"red"});
    $(obj).css({"border-color":"red"});            
}

var parseTokensToText = function (interpText) {
    var returnStr = "";
    try {                
        var tokens = interpText.split(/\s+/);                
        for (var i = 0; i < tokens.length; i++) {                    
            if (labValueMap.hasOwnProperty(tokens[i])) {
                // checking if previous token is a non grouping operator which implies that it is RHS
                if (i > 0 && operatorMap.hasOwnProperty(tokens[i - 1]) && 
                    $.inArray(tokens[i - 1],['&&','||','(']) == -1) {
                    returnStr += "<span style='color:red'>" + labValueMap[tokens[i]] + "</span>";
                } else {
                    returnStr += "<span style='color:green'>" + labValueMap[tokens[i]] + "</span>";
                }
            }
            else if (operatorMap.hasOwnProperty(tokens[i])) {
                var op = operatorMap[tokens[i]];                        
                if (tokens[i] === '(') {                            
                    returnStr += "<div>" + op.toUpperCase() + "<div style='margin-left:50px'>";
                } else if (tokens[i] === ')') {
                    returnStr += "</div>" + op.toUpperCase() + "</div>";
                }
                else if (tokens[i] === "&&" || tokens[i] === "||") {
                    if (tokens[i - 1] != ')')
                        returnStr += "<br/>";
                    returnStr +=  op.toUpperCase()+"<br/>";    
                }
                else if (tokens[i] === '==-1' || tokens[i] === '!=-1') {                            
                    returnStr += op;//op.toUpperCase();
                }
                else {
                    returnStr += op;//tokens[i];//op.toUpperCase();
                }
            }
            else {
                returnStr += "<span style='color:brown'>" + tokens[i] + "</span>";
            }
            returnStr += " ";
        }
    } catch (err) {
        returnStr = err;
    }
    return returnStr;
};



// This function has a recursive method implementation to construct the rule HTML for edit view
var parseTokensToHTML = function (interpText) {
    var tokens = lexer (interpText);
    var parseTree = parse(tokens);
    var node = parseTree[0];// for one comorb rule there will be only one parse tree            
    var parent = $("#editrule div.ruleconditions:last div.logicalform div.ruleTemplate:last p:first");
    var recurseNode = function(node, parent, addcondition, identifierOnWhichSide, isFirst, multipleMode) {   
        if (!node)
            return;                            
        var conditionAppend = false;                
        if (node.hasOwnProperty("group") ) {
            if (node.type === '||' || node.type === '&&') {
                var tempParent = parent;
                if ($(tempParent).prop("nodeName") === 'P') {
                    tempParent = $(tempParent).parent();
                }
                $(tempParent).append($("#subcategoryTemplate .logicalform").html());                        
                if (node.type == "||") {                        
                    $(tempParent).find("select.anyall:last").val("Any");
                }
                parent = $(tempParent).find("div.ruleTemplate:last p:first");
            }
            else if (node.type !== "*") {
                conditionAppend = true;
            }
        }
        else if (isFirst && node.type =='||') {
            var tempParent = parent;
            if ($(tempParent).prop("nodeName") === 'P') {
                tempParent = $(tempParent).parent();
            }
            $(tempParent).find("select.anyall:last").val("Any");
        }                                
        else if (node.type !== '&&' && node.type !== '||' && node.type !== 'identifier' && node.type !== '*' && multipleMode == 0){
            conditionAppend = true;
        }
        if (identifierOnWhichSide === 'LEFT') {
            if (multipleMode == 1 && node.type == 'number') { // special case for multiplication
                $(parent).find(".acondition:last input").val(node.value);
            } else {
                $(parent).find(".acondition:last .lhs").val(node.value);
            }
        }
        else if (identifierOnWhichSide === 'RIGHT') {
            if (node.type === CONSTANTS.NUMBERSTRING) {// special case for numerical input
                $(parent).find(".acondition:last .rhs").val(node.type);
                var inputTextBox = "<input type='text' value='"+node.value+"'/>"
                $(inputTextBox).insertAfter($(parent).find(".acondition:last .rhs"));
            } else if (node.type === "*") { // special case for multiple
                $(parent).find(".acondition:last .rhs").val(CONSTANTS.MULTIPLESTRING);
                var inputTextBox = "<input type='text'/>"
                $(inputTextBox).insertAfter($(parent).find(".acondition:last .rhs"));
                $(".acondition:last .rhs").clone().insertAfter($(parent).find(".acondition:last input"));
            } else if (multipleMode == 2 && node.type == 'identifier') {
                $(parent).find(".acondition:last .rhs:last").val(node.value);
            }
            else {
                $(parent).find(".acondition:last .rhs").val(node.value);
            }
        }
        if (addcondition || conditionAppend) {
            //parent = $(parent).first();
            if (node.type !== 'identifier' && node.type !== 'number' && node.type !== '*') {
                $(parent).append($("#conditionTemplate").html());   
                $(parent).find(".acondition:last .operator").val(node.type);
                if (node.type == '==-1' || node.type =='!=-1') { // special case for present/not present
                    $(parent).find(".acondition:last .rhs").remove();
                }
            }
            identifierOnWhichSide = 'LEFT';
            recurseNode(node.left, parent, false, identifierOnWhichSide, false, 0);
            identifierOnWhichSide = 'RIGHT';                    
            recurseNode(node.right, parent, false, identifierOnWhichSide, false, 0);
        }
        else {
            identifierOnWhichSide = "";
            if (node.type == '*')
                multipleMode = 1;
            else 
                multipleMode = 0;
            recurseNode(node.left, parent, conditionAppend, (multipleMode == 0) ? identifierOnWhichSide : "LEFT", false, multipleMode);
            recurseNode(node.right, parent, conditionAppend, (multipleMode == 0) ? identifierOnWhichSide : "RIGHT", false, (multipleMode == 1) ? 2 : 0);
        }
    }
    var addcondition = false;
    var identifierSide = "";
    var isFirst = true;
    var multipleMode = 0;// 0 implies not multiple, 1 implies multiplication factor, 2 implies lab value
    recurseNode(node, parent, addcondition, identifierSide, isFirst, multipleMode);
}

function verboseRuleText(interpreterText) {
    var newText= "";
    try {
        newText = parseTokensToText(interpreterText);            
    } catch (err) {
        newText = err;
    }
    return newText;
}                            

// This method is used in the edit view to create the html template based on a rule definition obtained from the saved/defined rules
var generateRuleTemplateFromText = function(ruleObj) {
    var comorbidityName = "";
    var hasSubCategories = false;
    var subCategoriesCount = 0;
    var subCategories = [];
    for (key in ruleObj) {
        comorbidityName = key;
        subCategories = ruleObj[key];
        var valueType = Object.prototype.toString.call(subCategories);
        if (valueType === '[object Array]') {
            hasSubCategories = true;
            subCategoriesCount = subCategories.length;
            console.log(subCategories);
        }
        break;
    }
    $(".vieweditparent .namecomponent .rulename").val(comorbidityName);
    $(".vieweditparent .declaredrule").html(comorbidityName);
    $("#editrule .ruleconditioncomponent").html("");
    if (hasSubCategories) {
        $("#editrule .hassubcategory").prop("checked", "checked");
        $("#editrule .addAnother").show();
        var isFirstOne = true;
        for (var j = 0; j < subCategoriesCount; j++) {
            addSubCategory($("#editrule"), isFirstOne);
            for (key in subCategories[j]) {
                $("#editrule .ruleconditions:last .definition").val(key);
                var ruleStr = subCategories[j][key];                
                ruleStr = parseTokensToText(ruleStr);// converting the interpreter text to english text 
                $("#editrule .ruleconditions:last .textrule").html(ruleStr).css({"borderColor":"green"});
                $("#editrule .ruleconditions:last .isrulevalid").html("");
                parseTokensToHTML(subCategories[j][key]);
                if (!config.editview_showlogicalbydefault) {
                    $("#editrule .ruleconditions:last .logicalform").hide();    
                    $("#editrule .ruleconditions:last .showlogicalform").show();
                }                
                break;
            }
            //$(obj).data("itext", interpretedRuleText);
            isFirstOne = false;
        }                
    } else {
        $("#editrule .hassubcategory").prop("checked", "");
        $("#editrule .addAnother").hide();
        addSubCategory($("#editrule"), true);
        var ruleStr = subCategories;
        $("#editrule .ruleconditions:last .definition").val(comorbidityName);
        $("#editrule .ruleconditions:last .definition").prop("disabled", "disabled");        
        ruleStr = parseTokensToText(ruleStr); // converting the interpreter text to english text 
        $("#editrule .ruleconditions:last .textrule").html(ruleStr).css({"borderColor":"green"});
        $("#editrule .ruleconditions:last .isrulevalid").html("");
        parseTokensToHTML(subCategories); // constructing the conditional builder HTML through this method
            
    }
};            

function getRuleString(obj) {
    //var str = ""; // stores the verbose (expanded) form the of rule definition
    var interpreterString = ""; // stores the code form (the one which is interpreted later) of the rule definition

    var groupObj = $(obj).children(".groupclass").first();// groupclass div  
    var andOr = $(groupObj).find("select.anyall").val();            
    andOr =  (andOr === 'Any')?" OR " : " AND ";                   
    var andOrIntepreter =  (andOr === ' OR ')?" || " : " && ";
    var conditions = $(obj).children(".groupclass").first().next().find(".acondition"); // conditions defined in conditionclass div
    var conditionsLength = conditions.length;
    var counter = 0;
    $(conditions).each(function() {        
        var operatorid = $(this).find(".operator").children(":selected").attr("value");
        interpreterString +=  $(this).find(".lhs").children(":selected").attr("value") + " ";
        interpreterString += operatorid + " ";
        if (operatorid !== CONSTANTS.NOTPRESENT && operatorid !== CONSTANTS.PRESENT) {
            var rhsid = $(this).find(".rhs").children(":selected").attr("value");                                
            if ( rhsid === CONSTANTS.NUMBERSTRING) {
                var numericalValue = $(this).find(".rhs").next().val();
                //str += numericalValue + " ";
                interpreterString += numericalValue + " ";
            } else if (rhsid === CONSTANTS.MULTIPLESTRING) {
                var numericalValue = $(this).find(".rhs").next().val();
                var rhsValue = $(this).find(".rhs:last").children(":selected").attr("value");
                interpreterString += numericalValue + " * " + rhsValue;
            } else {
                interpreterString +=  $(this).find(".rhs").children(":selected").attr("value") + " ";
            }
        }
        counter++;
        if (counter != conditionsLength) {
            interpreterString += andOrIntepreter;
        }
    });
    $(obj).first().children().not(":first").filter(".ruleTemplate").each(function(index, element) {                
        var inStr = getRuleString($(element));
        if (interpreterString.length == 0 && inStr.length > 0)
        {
            //str += " [ " + inStr +" ] ";
            interpreterString += " ( " + inStr +" ) ";
        }
        else if (inStr.length  > 0)
        {
            //str += andOr + " [ " + inStr +" ] ";
            interpreterString += andOrIntepreter + " ( " + inStr +" ) ";
        }
    });                                           
    return interpreterString;
}                    

function addSubCategory(parentDiv, firstCategory)
{
    var html = $("#subcategoryTemplate").html();            
    var obj = $(parentDiv).find(".ruleconditioncomponent");
    $(obj).append(html);			
    $(parentDiv).find(".ruleconditioncomponent .definition:last").focus();
    if (typeof(firstCategory) != 'undefined' && firstCategory === true) {
        $(parentDiv).find(".ruleconditioncomponent .ruleconditions h2 button").remove();                
    }
    $(parentDiv).find(".ruleconditioncomponent .ruleconditions:last .removegroupcondition:first").remove();			            
    $(parentDiv).find(".ruleconditioncomponent .ruleconditions h2").children(".expandcollapse").text('+');                    
    $(parentDiv).find(".ruleconditioncomponent .ruleconditions h2").next().hide();
}