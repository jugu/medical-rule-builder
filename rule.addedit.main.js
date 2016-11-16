/**
 * @author Jugu Dannie Sundar <jugu [dot] 87 [at] gmail [dot] com>
 */

// Support for exceptional cases when building rules
var CONSTANTS = {
    "CONSTANTSTRING" : "constant",
    "NUMBERSTRING" : "number",
    "MULTIPLESTRING" : "multiple",
    "PRESENT" : "!=-1",
    "NOTPRESENT" : "==-1"
};


// These are some of the custom UI configurations.
var config = {
    "showpreselect" : true,
    "addview_expandpreselect" : false, // show the Lab Dictionary expanded by default in Add view
    "editview_expandpreselect" : false, // show the Lab Dictionary expanded by default in Edit view
    "editview_showlogicalbydefault" : false, // show the Editable Version expanded by default in Edit view
    "displayAssociations" : false, // show the And/Or associations in the editable version of rule descriptors
    "displayAnyK" : true, // Allow user to create conditions of type any 2, any 3, any 4...
    "usePreviouslyDefinedorSavedRules" : true, // This is used for population the lhs options of the condition based on previously defined rules or previously defined subcategories for current rule
    "defaults" : []
};

var errorCode = {
    "rulenameerror" : {"identifier" : ""}
}

// Exhaustive list of operators supported and used in the rule builder
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


//These are the common list of selectors for Operators dropdown which manipulate the display of condition
var commonSelectors = [
    {"id":"number", "name":"value"},
    {"id":"multiple", "name":"multiple of"},
    {"id":"constant", "name":"text"}
];

var commonSelectorMap = {};
$.map( commonSelectors, function( obj, index ) {
    commonSelectorMap[obj.id] =  obj.name;
});

var labValueMap = {};
var labValuePairMap = {}; //Pairing value for RHS based on the LHS lab values selected (used for default pairing to reduce clicks)
var labValues = [];      // Stores the exhaustive list of labValues from the user json file
var savedRulesJSON = []; // Tracks the current saved rules 
var newSavedRules = []; // tracks newly added rules
var currentEditComorb = ""; // tracks currently edited comorbidity

var preselectedOptions = [];


/* Loading the exhaustive list of lab values from the server file (for demo purpose). 
In future development, the user will also have ability to load custom lab values*/
function loadLabValues() {
    $.getJSON( "labValues.json", function( data ) {
      labValues = data;
      loadDefinedRules();
    }).error(function(data) {
      console.log("Error: ", data);
    });
}

/* Loading the exhaustive list of lab rules(comorbidities) from the server file (for demo purpose). 
In future development, the user will also have ability to load custom rules. (However, the defined rules should be built using the custom lab values for consistency and make things sensible)*/
function loadDefinedRules() {
    $.getJSON( "rules.json", function( data ) {
        savedRulesJSON = data;    
        populateDefinedRules(savedRulesJSON);
        postLoadData();
    }).error(function(data) {
      console.log("Error: ", data);
    });
}

