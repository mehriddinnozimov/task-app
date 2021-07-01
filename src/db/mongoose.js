const mongoose = require("mongoose")

const url = process.env.M_URL
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}, () => {
    console.log("mongodbga ulandi")
});