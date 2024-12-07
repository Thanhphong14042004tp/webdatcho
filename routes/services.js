const express = require('express');
const Service = require('../models/Service');
const router = express.Router();

// Lấy danh sách dịch vụ
router.get('/', async (req, res) => {
  try {
    const services = await Service.find();
    res.json({ services });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Thêm dịch vụ mới
router.post('/', async (req, res) => {
  const { name, description, price } = req.body;

  try {
    const service = new Service({ name, description, price });
    await service.save();
    res.json(service);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
