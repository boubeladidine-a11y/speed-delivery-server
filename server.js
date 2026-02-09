const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let orders = [];

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.post("/order", (req, res) => {
  const order = req.body;
  orders.push(order);
  res.json({ success: true });
});

app.get("/orders", (req, res) => {
  res.json(orders);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started"));