// After all data is obtained, load the rule addition page (by default)
function postLoadData() {
    $.map( labValues, function( obj, index ) {
        labValueMap[obj.id] =  obj.name;
        labValuePairMap[obj.id] = obj.pairwith;
    });

    // bunch of UI operation defaults
    $(".rulename").focus();							

    $(".multipreselect").select2();    	

    if (!config.addview_expandpreselect) {
        $('#addrule .preselect div').hide();
    } else {
        $('#addrule .expandcollapse').html("-");
    }
    
    if (!config.editview_expandpreselect) {
        $('#editrule .preselect div').hide();
    }
    else {
        $('#editrule .expandcollapse').html("-");
    }
    

    var $select = $('select.multipreselect');			
    //iterate over the data and append a select option
    $.each(labValues, function(key, val) {
        $select.append('<option value="' + val.id + '">' + val.name + '</option>');
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
    $(".rulename").focus();
    organizeOptions(preselectOptions, "#addrule");
}

// This will populate list of predefined rules in the Edit view
function populateDefinedRules(savedRulesJSON) {
    $(".definedrules").html("");
    for (var i = 0; i < savedRulesJSON.length; i++) {
        for (key in savedRulesJSON[i]) {
            $(".definedrules").append("<p>"+key+"</p>");
            break;
        }
    }
}
// This function is called to attach events to the statically or dynamically created templates for buiding rule
function attachEventHandlers() {

   // This event handler on the checkbox (display associations) changes the config for displaying association text (AND, OR) in between html editable condition construct
    $("#displayassoc").on("change", function() {
        if ($(this).is(":checked")) {
            config.displayAssociations = true;
        }    
        else
            config.displayAssociations = false;
    });
    
    // This event handler toggles between showing and hiding the editable HTML version of the rule
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
    
    // This event handler undoes the changes by the user for the current rule and restores the original defined rule and its HTML construct
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
            generateRuleTemplateFromText(ruleObj, labValueMap, savedRulesJSON);
            invokeMessage("Rule reset successfully!", "SUCCESS");
        }
    });

    // This event handler exports the JSON format of the interpreted text for all the defined rules
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
    
    // This event handler prepopulates the lhs and rhs options based on the preselect options - Add flow
    $(".addtab").click(function() {
        $(".nameerror").html("");
        var preselectOptions = labValues;
        var preselectedOptionsInAddArray = $("#addrule .multipreselect").select2().val();
        if (preselectedOptionsInAddArray != null) {
            preselectOptions = [];
            for (var i = 0 ; i < preselectedOptionsInAddArray.length; i++) {
                preselectOptions.push({"id": preselectedOptionsInAddArray[i], "name" : labValueMap[preselectedOptionsInAddArray[i]]});
            }
        }
       organizeOptions(preselectOptions, "#addrule"); 
    });
    
    //This event handler populates the previously defined / saved rules as part of the edit flow
    $(".edittab").click(function () {
        $(".definedrules p").removeClass();
        $(".nameerror").html("");
        $(".vieweditright #editrule").hide();
        if (newSavedRules.length > 0) {            
            for (var i = 0; i < newSavedRules.length; i++)
                savedRulesJSON.push(newSavedRules[i]);
            newSavedRules = [];
        }
        populateDefinedRules(savedRulesJSON);
    });

    // This event handler organnizes the lhs (and/or rhs) options based on the preselected values as part of ADD flow
    $("#addrule .multipreselect").on("select2:select select2:unselect", function (e) {
        //this returns all the selected item
        var preselectOptions = [];                
        var items= $(this).children(":selected");				
        $.each(items, function (index, element){
            preselectOptions.push({"id":element.value, "name": element.text});
        });
        organizeOptions(preselectOptions, "#addrule");
    });
    
    // This event handler toggles the display div of the preselect (Lab Dictionary) options in the ADD flow
    $('#addrule .preselect h2').click(function(e) {
        $('#addrule .preselect div').slideToggle();
        if ($(this).children(".expandcollapse").text() === '+')
            $(this).children(".expandcollapse").text('-')
        else
            $(this).children(".expandcollapse").text('+')        
    });
    
    // This event handler organnizes the lhs (and/or rhs) options based on the preselected values as part of EDIT flow
    $("#editrule .multipreselect").on("select2:select select2:unselect", function (e) {
        //this returns all the selected item
        var preselectOptions = [];                
        var items= $(this).children(":selected");        
        $.each(items, function (index, element){
            var doAdd = true;
            for (var i = 0; i < preselectedOptions.length; i++) {
                if (preselectedOptions[i].hasOwnProperty("id")) {
                    if (preselectedOptions[i]["id"] == element.value) {
                        doAdd = false;
                        break;
                    }
                }
            }
            if (doAdd)
                preselectOptions.push({"id":element.value, "name": element.text});
        });
        var doPreselectedOptionsExist = (preselectedOptions.length > 0);
        organizeOptions(preselectOptions, "#editrule", doPreselectedOptionsExist);
    });

    // This event handler toggles the display div of the preselect (Lab Dictionary) options in the EDIT flow
    $('#editrule .preselect h2').click(function(e) {
        $('#editrule .preselect div').slideToggle();
        if ($(this).children(".expandcollapse").text() === '+')
            $(this).children(".expandcollapse").text('-')
        else
            $(this).children(".expandcollapse").text('+')
    });

    //This event handle toggles the tabs between ADD, EDIT, and TEST based user choice
    $(".tabs-menu a").click(function(event) {
        event.preventDefault();
        $(this).parent().addClass("current");
        $(this).parent().siblings().removeClass("current");
        var tab = $(this).attr("href");
        $(".tab-content").not(tab).css("display", "none");
        $(tab).fadeIn();
    });

    //This event handler binds the typed rule name with the 1st subcategory name as a default.
    $(".rulename").keyup(function() {									
        var obj = $(this).parent().parent().parent();
        $(obj).children("div.categorycomponent").find(".declaredrule").html($(this).val());
        if ($(obj).children("div.categorycomponent").find(".hassubcategory").is(":checked") === false) {                                                                $(obj).children("div.ruleconditioncomponent").find(".ruleconditions h2 .definition").val($(this).val()).attr("disabled", true);
        }
    });
    
    //This event handler adds the subcategory div for the current rule to allow user to define new subcategory under the rule
    $(".addAnother button").click(function() {            
        addSubCategory($(this).parent().parent(), false);				
    });					

    //This event handler for the checkbox (whether rule has subcategory) toggles the "Add subcategory" button which allows user to add multiple subcategories
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
    
    // This event handler prevents the propogation of div toggle on the parent as input is sought from user
    $(".ruleconditioncomponent").on("click", ".ruleconditions h2 input", function(e) {
        e.stopPropagation();
    });

    //This event handler toggles the display div of the rule condition(for a subcategory)
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

    // This event handler removes the current subcategory based on the user action
    $(".ruleconditioncomponent").on("click",".ruleconditions h2 button", function(e){
        e.stopPropagation();
        $(this).parent().parent().remove();
    });

    // This event handler adds the group condition in the rule conditions div
    $(".ruleconditioncomponent").on("click",".ruleTemplate .groupcondition", function() {			                        
        var html = $("#subcategoryTemplate .ruleTemplate").clone().wrap('<p/>').parent().html();				
        $(this).parent().parent().append(html); // append html to 'groupclass' div
        if (config.displayAssociations) {
            var anyAll = $(this).siblings(".anyall").val();        
            addAssociations(anyAll, $(this).parent().parent());
        }
        populateRuleText($(this).parents());        
    });
    
    // This event handler adds the condition which can be based on available variables (labvalues)
    $(".ruleconditioncomponent").on("click",".ruleTemplate .condition, .ruleTemplate .conditionlabvalue", function() {            
        var html = $("#conditionTemplate").html();        
        $(this).parents(".groupclass").next().append(html); // append html to 'conditionclass' div        
        var lhsId = $(this).parents(".groupclass").next().children("div.acondition").last().children(".lhs").children(":selected").attr("value");
        if (labValuePairMap.hasOwnProperty(lhsId)) {
            var pairWith = labValuePairMap[lhsId];
            $(this).parents(".groupclass").next().children("div.acondition").last().children(".rhs").val(pairWith);
        }       
        // Adding associations (AND/OR) to the html        
        if (config.displayAssociations) {
            addAssociations($(this).siblings(".anyall").val(), $(this).parents(".ruleTemplate"));// this.parent.parent refers to ruleTemplate            
        }
        populateRuleText($(this).parents());
    });
    
    // This event handler adds the condition which can be based on previously defined rules or previously defined subconditions for current rule
    $(".ruleconditioncomponent").on("click",".ruleTemplate .conditionsubrule", function() {
        var html = $("#conditionTemplate").html();        
        $(this).parents(".groupclass").next().append(html); // append html to 'conditionclass' div        
        populatePrevDefinedConditionsInLHS($(this).parents(".groupclass").next().children("div.acondition").last().children(".lhs"), savedRulesJSON);
        $(this).parents(".groupclass").next().children("div.acondition").last().children(".rhs").remove();
        keepOnlyExistsOrNotExistsOperators($(this).parents(".groupclass").next().children("div.acondition").last().children(".operator"))
        // Adding associations (AND/OR) to the html        
        if (config.displayAssociations) {
            addAssociations($(this).siblings(".anyall").val(), $(this).parents(".ruleTemplate"));// this.parent.parent refers to ruleTemplate            
        }
        populateRuleText($(this).parents());
    });

    // This event handler removes the current condition
    $(".ruleconditioncomponent").on("click",".ruleTemplate .removecondition", function() {        
        var cacheParents = $(this).parents();
        var parentObj  = $(this).parent();
        var parentRuleTemplate = $(parentObj).parent().parent();
        $(parentObj).remove(); // removes 'acondition' class div
        if (config.displayAssociations) {
            removeAssociations(parentRuleTemplate);
        }
        populateRuleText(cacheParents);
    });

    // This event handler removes the current group condition
    $(".ruleconditioncomponent").on("click",".ruleTemplate .removegroupcondition", function() {
        var cacheParents = $(this).parents();
        var parentObj  = $(this).parent();
        var parentRuleTemplate = $(parentObj).parent().parent();
        $(this).parent().parent().remove();
        if (config.displayAssociations) {
            removeAssociations(parentRuleTemplate);
        }
        populateRuleText(cacheParents);
    });
        
    // This event handler changes the associations between conditions/group conditions
    $(".ruleconditioncomponent").on("change", ".anyall", function() {
        var anyAll = "AND";
        if ($(this).val() == 'Any') {
            anyAll = "OR";                
        }
        if (config.displayAnyK) {
            if (anyAll == 'OR') {
                $("<input type='number' value='1' min='1' class='inputforany'></input>").insertAfter($(this));
            } else {
                $(this).next().remove();
            }
        }
        if (config.displayAssociations) {            
            $(this).parent().siblings(".conditionclass").children(".associationclass").html(anyAll);
            $(this).parent().siblings(".associationgroupclass").html(anyAll);
        }
        populateRuleText($(this).parents());
    });
    
    // This event handler is for handling the case of Any 2, Any 3, ... , and so on. The rule text is modified based on user selection
    $(".ruleconditioncomponent").on("change", ".inputforany", function() {
       populateRuleText($(this).parents());
    });
    
    // Changing left hand side of the condition operands
    $(".ruleconditioncomponent").on("change", ".acondition .lhs", function() {
        var lhsId = $(this).children(":selected").attr("value");
        if (labValuePairMap.hasOwnProperty(lhsId)) {
            var pairWith = labValuePairMap[lhsId];
            $(this).parent().children(".rhs").val(pairWith);
        }                                
        populateRuleText($(this).parents());
    });

    // Changing the operator of the condition
    $(".ruleconditioncomponent").on("change", ".acondition .operator", function() {
        var selectedId = $(this).children(":selected").attr("value");
        if (selectedId === CONSTANTS.NOTPRESENT || selectedId === CONSTANTS.PRESENT) {            
            if ($(this).next().attr('class') != 'removecondition')
                $(this).next().hide();
        }
        else {
            $(this).next().show();
        }
        populateRuleText($(this).parents());
    });

    // Changing the right hand side of the condition operands
    $(".ruleconditioncomponent").on("change", ".acondition .rhs", function() {
        var rhsVal = $(this).children(":selected").attr("value");        
        if (rhsVal == CONSTANTS.NUMBERSTRING || rhsVal == CONSTANTS.CONSTANTSTRING) {
            if ($(this).next().prop("nodeName") !== 'INPUT') {
                $("<input type='text' value='0' style='width:50px;margin-left:5px;margin-right:5px'/>").insertBefore($(this).parent().children().last());
                $(this).next().focus();
                $(this).next().select();
            } else if ($(this).next().next().attr("class") === 'rhs') {
                $(this).next().next().remove();
            }
        } else if ( rhsVal == CONSTANTS.MULTIPLESTRING) {
            if ($(this).next().prop("nodeName") !== 'INPUT') {
                $("<input type='text' value='0' class='multiple'/>").insertAfter($(this));
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

    // Changing the rule text based on user input for a condition involving value or multiple
    $(".ruleconditioncomponent").on("change keyup", ".acondition input", function() {
        populateRuleText($(this).parents());
    });
    
    // Reset the rule text
    $(".ruleconditioncomponent").on("click", ".isrulevalid button.clear", function() {
        var obj = $(this).parent().parent().children(".textrule");                          
        obj.html("");
        obj.focus();                
        ruleError(obj);
        $(this).parents(".textandlogicalform").children(" .logicalform").html("");
        $(this).parents(".textandlogicalform").children(".logicalform").append($("#subcategoryTemplate .logicalform").html());
        $(this).parents(".textandlogicalform").find(".removegroupcondition").remove();	                
    });

    // Populate the HTML construct for the selected rule in the EDIT view
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
            generateRuleTemplateFromText(ruleObj, labValueMap, savedRulesJSON);// this function will also populate the lab dictionary in a subroutine            
        }
    });

    // Saving the rule in the ADD flow
    $("#addrule").on("click", ".saveAdd", function() {  // Save Function on adding a new rule
        if (!validateFieldsOnSave("#addrule")) {
            invokeMessage("Errors found when saving!", "FAILURE");
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
        triggerSuccessfulAddition();
    });
    
    // Saving the rule in the EDIT flow
    $("#editrule").on("click", ".saveEdit", function() {  // Save Function
        if (!validateFieldsOnSave("#editrule")) {
            var message = "Errors exist in the rule definition. Please check!"
            invokeMessage(message, "FAILURE");
            //invokeModal(message, "FAILURE");
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
                var rule = $($(obj).find(".textrule")).data("itext");
                var categoryObj = {};
                categoryObj[definition] = rule;
                saveObject[comorbidityName].push(categoryObj);
            }
        } else {
            var obj = $("#editrule .ruleconditioncomponent .ruleconditions").first();
            var rule = $($(obj).find(".textrule")).data("itext");
            saveObject[comorbidityName] = rule;                    
        }
        for (var i = 0; i < savedRulesJSON.length; i++) {
            for (var key in savedRulesJSON[i]) {
                if (currentEditComorb === key) {
                    savedRulesJSON[i] = saveObject;
                }
            }
        }//CANDO beautify successful operation message        
        var message = "Changes saved Successfully!";
        invokeMessage(message, "SUCCESS");        
    });
    
    $(".topmessage .messageclose").mouseover(function() {
        clearTimeout();
    }).click(function() {
        clearTimeout();    
        $(".topmessage").hide();
    })
    
    $(".modalclose").click(function() {
        $("div.modalTemplate").hide();
        $("div.modalTemplate").removeClass("successdiv");
        $("#tabs-container").css({"opacity" : 1});    
        $("body").css({"background-color" : "white"});
    });
    
    $("#editrule").on("click", "button.delete", function() {
        var ruleName = $(".definedrules").find(".selected_edit_rule").html();
        var index = -1;
        for (var i = 0; i < savedRulesJSON.length; i++) {
            for (var key in savedRulesJSON[i]) {
                if (ruleName === key) {
                    index = i;
                }
            }
        }
        if (index >= 0) {
            delete savedRulesJSON[index][ruleName];
            $(".edittab").click();
            invokeMessage("Rule deleted successfully!", "SUCCESS");
        }
        else {
            invokeMessage("Rule deletion failed!", "FAILURE");
        }
    });
}  // end of attachEventHandlers function


