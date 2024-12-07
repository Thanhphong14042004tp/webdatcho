const express = require('express');
const jwt = require('jsonwebtoken');
const Reservation = require('../models/Reservation');

const router = express.Router();

// Middleware to verify token
function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
}

// Create reservation
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { service_id, date, time, number_of_people } = req.body;
        const reservation = new Reservation({
            user_id: req.user.userId,
            service_id,
            date,
            time,
            number_of_people,
        });
        await reservation.save();
        res.status(201).json(reservation);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

// Get user reservations
router.get('/', authenticateToken, async (req, res) => {
    try {
        const reservations = await Reservation.find({ user_id: req.user.userId });
        res.status(200).json(reservations);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

// Delete reservation
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Reservation.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Reservation not found' });
        res.status(200).json({ message: 'Reservation deleted' });
    } catch (err) {
        res.status(500).json(err.message);
    }
});

module.exports = router;
