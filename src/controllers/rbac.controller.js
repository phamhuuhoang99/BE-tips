const { SuccessResponse } = require("../core/success.response");
const {
  createRole,
  createResource,
  roleList,
  resourceList,
} = require("../services/rbac.service");
/**
 * @desc Create a new role
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

const newRole = async (req, res, next) => {
  new SuccessResponse({
    message: "created role",
    metadata: await createRole(req.body),
  }).send(res);
};

const newResource = async (req, res, next) => {
  new SuccessResponse({
    message: "created resource",
    metadata: await createResource(req.body),
  }).send(res);
};

const listRoles = async (req, res, next) => {
  new SuccessResponse({
    message: "get list roles",
    metadata: await roleList(req.body),
  }).send(res);
};

const listResources = async (req, res, next) => {
  new SuccessResponse({
    message: "get list resource",
    metadata: await resourceList(req.body),
  }).send(res);
};

module.exports = {
  newRole,
  newResource,
  listRoles,
  listResources,
};
