const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();


app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./fakestore.db', (err) => {
  if (err) console.error(err.message);
  else console.log('✅ Connected to fakestore.db SQLite DB');

  // Initialize products in the DB
  initializeProducts();
});

db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    title TEXT,
    price REAL,
    description TEXT,
    category TEXT,
    image TEXT,
    rate REAL,
    count INTEGER
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS checkout (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    total REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create checkout_items table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS checkout_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkout_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (checkout_id) REFERENCES checkout(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

async function initializeProducts() {
  try {
    const response = await axios.get('https://fakestoreapi.com/products');
    const products = response.data;

    products.forEach(product => {
      db.run(
        `INSERT OR IGNORE INTO products (
          id, title, price, description, category, image, rate, count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.title,
          product.price,
          product.description,
          product.category,
          product.image,
          product.rating.rate,
          product.rating.count,
        ]
      );
    });

    console.log('✅ Products table filled with Fake Store API data');
  } catch (err) {
    console.error('❌ Error initializing products:', err.message);
  }
}

app.get('/api/products', (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/cart', (req, res) => {
  const { user_id, product_id } = req.body;

  const checkQuery = `
    SELECT * FROM cart WHERE user_id = ? AND product_id = ?
  `;

  db.get(checkQuery, [user_id, product_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      // If exists, increment qty
      const updateQuery = `
        UPDATE cart SET qty = qty + 1 WHERE id = ?
      `;
      db.run(updateQuery, [row.id], function (err) {
        if (err) return res.status(500).json({ error: "Failed to update quantity" });
        return res.json({ message: "Quantity incremented", cartItemId: row.id });
      });
    } else {
      // If not exists, insert new
      const insertQuery = `
        INSERT INTO cart (user_id, product_id, qty) VALUES (?, ?, 1)
      `;
      db.run(insertQuery, [user_id, product_id], function (err) {
        if (err) return res.status(500).json({ error: "Failed to add product to cart" });
        return res.json({ message: "Item added to cart", cartItemId: this.lastID });
      });
    }
  });
});



app.get('/api/cart', (req, res) => {
  const userId = req.query.user_id || 'mock123';  // default user for now

  const query = `
    SELECT cart.id as cart_id, cart.qty, products.*
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error("Error fetching cart items:", err.message);
      return res.status(500).json({ error: "Error retrieving cart data" });
    }
    res.json(rows);
  });
});

// Remove item from cart
app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM cart WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        console.error("Error deleting from cart:", err.message);
        return res.status(500).json({ error: "Error deleting cart item" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json({ message: "Item removed from cart" });
    }
  );
});

app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM cart WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        console.error("Error deleting from cart:", err.message);
        return res.status(500).json({ error: "Error deleting cart item" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json({ message: "Item removed from cart" });
    }
  );
});

// Checkout API: process order and return receipt

function valid(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

app.post('/api/checkout', (req, res) => {
  const { customer_name, customer_email } = req.body;
  const userId = 'mock123';

  if (!customer_name || !valid(customer_email)) {
    return res.status(400).json({ error: "Missing customer data" });
  }



  // Fetch cart items from DB
  const cartQuery = `
    SELECT cart.product_id, cart.qty, products.title, products.price
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `;

  db.all(cartQuery, [userId], (err, cartItems) => {
    if (err) {
      console.error("Error fetching cart items:", err.message);
      return res.status(500).json({ error: "Failed to fetch cart items" });
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    // Insert checkout
    const insertCheckoutQuery = `
      INSERT INTO checkout (customer_name, customer_email, total)
      VALUES (?, ?, ?)
    `;
    db.run(insertCheckoutQuery, [customer_name, customer_email, total], function (err) {
      if (err) {
        console.error("Error during checkout:", err.message);
        return res.status(500).json({ error: "Checkout failed" });
      }

      const checkoutId = this.lastID;

      // Insert each cart item into checkout_items
      const insertItemQuery = `
        INSERT INTO checkout_items (checkout_id, product_id, qty, price)
        VALUES (?, ?, ?, ?)
      `;

      cartItems.forEach(item => {
        db.run(insertItemQuery, [checkoutId, item.product_id, item.qty, item.price]);
      });

      // Clear user's cart after checkout
      const clearCartQuery = `DELETE FROM cart WHERE user_id = ?`;
      db.run(clearCartQuery, [userId]);

      // Respond with receipt
      res.json({
        customer_name,
        customer_email,
        total,
        timestamp: new Date().toISOString(),
        items: cartItems.map(item => ({
          name: item.title,
          qty: item.qty,
          price: item.price
        }))
      });
    });
  });
});



app.listen(5000, () => {
  console.log('🚀 Server running at http://localhost:5000');
});