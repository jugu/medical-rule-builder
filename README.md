# medical-rule-builder

Demo available at https://jugu.github.io/medical-rule-builder/

To run the code locally

1. Install Node (https://nodejs.org/en/)
2. Run the command: node ruleserver.js
3. Open the application in browser at: <b>http://localhost:3000/medical-rule-builder/index.html</b> (port may vary)

(The only libraries/plugins used are JQuery and select2)
This is an online rule builder tool. Currently customized for dynamically creating/editing rules for illnesses/diseases. This can be used to create any kind of rule definitions and/or for building queries. 

The interpreter is inspired by Douglas Crockford's Top Down Operator Precedence parser
http://javascript.crockford.com/tdop/tdop.html 

---

### Features

* _Build rules with AND and OR associations_
* _Build rules of the type Any 2/Any 3/.../Any k , where only a particular number of conditions may be true_
* _Build rules using previously defined subconditions_
* _Build rules using previously defined rules_
* _Test the rules_
* _Export the rules with the interpreter text in JSON format_

---



Also in the pipeline is an easy way to import your own set of query parameters, then build rules on top of them, and finally execute the rules based on parameter values to view the results.

