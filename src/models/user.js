const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        }
    },  
    age:{
        type:Number,
        default: 0,
        validate(value){
            if(value<0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minlength: 7,
        
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot contain "password" ')
            }
        }
    
    },

    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer // to store the image
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks',{  //creates relation between two models
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//when we pass an object to res.send() it automatically calls JSON.stringfy()
//JSON.stringfy() calls the toJSON method

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject() // this inbuilt mongoose function returns
    //just the object data without any inbuilt function

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}


userSchema.methods.generateAuthToken = async function(){ //methods are accessible on the instances
    const user = this
    const token = jwt.sign({ _id: user._id.toString()},process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async(email,password) => { //static methods are accessible on the models
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password,user.password)

    if(!isMatch){
        throw new Error('Unable to login: Wrong Password')
    }
    return user
}


//Hash the plain text password before saving
userSchema.pre('save', async function(next){
    const user = this // 'this' is the user being saved
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    } 
    next()
})


//Delete user tasks when user is removed
userSchema.pre('remove', async function(next){
    const user = this // 'this' is the user being saved
    await Task.deleteMany({owner: user_id})
    next()
})



const User = mongoose.model('User',userSchema)

module.exports = User