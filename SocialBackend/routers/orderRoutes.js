const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { v4: uuidv4 } = require('uuid');

// GET all orders for an institute (filter by status)
router.get('/', async (req, res) => {
  try {
    const { institute_uuid, status } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });

    const query = { institute_uuid };
    if (status === 'delivered') {
      query.status = 'delivered';
    } else if (status === 'active') {
      query.status = { $ne: 'delivered' };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create order
router.post('/', async (req, res) => {
  try {
    const { institute_uuid, customerName, customerMobile, items, totalAmount, address, notes, createdBy } = req.body;
    if (!institute_uuid || !customerName) {
      return res.status(400).json({ success: false, message: 'institute_uuid and customerName are required' });
    }
    const order = new Order({ order_uuid: uuidv4(), institute_uuid, customerName, customerMobile, items, totalAmount, address, notes, createdBy });
    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update order (status change, etc.)
router.put('/:uuid', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { order_uuid: req.params.uuid },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE order
router.delete('/:uuid', async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ order_uuid: req.params.uuid });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
