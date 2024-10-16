require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
    console.log(process.env.MONGO_URI)
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Успешно подключено к MongoDB");
    } catch (error) {
        console.error("Ошибка подключения к MongoDB:", error);
    }
}

connectDB();
