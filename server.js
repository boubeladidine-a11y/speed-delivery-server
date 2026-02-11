const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   قواعد البيانات المؤقتة
========================= */

let orders = [];

let drivers = [];

let subscriptionRequests = [];

/* ========================= */

app.get("/", (req, res) => {
  res.send("Server is working");
});

/* =========================
   إنشاء طلب (الزبون)
========================= */

app.post("/order", (req, res) => {
  const { name, phone, address, order, lat, lng } = req.body;

  if (!name || !phone || !address || !order) {
    return res.json({ success: false, message: "يرجى ملء جميع الحقول" });
  }

  const newOrder = {
    id: Date.now().toString(),
    name,
    phone,
    address,
    order,
    lat,
    lng,
    status: "pending",
    driverId: null,
    date: new Date(),
  };

  orders.push(newOrder);

  res.json({ success: true, message: "تم إرسال الطلب" });
});

/* =========================
   عرض الطلبات
========================= */

app.get("/orders/pending", (req, res) => {
  res.json(orders.filter((o) => o.status === "pending"));
});

/* =========================
   طلب اشتراك سائق جديد
========================= */

app.post("/driver/request-subscription", (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.json({ success: false, message: "معلومات ناقصة" });
  }

  const exists =
    drivers.find((d) => d.phone === phone) ||
    subscriptionRequests.find((r) => r.phone === phone);

  if (exists) {
    return res.json({ success: false, message: "الرقم مسجل مسبقاً" });
  }

  subscriptionRequests.push({
    id: Date.now().toString(),
    phone,
    password,
  });

  res.json({ success: true, message: "تم إرسال الطلب للأدمن" });
});

/* =========================
   الأدمن - عرض طلبات الاشتراك
========================= */

app.get("/admin/subscription-requests", (req, res) => {
  res.json(subscriptionRequests);
});

/* =========================
   الأدمن - قبول الطلب
========================= */

app.post("/admin/approve-request", (req, res) => {
  const { requestId } = req.body;

  const request = subscriptionRequests.find((r) => r.id === requestId);

  if (!request) {
    return res.json({ success: false, message: "الطلب غير موجود" });
  }

  // إنشاء السائق كمفعل
  drivers.push({
    id: Date.now().toString(),
    name: "Driver",
    phone: request.phone,
    password: request.password,
    subscribed: true,
    active: false,
    totalOrders: 0,
  });

  // حذف الطلب من قائمة الانتظار
  subscriptionRequests = subscriptionRequests.filter(
    (r) => r.id !== requestId
  );

  res.json({ success: true, message: "تم قبول السائق" });
});

/* =========================
   تسجيل الدخول
========================= */

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

/* =========================
   تسجيل الخروج
========================= */

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
    return res.json({ success: false, message: "الطلب مأخوذ" });
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

  if (order.driverId !== driverId) {
    return res.json({ success: false, message: "ليس هذا طلبك" });
  }

  order.status = "done";

  const driver = drivers.find((d) => d.id === driverId);
  if (driver) driver.totalOrders++;

  res.json({ success: true });
});

/* ========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port " + PORT));
