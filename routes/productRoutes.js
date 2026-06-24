const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

const normalizeProductBody = (body) => ({
  name: body.name,
  description: body.description,
  price: Number(body.price),
  stock: Number(body.stock),
  supplier: body.supplier || undefined,
});

// Create product
router.post('/', async (req, res) => {
  try {
    const product = new Product(normalizeProductBody(req.body));
    await product.save();
    const savedProduct = await Product.findById(product._id).populate('supplier');
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('supplier').sort({ createdAt: -1, name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      normalizeProductBody(req.body),
      { new: true, runValidators: true },
    ).populate('supplier');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
