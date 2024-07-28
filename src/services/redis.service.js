const redis = require("redis");

const { promisify } = require("util");
const { reservationInventory } = require("../models/repository/inventory.repo");
const { getRedis } = require("../dbs/init.redis");
const { instanceConnect: redisClient } = getRedis();

// const pexpire = promisify(redisClient.PEXPIRE).bind(redisClient);

// const setnxAsync = promisify(redisClient.SETNX).bind(redisClient);

// const acquireLock = async (productId, quantity, cartId) => {
//   const key = `lock_2023_${productId}`;
//   const retryTimes = 10;
//   const expireTime = 3000; //3s lock

//   for (let i = 0; i < retryTimes.length; i++) {
//     // const element = retryTimes[i];
//     //tao 1 key, ai co thi vao
//     const result = await setnxAsync(key, expireTime);
//     if (result === 1) {
//       //Thao tac vs inventory
//       const isReversation = await reservationInventory({
//         productId,
//         quantity,
//         cartId,
//       });
//       if (isReversation.modifiedCount) {
//         await pexpire(key, expireTime);
//         return key;
//       }
//       return null;
//     } else {
//       await new Promise((resolve) => setTimeout(resolve, 50));
//     }
//   }
// };

// const releaseLock = async (keyLock) => {
//   const delAsyncKey = promisify(redisClient.del).bind(redisClient);
//   return await delAsyncKey(keyLock);
// };

// module.exports = {
//   acquireLock,
//   releaseLock,
// };
