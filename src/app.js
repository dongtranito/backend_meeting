import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tokenRoute from './routes/azureRoute.js';
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js'
import meetingRoutes1 from './routes/meetingRoutes1.js'
import uploadRoute from './routes/uploadRoute.js'
import minutesRoute from './routes/minutesRoute.js'
import hookRoute from './routes/hook.js'
import chatbot from './routes/chatbotRoutes.js'
import { test } from './controllerTest/test.js'  // cái này để test
import { cronJobChromaDB } from './chatbot/cronjob.js';
dotenv.config();


const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(cors({
  origin: [
    'http://localhost:3006',
    'https://d3jb44hiqqbm16.cloudfront.net'
  ], credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// Routes
app.get('/', (req, res) => {
  res.send('server is runningggggggggg1');
});

app.get('/cronjob', (req, res) => {
  try {
    cronJobChromaDB()
    res.status(200).json('refresh chomadb thành công');
  } catch (error) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
});

app.use('/hook', hookRoute)
app.use('/chat', chatbot);
app.post('/test', test)
app.use('/api', tokenRoute);
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', groupRoutes);
app.use('/', meetingRoutes1);
app.use('/upload', uploadRoute);
app.use('/', minutesRoute);


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 