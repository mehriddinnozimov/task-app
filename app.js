require("dotenv").config({path:"./src/config/.env"})
require("./src/db/mongoose")

const express = require("express")
const app = express()
const bodyParser = require("body-parser")

app.use(express.static("public"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.use("/user/tasks", require("./src/routes/task"))
app.use("/user", require("./src/routes/user"))




let port = process.env.PORT
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})