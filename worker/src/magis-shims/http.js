"use strict";

var createTransport = require("./transport").createTransport;
var transport = createTransport("http:");

module.exports = transport;
