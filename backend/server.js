const express = require('express');
const path = require('path');
const routes = require('./routes');
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../embjsFiles"));

//serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Use routes
app.use('/', routes);

// Start the server and listen on the specified port
app.listen(port, (error) => {
    if (!error)
        console.log(`Server is successfully running, and app is listening on http://localhost:${port}`);
    else
        console.log("Error occurred, server can't start", error);
});