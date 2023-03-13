const mongoose = require("mongoose");

// const {
//   db: { host, name, port },
// } = require("../configs/config.mongodb.js");

const connectString =
  "mongodb+srv://phamhuuhoang99:HuuHoang01645318330@cluster0.2vfzw.mongodb.net/shopDEV?retryWrites=true&w=majority";

const { countConnect } = require("../helpers/check.connect");
class Database {
  constructor() {
    this.connect();
  }

  //connect
  connect(type = "mongodb") {
    if (1 === 1) {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }

    mongoose
      .connect(connectString, {
        maxPoolSize: 50,
      })
      .then((_) => console.log("Connected MongoDB success"), countConnect())
      .catch((err) => console.log("Error Connect"));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongoDB = Database.getInstance();

module.exports = instanceMongoDB;
