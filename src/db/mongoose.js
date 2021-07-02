const mongoose = require("mongoose")

const url = process.env.M_URL
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true}, () => {
    console.log("mongodbga ulandi")
});