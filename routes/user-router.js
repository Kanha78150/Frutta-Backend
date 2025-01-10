const express = require('express');
const router = express.Router();

const userController = require('../controllers/user-controller');
const authMiddleware = require('../middlewares/auth-middleware');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/logout', authMiddleware.authenticate, userController.logout);

// For getting the profile
router.get('/profile', authMiddleware.authenticate, userController.getProfile);

// For all products
router.get('/products', authMiddleware.authenticate, userController.getProducts);

// For a specific product
router.get('/products/:id', authMiddleware.authenticate, userController.getProductById);

// For creating an order
router.get('/order/:id', authMiddleware.authenticate, userController.createOrder);

// For verifying the payment
router.get('/verify-payment', authMiddleware.authenticate, userController.verifyPayment);

module.exports = router;