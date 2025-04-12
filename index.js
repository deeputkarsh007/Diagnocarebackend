require("./db/config");
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

const auth = require("./routes/auth");
const test = require("./routes/test");
// const report = require("./routes/generateReport");

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/auth", auth);
app.use("/test", test);

app.listen(port, () => console.log(`app is runninig on port ${port}....`));
