import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tokenRoute from './routes/azureRoute.js';
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// Routes
app.get('/', (req, res) => {
  res.send('server is runningggggggggg');
});


app.use('/api', tokenRoute);
app.use('/', authRoutes);
app.use('/', meetingRoutes)
app.use('/', userRoutes);





// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 