const express = require("express")
const router = express.Router()


const Task = require("../models/task")
const Column = require("../models/column")
const User = require("../models/user")
const auth = require("../middleware/auth")
const mongoose = require("mongoose")

router.get("/", auth, async (req, res) => {
    let columns = await Column.find({owner: req.user._id})
    if(columns.length < 1) return res.json({
        success: true,
        data: {
            message: "Mavjud emas"
        }
    })
    let tasks = []
    columns.forEach(async (val, i) => {
        let task = await Task.find({father: val._id})
        if(!task) throw new Error()
        tasks.push({
            father: {
                title: val.title,
                _id: val._id
            },
            tasks: task
        })
        if(columns.length - 1 == i) {
            res.json({
                success: true,
                data: {
                    tasks: tasks
                }
            })
        }
    })    
})

router.post("/add/column", auth, async (req, res) => {
    try {
        let column = new Column({
            title: req.body.title,
            owner: req.user._id
        })

        await column.save()

        res.json({
            success: true,
            data: {
                message: "Column yaratildi",
                column
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Column yaratilishida xatolik ro`y berdi",
                err: e
            }
        })
    }
})

router.post("/add", auth, async (req, res) => {
    try {
        let column =  await Column.findOrCreate({ title: req.body.father.title, owner: req.user._id })
        let task = new Task({title: req.body.title, description: req.body.description, father: column.doc._id})
        
        await task.save()

        res.json({
            success: true,
            data: {
                message: "Task yaratildi",
                task
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "Task yaratishda xatolik ro`y berdi",
                err: e
            }
        })
    }
})

router.get("/task/:id", async(req, res) => {
    try {
        let task = await Task.findById(req.params.id)
        if(!task) throw new Error()
        let father = await Column.findById(task.father)
        let user = await User.findById(father.owner)
        if(user._id.toString() !== req.user._id.toString()) throw new Error();

        res.json({
            success: true,
            data: {
                task
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "taskni ko`ra olmaysiz yoki bunday task mavjud emas",
                err: e
            }
        })
    }
})

router.put("/task/:id", auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id)
        if(!task) throw new Error()
        let father = await Column.findById(task.father)
        let user = await User.findById(father.owner)
        if(user._id.toString() !== req.user._id.toString()) throw new Error();
        await Task.findByIdAndUpdate(req.params.id, {
            title: req.body.title ? req.body.title : task.title,
            description: req.body.description ? req.body.description : task.description,
            completed: req.body.completed ? req.body.completed : task.completed,
            father: req.body.father ? req.body.father : task.father
        })
        res.json({
            success: true,
            data: {
                message: "O`zgartirish amalga oshirildi"
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "O`zgartirishda xatolik ro`y berdi",
                err: e
            }
        })
    }
})

router.put("/column/:id", auth, async (req, res) => {
    try {
        let column = await Column.findById(req.params.id)
        let user = await User.findById(column.owner)
        if(user._id.toString() !== req.user._id.toString()) throw new Error();
        column.title = req.body.title
        await column.save()
        res.json({
            success: true,
            data: {
                message: "O`zgartirish amalga oshirildi"
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "O`zgartirishda xatolik ro`y berdi",
                err: e
            }
        })
    }
})

router.delete("/task/:id", auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id)
        if(!task) throw new Error()
        let father = await Column.findById(task.father)
        let user = await User.findById(father.owner)
        if(user._id.toString() !== req.user._id.toString()) throw new Error();
        await task.remove()
        res.json({
            success: true,
            data: {
                message: "O`chrish amalga oshirildi"
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "O`chirishda xatolik ro`y berdi",
                err: e
            }
        })
    }
})

router.delete("/column/:id", auth, async (req, res) => {
    try {
        let column = await Column.findById(req.params.id)
        if(!column) throw new Error()
        let user = await User.findById(column.owner)
        if(user._id.toString() !== req.user._id.toString()) throw new Error();

        await column.remove()
        res.json({
            success: true,
            data: {
                message: "O`chirish amalga oshirildi"
            }
        })
    } catch (e) {
        res.json({
            success: false,
            data: {
                message: "O`chirishda xatolik ro`y berdi",
                err: e
            }
        })
    }
})

module.exports = router