var keepOnlyExistsOrNotExistsOperators = function (operatorObj) {
    $(operatorObj).children().remove();
    $(operatorObj).append('<option value="!=-1">is present</option>');
    $(operatorObj).append('<option value="==-1">is not present</option>');
};

var populatePrevDefinedConditionsInLHS = function (lhsObj, otherDefinedRules) {
    var categoriesArr = $(lhsObj).parents(".ruleconditioncomponent").find(".ruleconditions");            
    $(lhsObj).children().remove();
    var curcond = $(lhsObj).parents(".ruleconditions").find(".definition").val();
    for (var i = 0; i < categoriesArr.length; i++) {                
        var conditionStr = $(categoriesArr[i]).find(".definition").val();
        if (curcond == conditionStr)
            break;
        var arr = conditionStr.split(" ");
        var valstr = arr.join("_");  
        $(lhsObj).append('<option value="'+valstr+'">'+conditionStr+'</option>');
    }
    if (config.usePreviouslyDefinedorSavedRules) {
        for (var i = 0; i < otherDefinedRules.length; i++) {
            for (key in otherDefinedRules[i]) {
                var concat_arr = key.split(" ");
                var concatStr = concat_arr.join("_");
                $(lhsObj).append('<option value="'+concatStr+'" class="otherdefined">'+key+'</option>');
                break;
            }
        }
    }            
};

