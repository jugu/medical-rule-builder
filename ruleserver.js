/**
 * @author Jugu Dannie Sundar <jugu [dot] 87 [at] gmail [dot] com>
 */
var express = require("express");
var app = express();
app.use(express.static("./")).listen(3000);
module.exports = app;
