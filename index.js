
const applyMiddleware = require("./src/middlewares");
const connectDB = require("./src/db/connectDB");
const { PORT } = require("./src/config/defaults");
const { app } = require("./src/Socket");
const express = require("express")
const port = PORT || 6000;
const AuthRoute = require("./src/routes/AuthenticationRoute");
const globalErrorHandler = require("./src/utils/globalErrorHandler");
const NotificationRoutes = require("./src/routes/NotificationRoutes");
const PaymentRoutes = require("./src/routes/PaymentRoutes");
const StudioRoutes = require("./src/routes/StudioRoute");
const MovieTypeRoutes = require("./src/routes/MovieTypeRoute");
const MovieRoutes = require("./src/routes/MovieRoutes");
const SettingsRoutes = require("./src/routes/SettingsRoutes");
const ActorRoutes = require("./src/routes/ActorRoutes");
const HistoryRoutes = require("./src/routes/HistoryRoutes");
const FavoriteRoutes = require("./src/routes/FavoriteRoutes");
const CalenderRoutes = require("./src/routes/CalenderRoutes");
applyMiddleware(app);

//routes
app.use('/auth', AuthRoute)
app.use('/notification', NotificationRoutes)
app.use('/payment', PaymentRoutes)
app.use('/studio', StudioRoutes)
app.use('/movie-type', MovieTypeRoutes)
app.use('/movie', MovieRoutes)
app.use('/settings', SettingsRoutes)
app.use('/actor', ActorRoutes)
app.use('/history', HistoryRoutes)
app.use('/favorite', FavoriteRoutes)
app.use('/calender', CalenderRoutes)
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Server Status</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 flex items-center justify-center min-h-screen">
      <div class="bg-white p-8 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Movie Server</h1>
        <p class="text-gray-600">The server is running....</p>
      </div>
    </body>
    </html>
  `);
});
app.use(express.static('uploads'))

app.all("*", (req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on the server`);
  error.status = 404;
  return res.status(404).send(`
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Page Not Found</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 50px;
        }
        h1 {
            font-size: 50px;
            color: #ff0000;
        }
        p {
            font-size: 20px;
        }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>Sorry, Can't find <strong>"${req.originalUrl}"</strong> on the server</p>
    <a href="/">Go to Homepage</a>
</body>
</html>
    `);
  // next(error);
});

// error handling middleware
app.use(globalErrorHandler);

const main = async () => {
  await connectDB()
  app.listen(port, '192.168.10.6', () => {
    console.log(`Server is running on port ${port}`);
  });
}
main()