var checkForNodeValueAsPrevDefinedCondition = function (definedRules, nodeValue, conditionName, conditionCategories) {
    for (var i = 0; i < definedRules.length; i++) {
        for (var key in definedRules[i]) {
            if (key === nodeValue) {
                return true;
            }            
            break;
        }
    }
    if (conditionCategories) {
        for (var j = 0; j < conditionCategories.length; j++) {
            for (key in conditionCategories[j]) {
                console.log(key);
                var no_str = nodeValue.split("_").join(" ");
                if (key === no_str) {
                    console.log("here");
                    return true;
                }
            }
            break;
        }
    }
    return false;
};

//This function adds associations (AND / OR) between conditions /group conditions in the HTML form
function addAssociations(anyAll, ruleTemplateObj) {    
    if (anyAll == 'Any') {
        anyAll = 'OR';
    } else {
        anyAll = 'AND';
    }
    var conditionsObj = ruleTemplateObj.children(".conditionclass");
    var prevChild = null;
    var currChild = null;    
    var cachedChildren = conditionsObj.children();
    for (var i = 0; i < cachedChildren.length; i++) {        
        currChild = cachedChildren[i];
        if (prevChild != null ){
            var prevClass = $(prevChild).attr("class");
            var currClass = $(currChild).attr("class");
            if (prevClass=='acondition' && prevClass == currClass) {
                $($(".associationTemplate").html()).insertAfter($(prevChild));
                $(prevChild).next().html(anyAll);
            }
        }
        prevChild = currChild;
    }
    prevChild = null;
    currChild = null;
    cachedChildren = ruleTemplateObj.children();
    //debugger;
    for (var i = 0; i < cachedChildren.length; i++) {
        currChild = cachedChildren[i];
        if (prevChild != null) {
            var prevClass = $(prevChild).attr("class");
            var currClass = $(currChild).attr("class");
            var prevConditionLength = 0;
            if (prevClass == "conditionclass") {
                prevConditionLength = $(prevChild).children(".acondition").length;
            }
            if ((prevClass=='ruleTemplate' && prevClass == currClass) || (prevClass=='conditionclass' && prevConditionLength > 0 && currClass == 'ruleTemplate'))  {
                $($(".associationGroupTemplate").html()).insertAfter($(prevChild));
                $(prevChild).next().html(anyAll);
            }
        }
        prevChild = currChild;
    }        
}

