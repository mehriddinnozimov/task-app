const jwt = require("jsonwebtoken")
const User = require("../models/user")

module.exports = async function(req, res, next){
    try {
        let token = req.header("Authorization").replace("Bearer ", "");
        let decoded = await jwt.verify(token, process.env.JWT_SECRET)
        
        let user = await User.findOne({_id: decoded._id, "tokens.token": token});
        if(!user) throw new Error();
        req.user = user;
        req.token = token;
        req.logout = async () => {
            req.user.tokens = req.user.tokens.filter((tok) => req.token != tok.token);
            await req.user.save()
            delete req.user
            delete req.token
        }
        next()
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "auth failed"
            }
        })
    }
    
    
}