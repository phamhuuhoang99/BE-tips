"use strict";

const shopModel = require("../models/shop.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const { findByEmail } = require("./shop.service");
const {
  findByRefreshToken,
  findByRefreshTokenUsed,
} = require("./keyToken.service");

const RoleShop = {
  SHOP: "SHOP",
  WRITER: "WRITER",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
};

class AccessService {
  static handlerRefreshTokenV2 = async ({ refreshToken, user, keyStore }) => {
    //
    const { userId, email } = user;

    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened!! pls relogin ");
    }

    if (keyStore.refreshToken !== refreshToken) {
      throw new AuthFailureError("Shop not registered");
    }

    //check userId
    const foundShop = await findByEmail({ email });
    if (!foundShop) throw new AuthFailureError("Shop not registered");

    // created 1 cap token mới
    const tokens = await createTokenPair(
      { userId, email },
      keyStore.publicKey,
      keyStore.privateKey
    );

    //update token
    await keyStore.update({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, //
      },
    });

    return {
      user,
      tokens,
    };
  };
  static handlerRefreshToken = async (refreshToken) => {
    const foundToken = await findByRefreshTokenUsed(refreshToken);

    console.log(`foundToken:::`, foundToken);

    if (foundToken) {
      //decode xem là ai?
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );

      console.log(userId, email);
      //xóa
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened!! pls relogin ");
    }
    // kiểm tra có đúng refresh token đang sử dụng ko
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);

    if (!holderToken) throw new AuthFailureError("Shop not registered");

    console.log(`holderToken:::`, holderToken);
    //verify Token
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );
    //check userId
    const foundShop = await findByEmail({ email });
    if (!foundShop) throw new AuthFailureError("Shop not registered");

    // created 1 cap token mới

    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    //update token
    await holderToken.update({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, //
      },
    });

    return {
      user: { userId, email },
      tokens,
    };
  };

  static logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id);
    return delKey;
  };

  static login = async ({ email, password, refreshToken = null }) => {
    const foundShop = await findByEmail({ email });

    if (!foundShop) {
      throw new BadRequestError("Shop not registered");
    }

    const match = bcrypt.compare(password, foundShop.password);
    if (!match) {
      throw new AuthFailureError("Authentication Error");
    }

    //3.
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    //4. generate tokens
    const { _id: userId } = foundShop;
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
      userId,
    });

    return {
      shop: getInfoData({
        fields: ["_id", "name", "email"],
        object: foundShop,
      }),
      tokens,
    };
  };

  static signUp = async ({ name, email, password }) => {
    // try {
    //step1: check email existed?
    const holderShop = await shopModel.findOne({ email }).lean();

    if (holderShop) {
      // return {
      //   code: "xxxx",
      //   message: "Shop already registered",
      // };

      throw new BadRequestError("Error: Shop already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    });

    if (newShop) {
      // created privateKey, publicKey
      // const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      //   modulusLength: 4096,
      //   publicKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },
      //   privateKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },
      // });

      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      //public key  Cryto Standards

      // console.log({ privateKey, publicKey });

      //save collection KeyStore
      const keyStore = await KeyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey,
      });

      if (!keyStore) {
        // return {
        //   code: "xxxx",
        //   message: "keyStore Error",
        // };
        throw new BadRequestError("keyStore Error");
      }

      //created token pair
      // const publicKeyObject = crypto.createPublicKey(publicKeyString);

      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      );

      console.log(`Created Token Success::`, tokens);
      return {
        code: 201,
        metadata: {
          shop: getInfoData({
            fields: ["_id", "name", "email"],
            object: newShop,
          }),
          tokens,
        },
      };
      // const tokens = await
    }
    return {
      code: 200,
      metadata: null,
    };
    // } catch (error) {
    //   return {
    //     code: "xxx",
    //     message: error.message,
    //     status: "error",
    //   };
    // }
  };

  //level=0
  static fetchWithRetry = async (url = "https://anonystick.com") => {
    const response = await fetch(url);
    return response;
  };

  //level > 0
  static fetchWithRetry = async (url = "https://anonystick.com") => {
    const response = await fetch(url);
    if (response.status < 200 || response.status >= 300) {
      await this.fetchWithRetry(url);
    }
    return response;
  };

  // level > 2
  static fetchWithRetry = async (url = "https://anonystick.com") => {
    const response = await fetch(url);
    if (response.status < 200 || response.status >= 300) {
      setTimeout(async () => {
        await this.fetchWithRetry(url);
      }, 3000);
    }
    return response;
  };
  //level > 3
  //backoff
  static fetchWithRetry = async (
    url = "https://anonystick.com",
    errCount = 0
  ) => {
    const ERROR_COUNT_MAX = 3;
    const response = await fetch(url);
    if (response.status < 200 || response.status >= 300) {
      if (errCount < ERROR_COUNT_MAX) {
        setTimeout(async () => {
          await this.fetchWithRetry(url, errCount + 1);
        }, Math.pow(2, errCount) * 3000 + Math.random() * 1000);
      }
    }
    return response;
  };
}
module.exports = AccessService;
