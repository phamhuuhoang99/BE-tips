"use strict";
// const redis = require("redis");

// const client = redis.createClient({
//   host,
//   port,
//   password,
//   username,
// });

// client.on("error", (err) => {
//   console.error("Redis Client Error", err);
// });

// // export

// module.exports = client;

const redis = require("redis");
const { RedisErrorResponse } = require("../core/error.response");

let client = {},
  statusConnectRedis = {
    CONNECT: "connect",
    END: "end",
    READY: "ready",
    RECONNECT: "reconnect",
    ERROR: "error",
  },
  connectionTimeout;

const REDIS_CONNECT_TIMEOUT = 10000,
  REDIS_CONNECT_MESSAGE = {
    code: -99,
    message: {
      vn: "Redis loi roi",
      en: "Service connect error",
    },
  };

const handleErrorTimeout = () => {
  connectionTimeout = setTimeout(() => {
    throw new RedisErrorResponse({
      message: REDIS_CONNECT_MESSAGE.message.vn,
      statusCode: REDIS_CONNECT_MESSAGE.code,
    });
  }, REDIS_CONNECT_TIMEOUT);
};
const handleEventConnection = (connectionRedis) => {
  connectionRedis.on(statusConnectRedis.CONNECT, () => {
    console.log("Redis Client Connected");
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on(statusConnectRedis.END, () => {
    console.log("Redis Client Disconnected");
    //connect retry
    handleErrorTimeout();
  });

  connectionRedis.on(statusConnectRedis.RECONNECT, () => {
    console.log("Redis Client Reconnected");
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on(statusConnectRedis.ERROR, (err) => {
    console.error("Redis Client Error", err);
    handleErrorTimeout();
  });
};
const initRedis = () => {
  const instanceRedis = redis.createClient();

  client.instanceConnect = instanceRedis;
  handleEventConnection({
    connectionRedis: instanceRedis,
  });
};

const getRedis = () => client;
const closeRedis = (client) => {
  client.quit();
};

module.exports = { initRedis, getRedis, closeRedis };
