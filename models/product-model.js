const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    image: [{
        type: String,
    }]
},
    {
        timestamps: true
    }
)

const Product = mongoose.model('product', productSchema);

module.exports = Product;
