const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Service = require('./models/Service');
const Reservation = require('./models/Reservation');
const authMiddleware = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
app.use(express.json());

// Cấu hình phục vụ các file tĩnh (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));

// Middleware xác thực JWT
const protect = authMiddleware.protect;

// Đăng ký người dùng
app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;
    const userExist = await User.findOne({ username });

    if (userExist) return res.status(400).json({ message: 'Username already exists' });

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
});

// Đăng nhập và trả về token
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// Lấy danh sách dịch vụ
app.get('/services', async (req, res) => {
    const services = await Service.find();
    res.json(services);
});

// Tạo đặt chỗ mới
app.post('/reservations', protect, async (req, res) => {
    const { service_id, date, time, number_of_people } = req.body;
    const reservation = new Reservation({
        user_id: req.user.userId,
        service_id,
        date,
        time,
        number_of_people
    });
    await reservation.save();
    res.status(201).json(reservation);
});

// Lấy danh sách đặt chỗ của người dùng
app.get('/reservations', protect, async (req, res) => {
    const reservations = await Reservation.find({ user_id: req.user.userId }).populate('service_id');
    res.json(reservations);
});

// Xóa đặt chỗ
app.delete('/reservations/:id', protect, async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    if (reservation.user_id.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ message: 'You can only delete your own reservations' });
    }

    await reservation.remove();
    res.json({ message: 'Reservation deleted' });
});

// Khởi động ứng dụng
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
