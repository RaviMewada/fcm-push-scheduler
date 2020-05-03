require('dotenv').config();
const mongoose = require('mongoose');
const { Reminder, Schedule } = require('./Models/index');
const admin = require('firebase-admin');
const serviceAccount = require('./fcm-admin-credentials.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Initialized watcher successfully');
        Schedule.watch([{ $match: { operationType: 'delete' } }]).on('change', async (data) => {
            const id = data.documentKey._id;
            const reminder = await Reminder.findOne({ _id: id }).populate({ path: 'userId', select: { name: 1, fcmToken: 1 } });
            const payload = {
                notification: {
                    title: 'Reminder',
                    body: reminder.message
                }
            };
            const options = {
                priority: 'high'
            };
            admin.messaging().sendToDevice(reminder.userId.fcmToken, payload, options)
                .then(response => {
                    console.log('Push sent successfully', response);
                })
                .catch(error => {
                    console.log('Error occurred while sending push', error);
                });
        });
    })
    .catch(error => {
        console.log('Error occurred while connecting to MongoDB', error)
        process.exit(1);
    });