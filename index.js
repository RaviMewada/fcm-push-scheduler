require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { User, Reminder, Schedule } = require('./Models/index');
const http = require('http');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(error => console.log('Error occurred while connecting to MongoDB', error));

const app = express();

app.use(express.json());

app.get('/', (request, response) => {
    return response.status(200).json({
        message: 'Welcome to home page.'
    });
});

app.post('/register', async (request, response, next) => {
    const { name, fcmToken, email } = request.body;
    try {
        const user = await User.create({
            name,
            email,
            fcmToken
        });
        return response.status(200).json({
            status: 200,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

app.post('/reminder', async (request, response, next) => {
    const { scheduleTime, userId, message } = request.body;
    try {
        const reminder = await Reminder.create({
            userId,
            message,
            time: new Date(scheduleTime)
        });
        await Schedule.create({
            _id: reminder._id,
            sendAt: reminder.time
        });
        return response.status(200).json({
            status: 200,
            message: 'Reminder added successfully'
        });
    } catch (error) {
        next(error);
    }
});

app.use((error, request, response, next) => {
    console.log('Exception occurred on path', request.originalUrl, error);
    return response.status(500).json({
        status: 500,
        path: request.originalUrl,
        error: error.message
    });
});

const server = http.createServer(app);
server.listen(process.env.PORT, () => console.log(`Server is listing on port ${process.env.PORT}`));