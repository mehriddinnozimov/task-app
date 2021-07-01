const mongoose = require("mongoose")

const taskS = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 140
    },
    completed: {
        type: Boolean,
        default: false
    },
    father : {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "Column"
    },
    comments: [{
        message: {
            type: String,
            required: true
        },
        from: {
            type: mongoose.Schema.ObjectId,
            required: true,
            ref: "User"
        }
    }]
},
{
    timestamps: true
})

let Task = new mongoose.model("Task", taskS)


module.exports = Task;