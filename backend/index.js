const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const app = express();

// Use environment variables for configuration
const PORT = process.env.PORT || 4000;
const MONGO_URI = "mongodb+srv://P1-Ecommerce:7459923419@cluster0.a71azht.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0";
// "mongodb+srv://P1-Ecommerce:7459923419@cluster0.a71azht.mongodb.net/e-commerce"
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Enable CORS with specific settings
app.use(cors({
    origin: "*", // Adjust this as per your client URL
    methods: ["POST", "GET"],
    credentials: true
}));

app.use(express.json()); // Middleware to parse JSON requests

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// mongoose.connect("mongodb+srv://P1-Ecommerce:7459923419@cluster0.a71azht.mongodb.net/e-commerce")

// Define a simple route to check if the server is running
app.get("/", (req, res) => {
    res.send("Express App is Running");
});

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Serve images statically
app.use('/images', express.static('upload/images'));

// Upload endpoint for images
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `https://e-commerce-website-tym5.onrender.com/images/${req.file.filename}`
    });
});

// Define the product schema
const Product = mongoose.model("Product", {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    new_price: { type: Number, required: true },
    old_price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    available: { type: Boolean, default: true }
});

// Add a product
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id = products.length ? products[products.length - 1].id + 1 : 1;

    const product = new Product({
        id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price
    });

    try {
        await product.save();
        res.json({ success: true, name: req.body.name });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Remove a product
app.post('/removeproduct', async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: req.body.id });
        res.json({ success: true, id: req.body.id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all products
app.get('/allproduct', async (req, res) => {
    try {
        let products = await Product.find({});
        res.send(products);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Define the user schema
const Users = mongoose.model('Users', {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    cartData: { type: Object, default: {} },
    date: { type: Date, default: Date.now }
});

// Register a user
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, error: "User already exists with this email address" });
    }

    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cartData: {}
    });

    try {
        await user.save();
        const token = jwt.sign({ id: user._id }, JWT_SECRET);
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// User login
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (!user) {
        return res.status(400).json({ success: false, error: "Invalid email" });
    }

    if (req.body.password === user.password) {
        const token = jwt.sign({ id: user._id }, JWT_SECRET);
        res.json({ success: true, token });
    } else {
        res.status(400).json({ success: false, error: "Invalid password" });
    }
});

// Get new collections
app.get('/newcollections', async (req, res) => {
    try {
        let products = await Product.find({});
        let newCollection = products.slice(-8);
        res.send(newCollection);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get popular products in women's category
app.get('/popularinwomen', async (req, res) => {
    try {
        let products = await Product.find({ category: "women" });
        let popularInWomen = products.slice(0, 4);
        res.send(popularInWomen);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Middleware to authenticate user
const fetchUser = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ error: "Please authenticate using a valid token" });
    }
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data;
        next();
    } catch (error) {
        res.status(401).json({ error: "Please authenticate using a valid token" });
    }
};

// Add product to cart
app.post('/addtocart', fetchUser, async (req, res) => {
    try {
        let userData = await Users.findById(req.user.id);
        userData.cartData[req.body.itemId] = (userData.cartData[req.body.itemId] || 0) + 1;
        await Users.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
        res.send("Added to cart");
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Remove product from cart
app.post('/removefromcart', fetchUser, async (req, res) => {
    try {
        let userData = await Users.findById(req.user.id);
        if (userData.cartData[req.body.itemId] > 0) {
            userData.cartData[req.body.itemId] -= 1;
            await Users.findByIdAndUpdate(req.user.id, { cartData: userData.cartData });
            res.send("Removed from cart");
        } else {
            res.status(400).json({ error: "Item not in cart" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get cart data
app.post('/getcart', fetchUser, async (req, res) => {
    try {
        let userData = await Users.findById(req.user.id);
        res.json(userData.cartData);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
