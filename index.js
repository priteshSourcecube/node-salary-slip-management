require('dotenv').config()
const cors = require("cors");
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const routes = require("./routes/index")
const errorHandlerMiddleware = require("./common/middleware/error-handler.middleware");


app.use(express.json());
app.use(cors({ origin: "*" }));
app.get('/', (req, res) => res.send('working finely.'))
app.use("/api/v1", routes)
app.use((req, res, next) => {
    return res.status(404).json({ status: 404, success: false, message: "Page not found on the server" });
})
app.use(errorHandlerMiddleware);

app.listen(port, () => {
    console.log(`Sever is running on ${port}!`)
})
