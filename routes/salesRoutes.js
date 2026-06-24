const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const router = express.Router();

// Create sale
router.post('/', async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);
    const product = await Product.findById(req.body.product);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Sale quantity must be greater than zero' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock for this sale' });
    }

    const sale = new Sale({ ...req.body, quantity });
    await sale.save();

    product.stock -= quantity;
    await product.save();

    const savedSale = await Sale.findById(sale._id).populate('product');
    res.status(201).json(savedSale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().populate('product').sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
