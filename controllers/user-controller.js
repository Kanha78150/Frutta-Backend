const User = require('../models/user-model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const BlacklistToken = require('../models/blacklistToken-model');
const Product = require('../models/product-model');
const Order = require('../models/order-model');
const Payment = require('../models/payment-model');


const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports.signup = async (req, res) => {
    const { name, username, email, password, role } = req.body;

    try {

        // check if all fields are provided
        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // hashedPassword
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            username,
            email,
            password: hashedPassword,
            role
        });

        const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
            message: 'User created successfully',
            user: newUser,
            token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });

    }
}

module.exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', user, token });
    } catch (error) {
        next(error);
    }
}

module.exports.logout = async (req, res) => {


    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const isTokenBlacklisted = await BlacklistToken.findOne({ token });
        if (isTokenBlacklisted) {
            return res.status(400).json({ message: 'Token already blacklisted' });
        }

        await BlacklistToken.create({ token });
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        next(error);
    }
}

module.exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({ message: 'Profile fetched successfully', user });
    } catch (error) {
        next(error);
    }
}

// For all products
module.exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ message: 'Products fetched successfully', products });
    } catch (error) {
        next(error);
    }
}

// For a specific product
module.exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.status(200).json({ message: 'Product fetched successfully', product });
    } catch (error) {
        next(error);
    }
}

// For creating an order
module.exports.createOrder = async (req, res) => {
    try {

        // Get the product first
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(400).json({ message: 'Product not found' });
        }
        const options = {
            amount: product.amount * 100,
            currency: 'INR',
            receipt: 'product._id'
        }

        const order = await razorpay.Order.create(options);
        res.status(200).json({ message: 'Order created successfully', order });


        // create a payment
        const payment = await Payment.create({
            order: order.id,
            amount: product.amount,
            currency: 'INR',
            status: 'pending'
        });
        res.status(200).json({ message: 'Payment created successfully', payment });
    } catch (error) {
        next(error);
    }
}

// For verifying the payment
module.exports.verifyPayment = async (req, res) => {
    try {
        const { paymentId, orderId, signature } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET;

        const { validatePaymentVerification } = require('../node_modules/razorpay/dist/utils/razorpay-utils.js');

        const isValid = validatePaymentVerification({
            payment_id: paymentId,
            order_id: orderId,
        }, signature, secret);

        if (isValid) {

            const payment = await Payment.findOne({
                orderId: orderId,
            });
            payment.paymentId = paymentId;
            payment.signature = signature;
            payment.status = 'completed';
            await payment.save();

            res.status(200).json({ message: 'Payment verified successfully', payment });
        }
        else {
            const payment = await Payment.findOne({
                orderId: orderId,
            });
            payment.status = 'failed';
            await payment.save();
            res.status(400).json({ message: 'Payment verification failed' });
        }

    } catch (error) {
        next(error);
    }
}
