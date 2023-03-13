"use strict";

const mongoose = require("mongoose");

const connectString =
  "mongodb+srv://phamhuuhoang99:HuuHoang01645318330@cluster0.2vfzw.mongodb.net/shopDEV?retryWrites=true&w=majority";
mongoose
  .connect(connectString)
  .then((_) => console.log("Connected MongoDB success"))
  .catch((err) => console.log("Error Connect"));

//dev
if (1 === 1) {
  mongoose.set("debug", true);
  mongoose.set("debug", { color: true });
}

module.exports = mongoose;
