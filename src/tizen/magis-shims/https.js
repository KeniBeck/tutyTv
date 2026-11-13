"use strict";

var createTransport = require("./transport").createTransport;
var transport = createTransport("https:");

module.exports = transport;
