"use strict";

const mongoose = require("mongoose");
const os = require("os");
const process = require("process");
const _SECONDS = 5000;

const countConnect = () => {
  const numberConnection = mongoose.connections.length;

  console.log(`Number of connection ${numberConnection}`);
};

const checkOverload = () => {
  setInterval(() => {
    const numberConnection = mongoose.connections.length;
    const numCores = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;

    //example maximum number of connections based on number osf cores
    const maxConnection = numCores * 5;

    console.log(`Active connections:${numberConnection}`);
    console.log(`Memory usage:: ${memoryUsage / 1024 / 1024} MB`);

    if (numberConnection > maxConnection) {
      console.log(`Connection overload detected`);

      //notify.send
    }
  }, _SECONDS); //Monitor every 5s
};

module.exports = {
  countConnect,
  checkOverload,
};
