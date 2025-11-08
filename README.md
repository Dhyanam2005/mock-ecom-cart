#  Mock E-Commerce Cart

A full-stack shopping cart application built as part of an internship assignment for **Vibe Commerce**.  
The app allows users to browse products, add them to cart, update quantities, remove items, and complete mock checkout using a checkout modal and local SQLite database.

### 🏃‍♂️ How to Run the Project

#### 1. Start the Backend Server

```bash
cd backend
npm install       
nodemon server.js  

cd frontend
npm install        
npm start          

---

##  Features

###  Frontend (React)
- Products grid with **Add to Cart** button
- Cart page with:
  - Item list  
  - Increment / Decrement quantity  
  - Remove item  
  - Auto-updated cart total  
- Checkout modal with customer form
- Receipt preview after ordering
- Responsive UI with modern styling

###  Backend (Node.js + Express)
- REST APIs:
  - `GET /api/products` – Fetch all products
  - `POST /api/cart` – Add to cart or update quantity
  - `GET /api/cart` – View cart items + total
  - `PUT /api/cart/:id` – Update item qty
  - `DELETE /api/cart/:id` – Remove from cart
  - `POST /api/checkout` – Store checkout details + return receipt

- SQLite database with 4 tables:
  - `products`
  - `cart`
  - `checkout`
  - `checkout_items`

- Fake Store API integration to populate products

---

##  Tech Stack

| Layer     | Tech                         |
|-----------|------------------------------|
| Frontend  | React, Fetch API, CSS         |
| Backend   | Node.js, Express.js, SQLite   |
| Database  | SQLite (file-based DB)        |
| API       | REST                          |

---

<img width="1920" height="1080" alt="Screenshot (475)" src="https://github.com/user-attachments/assets/0bc51b5e-1d6b-4b78-a588-bc13e6a1fa96" />
Products
<img width="1920" height="1080" alt="Screenshot (478)" src="https://github.com/user-attachments/assets/0f8f4ef3-4370-49bb-bc57-89c6b6795d7a" />
<img width="1920" height="1080" alt="Screenshot (480)" src="https://github.com/user-attachments/assets/d0d45de4-30bb-4b07-862c-dc0f44f86ce9" />
Checkout



