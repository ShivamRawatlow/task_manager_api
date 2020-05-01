const express = require('express')

require('./db/mongoose') // no need to save in variable(only to ensure that database runs)

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT 

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port,()=>{
    console.log('Server is up on port ' + port)
})
