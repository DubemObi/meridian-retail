/**
 * Meridian Retail Group — Catalog Service
 * Express service serving product listings from PostgreSQL.
 */

const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://meridian:meridian_dev@postgres:5432/meridian_db',
});

// ── Seed data on startup ────────────────────────────────────────────────
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query('SELECT COUNT(*) FROM products');
  if (parseInt(rows[0].count) === 0) {
    const seed = [
      ['MRD-001', 'Ankara Print Tote Bag', 'Handwoven cotton tote with traditional print', 24.99, 120, 'Bags'],
      ['MRD-002', 'Leather Sandals', 'Genuine leather, handmade', 39.99, 85, 'Footwear'],
      ['MRD-003', 'Beaded Necklace Set', 'Three-piece beaded jewellery set', 18.50, 200, 'Jewellery'],
      ['MRD-004', 'Kente Cloth Scarf', 'Premium woven scarf', 32.00, 60, 'Accessories'],
      ['MRD-005', 'Shea Butter Body Cream', '100% organic, 250ml', 12.99, 300, 'Beauty'],
    ];
    for (const p of seed) {
      await pool.query(
        'INSERT INTO products (sku, name, description, price, stock, category) VALUES ($1,$2,$3,$4,$5,$6)',
        p
      );
    }
    console.log('Seeded product catalog');
  }
}

// ── Routes ───────────────────────────────────────────────────────────────
app.get('/healthz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'ok', service: 'catalog-service' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: 'error' });
  }
});

app.get('/api/catalog/products', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    query += ' ORDER BY id';
    const { rows } = await pool.query(query, params);
    res.status(200).json({ count: rows.length, products: rows });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/catalog/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/catalog/products', async (req, res) => {
  const { sku, name, description, price, stock, category } = req.body;
  if (!sku || !name || price === undefined) {
    return res.status(400).json({ error: 'sku, name, and price are required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO products (sku, name, description, price, stock, category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [sku, name, description || '', price, stock || 0, category || 'Uncategorised']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Internal endpoint — called by orders-service to check/decrement stock
app.patch('/api/catalog/products/:id/stock', async (req, res) => {
  const { delta } = req.body; // negative to decrement
  try {
    const { rows } = await pool.query(
      'UPDATE products SET stock = stock + $1 WHERE id = $2 AND stock + $1 >= 0 RETURNING *',
      [delta, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(409).json({ error: 'Insufficient stock or product not found' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  ensureTable()
    .then(() => {
      app.listen(PORT, () => console.log(`Catalog Service listening on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to initialise database:', err);
      process.exit(1);
    });
}

module.exports = { app, pool, ensureTable };
