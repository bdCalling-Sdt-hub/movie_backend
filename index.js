
const applyMiddleware = require("./src/middlewares");
const connectDB = require("./src/db/connectDB");
const { PORT } = require("./src/config/defaults");
const { app } = require("./src/Socket");
const express = require("express")
const axios = require('axios');
const qs = require('qs');
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
const overviewRoutes = require("./src/routes/OverviewRoutes");
const { notifyUsersAboutActorMovies, notifyUsersAboutStudioMovies } = require("./src/utils/AutoMations");
const FollowRoutes = require("./src/routes/FollowRoute");
const { CreateNotification } = require("./src/Controller/NotificationsController");
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
app.use('/overview', overviewRoutes)
app.use('/follow', FollowRoutes)
// app.get('/test', async (req, res) => {
//   const result = await notifyUsersAboutActorMovies()
//   return res.send(result)
// })


// app.get('/mail-token', async (req, res) => {
//   // Extract authorization code from query parameters
//   const authCode = req.query.code;

//   // Define token URL with /consumers endpoint
//   const tokenUrl = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
//   const tokenData = {
//     client_id: 'f4102eee-7cee-44eb-af5c-83149d7ff593',  // Your Client ID
//     client_secret: '68h8Q~zozmpfp-9cDKl3dJ0P5n_Nzf.vWUkS0adq',  // Your Client Secret
//     grant_type: 'authorization_code',
//     code: authCode,  // The authorization code from the query parameters
//     redirect_uri: 'http://localhost',  // The same redirect URI used during app registration
//     scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.Read',
//   };

//   try {
//     // Exchange authorization code for access token
//     const response = await axios.post(tokenUrl, qs.stringify(tokenData), {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//     });

//     // Extract access token from response
//     const tokens = response.data;
//     console.log('Access Token:', tokens.access_token);

//     // Send the access token as a response
//     res.json({
//       access_token: tokens.access_token,
//       refresh_token: tokens.refresh_token,
//       expires_in: tokens.expires_in,
//     });
//   } catch (error) {
//     // Handle errors
//     console.error('Error exchanging authorization code for tokens:', error.response.data);
//     res.status(500).json({ error: 'Failed to exchange authorization code for tokens', err: error.response.data });
//   }
// });
app.post('/not', async (req, res) => {
  try {
    const { title, movie, message, type,user } = req.body;


    // Check for missing fields
    if (!title || !movie || !message || !type || !user) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Call the CreateNotification function
    const notification = await CreateNotification({ title, movie, message, type }, user);

    // Send back the response with the created notification
    return res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

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
const startInterval = () => {
  const appointmentInterval = setInterval(async () => {
    await Promise.all([
      notifyUsersAboutStudioMovies(),
      notifyUsersAboutActorMovies()
    ])
    clearInterval(appointmentInterval);
    startInterval();

  }, 30 * 60 * 1000);
};
startInterval();
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
  await connectDB();
  app.listen(port, () => {//
    // app.listen('103.161.9.133:7000', () => {
    // handle unhandled promise rejections '192.168.10.25',
    process.on("unhandledRejection", (error) => {
      // logger.error("Unhandled Rejection:", error);
      // server.close(() => process.exit(1));
    });

    // handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      // errorLogger.error("Uncaught Exception:", error);
      // process.exit(1);
    });

    // handle termination signals
    process.on("SIGTERM", () => {
      // logger.info("SIGTERM received");
      // server.close(() => process.exit(0));
    });
    console.log(`Server is running on port ${port}`);
  });
};

main();