//This function removes associations (AND / OR) between conditions /group conditions present in the HTML form
function removeAssociations(ruleTemplateObj) {
    var conditionsObj = ruleTemplateObj.children(".conditionclass");    
    var cachedChildren = conditionsObj.children();
    var currChild = cachedChildren[0];    
    var nextChild = null;
    var currClass = $(currChild).attr("class");
    if (currClass == 'associationclass' && cachedChildren.length == 1) {
        $(currChild).remove();
    }
    else {
        for (var i = 1; i < cachedChildren.length; i++) {        
            nextChild = cachedChildren[i];
            var nextClass = $(nextChild).attr("class");            
            if (currClass == 'associationclass' && (nextClass == currClass || i == 1)) {
                $(currChild).remove();
            }
            else if (nextClass == 'associationclass' && i == cachedChildren.length - 1) {
                $(nextChild).remove();
                break;
            }
            currChild = cachedChildren[i];
        }
    }
    
    cachedChildren = ruleTemplateObj.children();
    nextChild = null;
    currChild = cachedChildren[0];
    var currClass = $(currChild).attr("class");
    if (currClass == 'associationgroupclass' && cachedChildren.length == 1) {
        $(currChild).remove();
    }
    else {
        for (var i = 1; i < cachedChildren.length; i++) {
            nextChild = cachedChildren[i];            
            var nextClass = $(nextChild).attr("class");            
            if (currClass == 'associationgroupclass' && (nextClass == currClass || i == 1)) {
                $(currChild).remove();
            }
            else if (nextClass == 'associationgroupclass' && i == cachedChildren.length - 1) {
                $(nextChild).remove();
                break;
            }
            currChild = cachedChildren[i];
        }
    }    
}

function invokeMessage(message, status) {    
    if (status == 'SUCCESS') {
        $(".topmessage .message").html(message);
        $(".topmessage").css({"background-color": "#dff0d8", "color" : "#3c763d"});
    }
    else if (status == "FAILURE") {
        $(".topmessage .message").html(message);
        $(".topmessage").css({"background-color": "#f2dede", "color" : "#a94442"});
    }
    $(".topmessage").slideToggle();
    setTimeout(function() {$(".topmessage").slideToggle()}, 3000);
}

function invokeModal(message, kindOfMessage) {
    $(".vieweditright #editrule").hide();
    $("div.modalTemplate").show();
    if (kindOfMessage == 'SUCCESS')
        $("div.modalTemplate").addClass("successdiv");
    $("div#modalmessage").html(message);
    $("#tabs-container").css({"opacity" : 0.1});
    $("body").css({"background-color" : "brown"});
}

function triggerSuccessfulAddition() {//TODO beautify alert
    invokeMessage("Rule Saved Successfully", "SUCCESS");
    $("#addrule .rulename").val("");
    $("#addrule .declaredrule").html("");
    $("#addrule .hassubcategory").prop("checked", "");
    $("#addrule .ruleconditioncomponent .ruleconditions").not(":first").remove();
    $("#addrule .ruleconditions .definition").val("");
    $("#addrule .ruleconditions .textrule").text("");
    $("#addrule .ruleconditions .ruleTemplate").not(":first").remove();
    $("#addrule .acondition").remove();
    $("#addrule .multipreselect").select2("val","");
    organizeOptions(labValues, "#addrule");
    ruleError($("#addrule .textrule"));
}

function validateFieldsOnSave(parentId) {
    $(".nameerror").html("");
    var errorCount = 0;
    if ($(parentId + " .rulename").val() == "" || $(parentId + " .rulename").val().trim() == "") {
        errorCount++;
        $(parentId + " .nameerror").html("incorrect rule name!");
    }
    var ruleConditionsObjArray = $(parentId + " .ruleconditions");
    for (var i = 0; i < ruleConditionsObjArray.length; i++) {
        var definition = $(ruleConditionsObjArray[i]).find(".definition").val();
        if (definition== "" || definition.trim() == "") {
            errorCount++;
            $(ruleConditionsObjArray[i]).find(".nameerror").html("incorrect subcategory name!");
        }
        var ruleconditions = $(ruleConditionsObjArray[i]).find(".acondition");
        if (ruleconditions.length == 0) {
            var html = $(ruleConditionsObjArray[i]).find(".nameerror").html();
            $(ruleConditionsObjArray[i]).find(".nameerror").html(html + "&nbsp;No conditions defined!");
            errorCount++;
        }
    }
    if (errorCount > 0)
        return false;
    return true;
}

