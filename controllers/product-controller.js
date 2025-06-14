const productModel = require('../models/product-model');

exports.createProduct = async (req, res) => {
    try {
        const { name, price, description } = req.body;

        if (!name || !price || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const product = await productModel.create({ name, price, description, seller: req.user._id, image: req.files.map(file => file.path) });
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}