const express = require('express');
const cors = require('cors');
require('dotenv').config();
const tokenRoute = require('./routes/azureRoute');
const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const cookieParser = require("cookie-parser");


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
app.use('/',meetingRoutes)





// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 