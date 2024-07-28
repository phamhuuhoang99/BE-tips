"use strict";

const { AuthFailureError } = require("../core/error.response");
const { roleList } = require("../services/rbac.service");
const rbac = require("./role.middleware");

/**
* @param {string} action // read, delete, update
* @param {string} resource // profile, balancer...
* @return {boolean} Returns true if the action is allowed for the resource, false otherwise.

**/

const grantAccess = (action, resource) => {
  return async (req, res, next) => {
    try {
      rbac.setGrants(
        await roleList({
          userId: 9999,
        })
      );
      const rol_name = req.query.role;
      const permission = rbac.can(rol_name)[action][resource];
      if (!permission.granted) {
        throw new AuthFailureError("you dont have permission");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { grantAccess };
