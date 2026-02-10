const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   قواعد البيانات المؤقتة
========================= */

let orders = [];

let drivers = [
  {
    id: "1",
    name: "Driver 1",
    phone: "0550000000",
    password: "1234",
    subscribed: true,
    active: false,
    totalOrders: 0,
  },
];

// ⭐⭐⭐ طلبات الاشتراك الجديدة
let subscriptionRequests = [];

/* ========================= */

app.get("/", (req, res) => {
  res.send("Server is working");
});

/* =========================
   الزبون (لا نغيره)
========================= */

app.post("/order", (req, res) => {
  const order = {
    id: Date.now().toString(),

    name: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
    order: req.body.order,
    lat: req.body.lat,
    lng: req.body.lng,

    status: "pending",
    driverId: null,
    date: new Date(),
  };

  orders.push(order);

  res.json({ success: true });
});

/* =========================
   عرض الطلبات
========================= */

app.get("/orders", (req, res) => {
  res.json(orders);
});

app.get("/orders/pending", (req, res) => {
  const pending = orders.filter((o) => o.status === "pending");
  res.json(pending);
});

/* =========================
   السائق
========================= */

/// ⭐⭐⭐ طلب اشتراك جديد
app.post("/driver/request-subscription", (req, res) => {
  const { phone, password } = req.body;

  const exists = drivers.find((d) => d.phone === phone);
  if (exists) {
    return res.json({ success: false, message: "السائق موجود مسبقاً" });
  }

  subscriptionRequests.push({
    id: Date.now().toString(),
    phone,
    password,
  });

  res.json({ success: true, message: "تم إرسال الطلب" });
});

/// ⭐⭐⭐ عرض طلبات الاشتراك (للأدمن)
app.get("/admin/subscription-requests", (req, res) => {
  res.json(subscriptionRequests);
});

/// ⭐⭐⭐ قبول طلب الاشتراك (الأدمن)
app.post("/admin/approve-driver", (req, res) => {
  const { requestId } = req.body;

  const request = subscriptionRequests.find((r) => r.id === requestId);

  if (!request) {
    return res.json({ success: false, message: "الطلب غير موجود" });
  }

  const newDriver = {
    id: Date.now().toString(),
    name: "Driver",
    phone: request.phone,
    password: request.password,
    subscribed: true,
    active: false,
    totalOrders: 0,
  };

  drivers.push(newDriver);

  // نحذف الطلب بعد القبول
  subscriptionRequests = subscriptionRequests.filter(
    (r) => r.id !== requestId
  );

  res.json({ success: true });
});

// تسجيل الدخول
app.post("/driver/login", (req, res) => {
  const { phone, password } = req.body;

  const driver = drivers.find(
    (d) => d.phone === phone && d.password === password
  );

  if (!driver) {
    return res.json({ success: false, message: "بيانات غير صحيحة" });
  }

  if (!driver.subscribed) {
    return res.json({ success: false, message: "الاشتراك غير مفعل" });
  }

  driver.active = true;

  res.json({ success: true, driver });
});

// تسجيل الخروج
app.post("/driver/logout", (req, res) => {
  const { driverId } = req.body;

  const driver = drivers.find((d) => d.id === driverId);
  if (driver) driver.active = false;

  res.json({ success: true });
});

/* =========================
   قبول الطلب
========================= */

app.post("/order/accept", (req, res) => {
  const { orderId, driverId } = req.body;

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.json({ success: false, message: "الطلب غير موجود" });
  }

  if (order.status !== "pending") {
    return res.json({ success: false, message: "تم أخذ الطلب" });
  }

  order.status = "accepted";
  order.driverId = driverId;

  res.json({ success: true });
});

/* =========================
   إنهاء الطلب
========================= */

app.post("/order/done", (req, res) => {
  const { orderId, driverId } = req.body;

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.json({ success: false, message: "الطلب غير موجود" });
  }

  order.status = "done";

  const driver = drivers.find((d) => d.id === driverId);
  if (driver) driver.totalOrders++;

  res.json({ success: true });
});

/* =========================
   الأدمن - الإحصائيات
========================= */

app.get("/stats/today", (req, res) => {
  const today = new Date().toDateString();

  const count = orders.filter(
    (o) => new Date(o.date).toDateString() === today
  ).length;

  res.json({ count });
});

app.get("/stats/completed", (req, res) => {
  const count = orders.filter((o) => o.status === "done").length;
  res.json({ count });
});

app.get("/stats/canceled", (req, res) => {
  const count = orders.filter((o) => o.status === "cancel").length;
  res.json({ count });
});

app.get("/stats/drivers", (req, res) => {
  res.json({ count: drivers.length });
});

app.get("/stats/activeDrivers", (req, res) => {
  const count = drivers.filter((d) => d.active).length;
  res.json({ count });
});

/* ========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started"));