// This method populates the LHS and RHS options based on the preselected lab values. If no preselected labvalues are present, then all the lab values are added as options
function organizeOptions(optionsToPopulate, parentId, areOptionsPrePopulatedForEditView) {
    var rhsValues = [];
    //console.log(optionsToPopulate, areOptionsPrePopulatedForEditView)
    $.extend(rhsValues, optionsToPopulate);
    if (!areOptionsPrePopulatedForEditView) {            
        $(".lhs").empty();
        $(".rhs").empty();   
        $.merge(rhsValues, commonSelectors);
    }
    var $selectN = $(".lhs");
    //TODO Duplicate population of selected lab value when selecting another one.
    $.each(optionsToPopulate, function(key, val){
        var found = false;
        $(".lhs > option").each(function() {
            if (this.value == val.id) {
                found = true;
                return false;
            }                
        });
        if (!found)
            $selectN.append('<option value="' + val.id + '">' + val.name + '</option>');                
    });
    $selectN = $(".rhs"); 
    $.each(rhsValues, function(key, val){ 
        var found = false;
        $(".rhs > option").each(function() {
            if (this.value == val.id) {
                found = true;
                return false;
            }                
        });
        if (!found)
            $selectN.append('<option value="' + val.id + '">' + val.name + '</option>');
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
            adjustTextForAnyK($(obj), interpretedRuleText);
            ruleIsFine(obj);
        } catch (err) {
            ruleError(obj);
        }
    }
}

function ruleIsFine(obj) {
    //$(obj).next().find("span").css({"color":"green"}).html("Definition is valid");
    $(obj).css({"border-color":"green"}); 
}

function ruleError(obj) {
    //$(obj).next().find("span").html("Definition is Invalid").css({"color":"red"});
    $(obj).css({"border-color":"red"});            
}

// This function converts the interpreter language into user readable text form which is show above the editable version of the rule
var parseTokensToText = function (interpText) {
    var returnStr = "";
    var retArr = [];
    // In case of Any K type of condition, we need to reiterate and plug in the text at appropriate locations
    var backtrackAndPlugAnyK = function(textArr) {
        var pluggedArr = $.extend(true, [], textArr);
        
        var insertAnyKText = function(curIndex, kvalue, arr) {
            var strStart = "<div><span class='textForAny'>Any "+kvalue+" of </span><br/><span class='textForAny'>(</span><div style='margin-left:50px'>";
            var strEnd = "</div><span class='textForAny'>)</span></div>";
            var itemIn = {"id":"kvalueStart","value":kvalue,"str":strStart};
            var itemOut = {"id":"kvalueEnd","value":kvalue,"str":strEnd};
            var inIndex = -1;
            var outIndex = -1;
            var groupEndOccurred = false;
            for (var i = curIndex - 1; i >= 0; i--) {
                if (arr[i]['id'] === 'kvalueStart') {
                    break;
                }
                if (arr[i]['id'] == "groupend") {
                    groupEndOccurred = true;
                }
                if (arr[i]['id'] ==="groupstart" && !groupEndOccurred) {
                    inIndex = i + 1;                    
                    break;
                }
                if (i == 0) {
                    inIndex = i;
                }
            }
            if (inIndex == 0) {
                outIndex = arr.length - 1;
            }
            if (inIndex > 0) {
                var groupStartOccurred = false;
                for (var i = curIndex + 1; i < arr.length; i++) {
                    if (arr[i]['id'] === 'kvalueEnd') {
                        break;
                    }
                    if (arr[i]['id'] == "groupstart") {
                        groupStartOccurred = true;
                    }
                    if (arr[i]['id'] === 'groupend') {
                        if (groupStartOccurred) 
                            groupStartOccurred = false;
                        else {
                            outIndex = i;
                            break;
                        }
                    }
                    if (i == arr.length - 1) {
                        outIndex = i;
                    }
                }
            }
            if (inIndex >= 0 && outIndex > 0) {
                arr.splice(inIndex, 0, itemIn);
                arr.splice(outIndex + 1, 0, itemOut);
            }
            return arr;
        }
        
        for (var i = 0; i < textArr.length; i++) {
            if (textArr[i].hasOwnProperty("anykvalue")) {
                pluggedArr = insertAnyKText(i, textArr[i]['anykvalue'], pluggedArr);
            }            
        }
        return pluggedArr;
    }
        
    try {                
        var tokens = interpText.split(/\s+/);                 
                
        for (var i = 0; i < tokens.length; i++) {
            var strObj = {};
            var isAnyKTokenBool = /\|\|\d+$/.test(tokens[i]);
            if (labValueMap.hasOwnProperty(tokens[i])) {
                // checking if previous token is a non grouping operator which implies that it is RHS
                // LHS arguments are shown in green and RHS arguments are shown in red
                if ( i > 0 && ( $.inArray(tokens[i - 1], ['>','<','>=','<=']) >= 0)) {
                    strObj = {};
                    strObj["id"] = "rhs";
                    strObj["str"] = "<span style='color:red'>" + labValueMap[tokens[i]] + "</span>"; 
                    retArr.push(strObj);
                } else {
                    strObj = {};
                    strObj["id"] = "lhs";
                    strObj["str"] = "<span style='color:green'>" + labValueMap[tokens[i]] + "</span>";
                    retArr.push(strObj);
                }
            } 
            // checking for operators and translating them to the text form
            else if (operatorMap.hasOwnProperty(tokens[i]) || isAnyKTokenBool) {
                var op = operatorMap[tokens[i]];                        
                if (tokens[i] === '(') {
                    strObj = {};
                    strObj["id"] = "groupstart";
                    strObj["str"] = "<div>" + op.toUpperCase() + "<div style='margin-left:50px'>";
                    retArr.push(strObj);
                } else if (tokens[i] === ')') {
                    strObj = {};
                    strObj["id"] = "groupend";
                    strObj["str"] = "</div>" + op.toUpperCase() + "</div>";
                    retArr.push(strObj);
                }
                else if (tokens[i] === "&&" || tokens[i] === '||' || isAnyKTokenBool) {                    
                    if (tokens[i - 1] != ')') { //Just to save an extra line break in the user visible text form of the rule (can be omitted)
                        strObj = {};
                        strObj["id"] = "andorsupp";
                        strObj["str"] = "<br/>";
                        retArr.push(strObj);
                    }
                    strObj = {};
                    strObj["id"] = "andor";
                    if (isAnyKTokenBool) {
                        op = operatorMap['||'];
                        var num = tokens[i].split("||")[1]; // argument in anyK
                        strObj["anykvalue"] = num;
                    }                    
                    strObj["str"] = op.toUpperCase()+"<br/>";
                    retArr.push(strObj);
                }
                else if (tokens[i] === '==-1' || tokens[i] === '!=-1') {
                    strObj = {};
                    strObj["id"] = "presentnotpresent";
                    strObj["str"] = op;
                    retArr.push(strObj);
                }
                else {
                    strObj = {};
                    strObj["id"] = "none";
                    strObj["str"] = op;
                    retArr.push(strObj);
                }
            }
            else {
                strObj = {};
                strObj["id"] = "value";
                var dispStr = tokens[i];
                if (/_/.test(dispStr)) { // Underscores in token imply that can be one of the previously defined comorbidities or comorbidity condition
                    var arr = dispStr.split("_");
                    dispStr = arr.join(" ");
                }
                strObj["str"] = "<span style='color:brown'>" + dispStr + "</span>";
                retArr.push(strObj);            
            }
            strObj = {};
            strObj["id"] = "space";
            strObj["str"] = " ";
            retArr.push(strObj);
        }
    } catch (err) {
        returnStr = err;
    }
    returnStr = "";
    retArr = backtrackAndPlugAnyK(retArr);
    for (var i = 0; i < retArr.length; i++) {
        returnStr += retArr[i]["str"];
    }
    return returnStr;
};



