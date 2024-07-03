const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());    // jo request milega wo json k through pass hoga
app.use(cors());          //  react js project connect to express on port 4000
// app.use(cors({
//     origin: "https://e-commerce-website-1-admin.onrender.com", // Set this to your frontend URL if applicable
//     methods: ["POST", "GET"],
//     credentials: true
// }));


// DATABASE CONNECTION WITH MONGODB

mongoose.connect("mongodb+srv://P1-Ecommerce:7459923419@cluster0.a71azht.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0");
// mongodb+srv://P1-Ecommerce:7459923419@cluster0.a71azht.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0"

// API Creation


app.get("/",(req,res)=>{
    res.send("Express App is Running")
})


// Image storage Engine

const storage = multer.diskStorage({           //It creates a storage engine that stores files on the disk.
    destination: './upload/images',            //This line specifies the destination directory where uploaded files will be stored.
    filename: (req,file,cb)=>{                 //his line defines the function to determine the filename of the uploaded file.     cb- callback
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)          //This line generates the filename for the uploaded file..
    }
})

const upload = multer({storage:storage})


// Creating upload endpoint for images
app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`https://e-commerce-website-tym5.onrender.com/images/${req.file.filename}`
    })
})


// Schema for creating products

const Product = mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    },
})

app.post('/addproduct',async (req,res) => {

    let products = await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1; 
    }
    else{
        id=1;
    }

    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");

    res.json({
        success:true,
        name:req.body.name,
    })
})


// creating API for deleting Products

app.post('/removeproduct',async (req,res) => {
    await Product.findOneAndDelete({id:req.body.id})
    console.log("Removed");
    
    res.json({
        success:true,
        name:req.body.name
    })
})



// Creating API for getting all products

app.get('/allproduct', async (req,res) => {
    let products = await Product.find({});
    // let products = await Product.find({category:"women"});
    console.log("All Product Fetched");

    res.send(products);
})



// Schema Creating for user model

const Users = mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})


// Creating EndPoint for registering Users...

app.post('/signup',async (req,res)=>{

    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"existing user found with same email address"});
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        const element = cart[i];
        cart[i]=0;
    }
    const user = new Users({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    const data = {
        user:{
            id:user.id,
        },
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true,token});

})


// Creating endpoint for user login,

app.post('/login',async (req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,error:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,error:"Wrong emailId"});
    }
})


// creating endpoint for newcollection data
app.get('/newcollections',async (req,res)=>{
    let product = await Product.find({});
    let newcollection = product.slice(1).slice(-8);
    console.log("New Collection Fetches");
    res.send(newcollection)
})


// app.get('/allproduct', async (req,res) => {
//     let products = await Product.find({});
//     console.log("All Product Fetched");

//     res.send(products);
// })


// creating endpoint for popular in women
app.get('/popularinwomen', async (req,res)=>{
    let products = await Product.find({category:"womens"});
    let popular_in_women = products.slice(0,4);
    console.log("Popular in women Fetched");
    res.send(popular_in_women);
})

// creating middleware to fetch user..

    const fetchuser = async (req,res,next)=>{
        const token = req.header('auth-token');
        if(!token){
            res.status(401).send({errors:"Please authenticate using valid token"});
        }
        else{
            try {
                const data = jwt.verify(token,'secret_ecom');
                req.user = data.user;
                next();
            } catch (error) {
                res.status(401).send({errors:"Please authenticate using a valid token"});

            }
        }
    }



// creating end point for adding products in cartdata..
app.post('/addtocart',fetchuser, async(req,res)=>{
    console.log("Added",req.body.itemIdr);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")
})

// creating end point for remove products in cartdata...

app.post('/removefromcart',fetchuser,async(req,res)=>{
    console.log("remove",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})


// Creating API for retrieve cart data...
app.post('/getcart',fetchuser,async(req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})



app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on port "+port);
    }
    else{
        console.log("Error "+error);
    }
})
