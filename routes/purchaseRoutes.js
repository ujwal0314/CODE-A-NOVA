const express = require('express');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const router = express.Router();

// Create purchase
router.post('/', async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);
    const product = await Product.findById(req.body.product);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Purchase quantity must be greater than zero' });
    }

    const purchase = new Purchase({ ...req.body, quantity });
    await purchase.save();

    product.stock += quantity;
    product.supplier = req.body.supplier;
    await product.save();

    const savedPurchase = await Purchase.findById(purchase._id)
      .populate('product')
      .populate('supplier');
    res.status(201).json(savedPurchase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('product')
      .populate('supplier')
      .sort({ date: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