// This function has a recursive method implementation to construct the rule HTML from the interpreter text for edit view
var parseTokensToHTML = function (interpText, labValuesMap, definedRules, currentName, currentSubCategories) {
    var tokens = lexer (interpText);
    console.log(tokens);
    var parseTree = parse(tokens);
    var node = parseTree[0];// for one comorb rule there will be only one parse tree            
    var parent = $("#editrule div.ruleconditions:last div.logicalform div.ruleTemplate:last p:first");
    /* 
      node : Current node
      addCondition : whether the current node should create a new condition template
      identifierOnWhichSide: indicator of whether the node should be on LHS or RHS
      isFirst : whether it is the very first node or not.
      multipleMode : Whether current node is part of a condition of the form similar to  LEFT < currentnode.value * RIGHT
    */
    var recurseNode = function(node, parent, addcondition, identifierOnWhichSide, isFirst, multipleMode) {   
        if (!node)
            return;                            
        var conditionAppend = false;                
        if (node.hasOwnProperty("group") ) {
            if (node.type === '||' || node.type === '&&') {
                var tempParent = parent;
                if ($(tempParent).prop("nodeName") === 'P') { // checking for paragraph which only has individual conditions
                    tempParent = $(tempParent).parent();
                }
                $(tempParent).append($("#subcategoryTemplate .logicalform").html());                        
                if (node.type == "||") {                        
                    $(tempParent).find("select.anyall:last").val("Any");
                    var anyStr = "<input type='number' value='"+node.value+"' min='1' class='inputforany'></input>";                    
                    $(anyStr).insertAfter($(tempParent).find("select.anyall:last"));
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
            var anyStr = "<input type='number' value='"+node.value+"' min='1' class='inputforany'></input>";                                
            $(tempParent).find("select.anyall:last").val("Any");
            $(anyStr).insertAfter($(tempParent).find("select.anyall:last"));
        }                  
        else if ($.inArray(node.type, ['&&','||','identifier','*'])  == -1 && multipleMode == 0){
            conditionAppend = true;
        }
        if (identifierOnWhichSide === 'LEFT') {
            if (multipleMode == 1 && node.type == 'number') { // special case for multiplication
                $(parent).find(".acondition:last input").val(node.value);
            } else {
                if (labValuesMap.hasOwnProperty(node.value)) {
                    $(parent).find(".acondition:last .lhs").val(node.value);
                }
                else if (checkForNodeValueAsPrevDefinedCondition(definedRules, node.value, currentName, currentSubCategories)) {
                    populatePrevDefinedConditionsInLHS($(parent).find(".acondition:last .lhs"), definedRules);
                    $(parent).find(".acondition:last .lhs").val(node.value);
                }
            }
        }
        else if (identifierOnWhichSide === 'RIGHT') {
            if (node.type === CONSTANTS.NUMBERSTRING || node.type === CONSTANTS.CONSTANTSTRING) {// special case for numerical input
                $(parent).find(".acondition:last .rhs").val(node.type);
                var inputTextBox = "<input type='text' value="+node.value+"/>"
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
            if (node.type !== 'identifier' && node.type !== 'number' && node.type !== '*' && node.type !== 'constant') {
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
    if (config.displayAssociations) {
        var subs = $("#editrule div.ruleconditions");
        for (var i = 0; i < subs.length; i++) {
            var subconds = $(subs[i]).find("div.ruleTemplate");
            for (var j = 0; j < subconds.length; j++) {
                var anyAll = $(subconds[j]).children(".groupclass").children(".anyall").first().val();
                addAssociations(anyAll, $(subconds[j]));
            }
        }
    }    
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

// This method is used in the edit view to create the html template based on a rule definition obtained from the saved/defined rules - This is used in EDIT flow
var generateRuleTemplateFromText = function(ruleObj, labValues, savedRules) {
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
        }
        break;
    }
    populateLabDictionary(subCategories, hasSubCategories, subCategoriesCount, "#editrule");
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
                $("#editrule .ruleconditions:last .textrule").data("itext", ruleStr); // set data attribute for the textrule
                ruleStr = parseTokensToText(ruleStr);// converting the interpreter text to english text 
                $("#editrule .ruleconditions:last .textrule").html(ruleStr).css({"borderColor":"green"});
                $("#editrule .ruleconditions:last .isrulevalid").html("");
                parseTokensToHTML(subCategories[j][key], labValues, savedRules, comorbidityName, subCategories);
                if (!config.editview_showlogicalbydefault) {
                    $("#editrule .ruleconditions:last .logicalform").hide();    
                    $("#editrule .ruleconditions:last .showlogicalform").show();
                }
                break;
            }
            isFirstOne = false;
        }
    } else {
        $("#editrule .hassubcategory").prop("checked", "");
        $("#editrule .addAnother").hide();
        addSubCategory($("#editrule"), true);
        var ruleStr = subCategories;
        $("#editrule .ruleconditions:last .definition").val(comorbidityName);
        $("#editrule .ruleconditions:last .definition").prop("disabled", "disabled");
        $("#editrule .ruleconditions:last .textrule").data("itext", ruleStr); // set data attribute for the textrule
        ruleStr = parseTokensToText(ruleStr); // converting the interpreter text to english text 
        $("#editrule .ruleconditions:last .textrule").html(ruleStr).css({"borderColor":"green"});
        $("#editrule .ruleconditions:last .isrulevalid").html("");
        parseTokensToHTML(subCategories, labValues, savedRules); // constructing the conditional builder HTML through this method
        if (!config.editview_showlogicalbydefault) {
            $("#editrule .ruleconditions:last .logicalform").hide();
            $("#editrule .ruleconditions:last .showlogicalform").show();
        }
    }
};

function getLabValuesFromTokens(labPreselectOptions, auxDict, tokens) {
    for (var i = 0; i < tokens.length; i++) {                 
        if (labValueMap.hasOwnProperty(tokens[i])) {            
            if (auxDict.indexOf(tokens[i]) < 0) {
                auxDict.push(tokens[i]);
                labPreselectOptions.push({"id" : tokens[i], "name" : labValueMap[tokens[i]]});
            }
        }
    }
    return labPreselectOptions;
}

function populateLabDictionary(subCategories, hasSubCategories, subCategoriesCount, parentId) {
    var labDict = [];
    var auxDict = []; // stores only the ids of the lab values (used for removing duplicates)
    if (hasSubCategories) {
        for (var i = 0; i < subCategoriesCount; i++) {
            for (key in subCategories[i]) {
                var ruleStr = subCategories[i][key];
                var tokens = ruleStr.split(/\s+/);
                getLabValuesFromTokens(labDict, auxDict, tokens); // passing labDict as reference to update the data structure
                break;
            }
        }
    }
    else {
        var ruleStr = subCategories;
        var tokens = ruleStr.split(/\s+/); 
        getLabValuesFromTokens(labDict, auxDict, tokens);
    }
    preselectedOptions = labDict;
    organizeOptions(labDict, "#editrule");
    $("#editrule .multipreselect").select2().val(auxDict).trigger("change");    
}

function getRuleString(obj) {
    //var str = ""; // stores the verbose (expanded) form the of rule definition
    var interpreterString = ""; // stores the code form (the one which is interpreted later) of the rule definition

    var groupObj = $(obj).children(".groupclass").first();// groupclass div  
    var andOr = $(groupObj).find("select.anyall").val();
    var andOrIntepreter =  (andOr === 'Any')?" || " : " && ";
    if (andOr === 'Any') {
        var anyKval = $(groupObj).find(".inputforany").val();
        if (anyKval > 1)
            andOrIntepreter = " ||"+ anyKval+" ";
    }
    var conditions = $(obj).children(".groupclass").first().next().find(".acondition"); // conditions defined in conditionclass div
    var conditionsLength = conditions.length;
    var counter = 0;
    $(conditions).each(function() {        
        var operatorid = $(this).find(".operator").children(":selected").attr("value");
        interpreterString +=  $(this).find(".lhs").children(":selected").attr("value") + " ";
        interpreterString += operatorid + " ";
        if (operatorid !== CONSTANTS.NOTPRESENT && operatorid !== CONSTANTS.PRESENT) {
            var rhsid = $(this).find(".rhs").children(":selected").attr("value");                                
            if ( rhsid === CONSTANTS.NUMBERSTRING || rhsid === CONSTANTS.CONSTANTSTRING) {
                if (rhsid === CONSTANTS.NUMBERSTRING) {
                    var numericalValue = $(this).find(".rhs").next().val();
                    //str += numericalValue + " ";
                    interpreterString += numericalValue + " ";
                }
                else {
                    var textValue = $(this).find(".rhs").next().val();
                    interpreterString += "'" + textValue + "' ";
                }
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