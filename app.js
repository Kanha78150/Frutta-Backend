const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const connectDB = require('./config/mongodb-connection');
const userRouter = require('./routes/user-router');
const productRouter = require('./routes/product-router');




connectDB();

require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', userRouter);
app.use('/api', productRouter);

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
}
)