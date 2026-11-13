"use strict";

var CryptoJS = require("crypto-js");

function wordArrayOf(buffer) {
  return CryptoJS.enc.Hex.parse(Buffer.from(buffer).toString("hex"));
}

function bufferOf(wordArray) {
  return Buffer.from(wordArray.toString(CryptoJS.enc.Hex), "hex");
}

function createCipheriv(algorithm, key) {
  var keyWordArray = wordArrayOf(key);
  var chunks = [];
  return {
    update: function (data) {
      if (data && data.length) chunks.push(Buffer.from(data));
      return Buffer.alloc(0);
    },
    final: function () {
      var input = Buffer.concat(chunks);
      var output = CryptoJS.TripleDES.encrypt(wordArrayOf(input), keyWordArray, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      });
      return bufferOf(output.ciphertext);
    }
  };
}

function createDecipheriv(algorithm, key) {
  var keyWordArray = wordArrayOf(key);
  var chunks = [];
  return {
    update: function (data) {
      if (data && data.length) chunks.push(Buffer.from(data));
      return Buffer.alloc(0);
    },
    final: function () {
      var input = Buffer.concat(chunks);
      var ciphertext = wordArrayOf(input);
      var output = CryptoJS.TripleDES.decrypt(
        { ciphertext: ciphertext },
        keyWordArray,
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
      );
      return Buffer.from(output.toString(CryptoJS.enc.Utf8), "utf8");
    }
  };
}

function createHash(algorithm) {
  var chunks = [];
  return {
    update: function (data) {
      chunks.push(Buffer.from(data));
      return this;
    },
    digest: function (encoding) {
      var digest = CryptoJS.MD5(wordArrayOf(Buffer.concat(chunks)));
      return encoding === "hex" ? digest.toString(CryptoJS.enc.Hex) : bufferOf(digest);
    }
  };
}

function randomBytes(size) {
  var buffer = Buffer.alloc(size);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    for (var i = 0; i < size; i++) buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
}

module.exports = {
  createCipheriv: createCipheriv,
  createDecipheriv: createDecipheriv,
  createHash: createHash,
  randomBytes: randomBytes
};
