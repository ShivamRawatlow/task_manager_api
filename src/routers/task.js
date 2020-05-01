const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()


//Get /tasks?completed=true
//GET /tasks?limit=10&skip=20
//GET /tasks?sortBy=createdAt_desc

router.get('/tasks', auth, async(req,res)=>{
    try{
        const match = {}
        const sort = {}


        if(req.query.completed){
            match.completed = req.query.completed === 'true'
        }

        if(req.query.sortBy){
            const parts = req.query.sortBy.split('_') // splitting the string

            //parts[0] = firstPart (eg createdAt)
            //parts[1] = secondPart (-1 or 1)
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1  //ternary operator

        }

        await req.user.populate({
            path: 'tasks',
            match, // since the key and the value has same name , we user the property shorthand on the object block
            options: {
                limit: parseInt(req.query.limit),  //inbuilt
                skip: parseInt(req.query.skip),
                sort:{
                    createdAt:-1
                }
            }

        }).execPopulate()

        res.send(req.user.tasks)
    }catch(error){
        res.status(500).send()
    }
})



router.get('/tasks/:id', auth, async(req,res)=>{
    const _id = req.params.id
    try{        
        const task = await Task.findOne({ _id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)

    }catch(error){
        res.status(500).send()
    }
})

router.post('/tasks', auth, async(req,res)=>{

   const task = new Task({
       ...req.body, // ... will copy everything from body to task variable
        owner: req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)
    }catch(error){
        res.status(400).send(error)        
    }
})


router.patch('/tasks/:id', auth, async(req,res)=>{
    
    const allowedUpdates = ['description','completed']
    const updates = Object.keys(req.body) //keys will be retured in an array of string
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid Updates!'})
    }

    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if(!task){
            return res.status(404).send() 
        }
        
        updates.forEach((update) =>task[update] = req.body[update])
        await task.save()
        res.send(task)

    }catch(error){
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async(req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})    
        
        if(!task){
            return res.status(404).send()
        }        
        res.send(task)

    }catch(error){
        res.status(500).send()
    }
})


module.exports = router