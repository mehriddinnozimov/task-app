const ex = require("express");
const multer = require("multer")
const sharp = require("sharp")

const User = require("../models/user")
const Column = require("../models/column")
const Task = require("../models/task")
const auth = require("../middleware/auth")

const router = new ex.Router()

router.post("/sign", async (req, res)=> {
    const user = new User(req.body)
    try {
        await user.save();
        const token = await user.gAT()
        res.json({
            success: true,
            data: {
                message: "Sign successfull",
                user: user,
                token: token
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Sign failed",
                err: e
            }
        })
    }
})

router.post("/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.gAT()
        
        res.json({
            success: true,
            data: {
                message: "Login successfull",
                user: user,
                token: token
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Login failed",
                err: e
            }
        })
    }

})

let upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) return cb(new Error("please upload a jpg/jpeg/png"), undefined);
        cb(undefined, true)
    }
})

router.get("/all", auth, async (req, res) => {
    let users = await User.find().sort({createdAt:-1})

    res.json({
        success: true,
        data: {
            users: users
        }
    })
})


router.get("/me",auth, async (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    })
})

router.get("/me/logout", auth, async (req, res) => {
    try {
        req.logout()
        res.json({
            success: true,
            data: {
                message: "Tizimdan chiqildi"
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Tizimdan chiqish amalga oshmadi",
                err: e
            }
        })
    }
    
})

router.put("/me", auth, async (req, res) => {
    try {
        let updates = Object.keys(req.body)
        let allow = ["name", "password", "email"];
        if(!updates.every(update => allow.includes(update))) throw new Error()
        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()
        res.json({
            success: true,
            data: {
                message: "O`zgartirish amalga oshirildi",
                user: req.user
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                messsage: "O`zgartirish amalga oshmadi",
                err: e
            }
        })
    }
})

router.delete("/me",auth,  async (req, res) => {
    try {
        await req.user.remove()
        res.json({
            success: true,
            data: {
                message: "foydalanuvchi o`chirildi"
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "O`chirish amalga oshmadi",
                err: e
            }
        })
    }

})

router.get("/:id", auth, async (req, res) => {
    try {
        let user = await User.findById(req.params.id)
        if(!user) throw new Error()
        res.json({
            success: true,
            data: {
                user: user
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Foydalanuvchi mavjud emas",
                err: e
            }
        })
    }
    
})

router.get("/:id/tasks", auth, async (req, res) => {
    try {
        let user = await User.findById(req.params.id)
        if(!user || !user.isAllow.some(id => id.toString() == req.user._id.toString())) {
            if(user._id.toString() == req.user._id.toString()) return res.redirect("/user/tasks");
            throw new Error();
        }
        let column = await Column.find({owner: user._id})
        if(column.length < 1) return res.json({
            success: true,
            data: {
                message: "Mavjud emas"
            }
        })
        let tasks = []
        column.forEach(async (val, i) => {
            let task = await Task.find({father: val._id})
            if(!task) throw new Error()
            tasks.push({
                father: val.title,
                tasks: task
            })
            if(column.length - 1 == i) {
                res.json({
                    success: true,
                    data: {
                        tasks: tasks
                    }
                })
            }   
        }) 
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Foydalanuvchi topilmadi, yoki foydalanuvchi sizga o`z tasklarini ko`rishga ruhsat bermagan",
                err: e
            }
        })
    }
})

router.get("/:id/tasks/:taskId", auth, async (req, res) => {
    try {
        let user = await User.findById(req.params.id)
        if(!user || !user.isAllow.some(id => id.toString() == req.user._id.toString())) throw new Error();
        let task = await Task.findById(req.params.taskId)
        if(!task) throw new Error;

        res.json({
            success : true,
            data : {
                task
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Bunday task mavud emas, yoki siz buni ko`ra olmaysiz",
                err: e
            }
        })
    }
})
router.post("/:id/tasks/:taskId/comment", auth, async (req, res) => {
    try {
        let user = await User.findById(req.params.id)
        if(!user || !user.isAllow.some(id => id.toString() == req.user._id.toString())) {
            if(req.user._id.toString() !== req.params.id) throw new Error();
        }
        if(req.user._id.toString() == req.params.id) user = req.user; 
        let task = await Task.findById(req.params.taskId)
        if(!task) throw new Error;
        task.comments.push({
            message: req.body.message,
            from: user._id
        })
        await task.save()
        res.redirect("/user/" + req.params.id + "/tasks/" + req.params.taskId)
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "siz bu taskga comment qo`sha olmaysiz",
                err: e
            }
        })
    }
})

router.get("/:id/forbitme", auth, async (req, res) => {
    try {
        let user = await User.findById(req.params.id)
        if(!user) throw new Error();
        if(!req.user.isAllow.some(id => id.toString() == user._id.toString())) 
            return res.json({
                success: true,
                data: {
                    message: "bu foydalanuvchi shundoq ham sizni tasklaringizni ko`rolmaydi"
                }
            })
        req.user.isAllow = req.user.isAllow.filter(id => id.toString() != user._id.toString())
        await req.user.save()

        res.json({
            success: true,
            data: {
                message: "foydalanuvchi sizning tasklaringizni ko`ra olmaydi"
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "foydalanuvchini qo`shishda muammo yuzaga keldi",
                err: e
            }
        })
    }
})

router.get("/:id/allowme", auth, async (req, res) => {
    try {
        let user = await User.findById(req.params.id)
        if(!user) throw new Error();
        if(req.user.isAllow.some(id => id.toString() == user._id.toString())) 
            return res.json({
                success: true,
                data: {
                    message: "foydalanuvchi allaqachon sizning tasklaringizni ko`ra oladi"
                }
        })
        req.user.isAllow.push(user._id)
        await req.user.save()

        res.json({
            success: true,
            data: {
                message: "foydaluvchi endi sizning tasklaringizni ko`rishi mumkin"
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "foydalanuvchini qo`shishda muammo yuzaga keldi",
                err: e
            }
        })
    }

})

router.post("/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    let buffer = await sharp(req.file.buffer).resize({width:100, height:100}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.json({
        success: true,
        user: req.user
    })
}, (err, req, res, next) => {
    res.json({
        success: false,
        data: {
            message: "Rasm yuklanishida muammo yuzaga keldi",
            err: err
        }
    })
})

router.delete("/me/avatar", auth, async (req, res)=> {
    req.user.avatar = undefined;
    await req.user.save()
    res.json({
        success: true,
        user: req.user
    })
})

router.get("/:id/avatar", async (req, res)=> {
    try {
        let user = await User.findById(req.params.id);
        if(!user) throw new Error("User not found")
        
        res.set("Content-Type", "image/png")
        res.send(user.avatar)
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Rasm yuklanishida muammo yuzaga keldi",
                err: err
            }
        })
    }
})


module.exports = router