const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const Column = require("./column");

const userS = new mongoose.Schema({
    name: {
        type: String,
        required: true,

    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(val) {
            if(!validator.isEmail(val)) throw new Error("Is'nt email!");
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7
    },
    avatar: {
        type: Buffer
    },
    isAllow : [{
        type: mongoose.Schema.ObjectId,
        required: true
    }],
    tokens : [{
        token: {
            type: String,
            required: true
        }
    }]
},{
    timestamps: true
})

userS.methods.gAT = async function() {
    let token = await jwt.sign({_id: this._id.toString()}, process.env.JWT_SECRET);
    this.tokens = this.tokens.concat({token})
    await this.save();
    return token;
}

userS.methods.toJSON = function(){
    let user = this.toObject();
    delete user.password;
    delete user.tokens;
    delete user.avatar;
    delete user.isAllow
    return user;
}

userS.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    let isM = await bcrypt.compare(password, user.password);
    if(!user || !isM) throw new Error("Unable to login");

    return user;
}

userS.pre("save", async function(next) {
    if(this.isModified("password")) this.password = await bcrypt.hash(this.password, 8);
    next()
})

userS.pre("remove", async function(next){
    let users = await User.find()
    users.forEach(async (user) => {
        user.isAllow = user.isAllow.filter(val => val.toString() != this._id.toString())
        await user.save()
    })
    await Column.deleteMany({owner: this._id})
    next()
})


const User = new mongoose.model("User", userS)


module.exports = User