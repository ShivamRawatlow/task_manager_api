const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = new express.Router()


// router.get('/users',async(req,res)=>{
//     try{
//         const users = await User.find({})
//         res.send(users)
//     }catch(error){
//         res.status(500).send()
//     }
// })

router.get('/users/me', auth, async(req,res) =>{
    res.send(req.user)
})

// router.get('/users/:id',async(req,res)=>{
//     const _id = req.params.id
//     try{
//         const user = await User.findById(_id)
//         if(!user){
//             return res.status(404).send()
//         }
//         res.send(user)
//     }catch(error){
//         res.status(500).send();
//     }
// })


router.post('/users', async(req,res)=>{ //create new user
    
    const user = new User(req.body)
    try{
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    }catch(error){
        res.status(400).send(error)        
    }
})


router.post('/users/login', async(req,res) => {
    try{   
        const user = await User.findByCredentials(req.body.email, req.body.password) //userDefinedFunctions //like extension function
        const token = await user.generateAuthToken()
        res.send({user,token})
    }catch(error){
        console.log(error)
        res.status(400).send()     
    }
})


router.post('/users/logout', auth, async(req,res) =>{
    try{
        req.user.tokens = req.user.tokens.filter((token) =>{ //saving tokens which are not equal to the req token
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(error){
        res.status(500).send()
    }
})

router.post('/users/logoutAll',auth,async(req,res) =>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(error){
        res.status(500).send()
    }
})


router.patch('/users/me',auth,async(req,res)=>{
    const allowedUpdates = ['name','email','password','age']
    const updates = Object.keys(req.body) //keys will be retured in an array of string
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid Updates!'})
    }

    try{ 
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        
        //const user = await User.findByIdAndUpdate(_id,req.body,{new:true, runValidators: true})
        //findByIdAndUpdate bypasses the pre method of schema therefore not using it
        res.send(req.user)

    }catch(error){
        res.status(400).send(e)
    }
})

router.delete('/users/me',auth, async(req,res)=>{
    try{
        await req.user.remove()
        
        res.send(req.user )
    }catch(error){
        res.status(500).send()
    }
})



const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) { //regular expression
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer() //modifying image

    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => { // to provide custom error when wrong file is uploaded
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async(req,res) =>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type','image/png')
        res.send(user.avatar)

    }catch(error){
        res.status(404).send()  
    }
    req.user.avatar 
})


module.exports = router