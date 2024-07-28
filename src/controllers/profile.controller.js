const { SuccessResponse } = require("../core/success.response");

const dataProfiles = [
  {
    usr_id: 1,
    usr_name: "CR7",
    usr: "image.com/user/1",
  },
  {
    usr_id: 2,
    usr_name: "M10",
    usr: "image.com/user/2",
  },
  {
    usr_id: 3,
    usr_name: "TIPsJS",
    usr: "image.com/user/3",
  },
];

class ProfileController {
  //admin
  profiles = async (req, res, next) => {
    new SuccessResponse({
      message: "view all profiles",
      metadata: dataProfiles,
    }).send(res);
  };

  //shop

  profile = async (req, res, next) => {
    new SuccessResponse({
      message: "view one profile",
      metadata: {
        usr_id: 2,
        usr_name: "M10",
        usr: "image.com/user/2",
      },
    }).send(res);
  };
}

module.exports = new ProfileController();
