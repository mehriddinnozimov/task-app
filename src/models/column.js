const mongoose = require("mongoose")
const findOrCreate = require("mongoose-findorcreate")

const Task = require("./task")

const columnS = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        require: true,
        ref: "User"
    }
})

//agar columnning owneri boshqa bo`lsa unique false bo`ladigan kod

columnS.plugin(findOrCreate)

columnS.pre("remove", async function(next){
    await Task.deleteMany({father: this._id})
    next()
})


let Column = new mongoose.model("Column", columnS)


module.exports = Column;