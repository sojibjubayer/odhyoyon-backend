const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware setup
app.use(cors({
    origin: ['http://localhost:5173', 'https://odhyoyonedu.web.app'], 
    credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

const uri = process.env.MONGO_URI; 
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

client.connect(err => {
    if (err) {
        console.error('Failed to connect to MongoDB:', err);
    } else {
        console.log('Connected to MongoDB');
    }
});

// API routes
app.post('/api/admissionForm', async (req, res) => {
    const student = req.body;

    try {
        const studentCollection = client.db('odhyoyonedu').collection('students');
        const result = await studentCollection.insertOne(student); 
        res.status(201).send(result);
    } catch (error) {
        console.error('Error inserting user:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userCollection = client.db('odhyoyonedu').collection('users');
        const user = await userCollection.findOne({ email, password });

        if (!user) {
                return res.status(400).send({ message: 'no user found' });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '12h' });

        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.status(200).send({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.get('/api/students', async (req, res) => {
    try {
        const studentCollection = client.db('odhyoyonedu').collection('students');
        const students = await studentCollection.find().toArray(); // Fetch all students from the database
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students' });
    }
});


// Root route
app.get('/', (req, res) => {
    res.send('Odhyoyon server is running');
});

// Server listening
// const PORT = process.env.PORT || 5000; // Use the PORT from environment variables or default to 5000
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

module.exports = app;
