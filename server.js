import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({
    origin: ['https://alienfront.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

const APP_MODE = process.env.APP_MODE || 'TEST';

const CASHFREE_ID = APP_MODE === 'PROD' ? process.env.CASHFREE_ID_PROD : process.env.CASHFREE_ID_TEST;
const CASHFREE_SECRET = APP_MODE === 'PROD' ? process.env.CASHFREE_SECRET_PROD : process.env.CASHFREE_SECRET_TEST;
const BASE_URL = APP_MODE === 'PROD'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

console.log(`Starting Server in ${APP_MODE} mode`);

app.post('/api/create-order', async (req, res) => {
    try {
        const { orderId, amount, customerName, customerPhone, customerEmail, returnUrl } = req.body;

        // Use the passed returnUrl, falling back to a default if not present
        const metaReturnUrl = returnUrl || `http://localhost:5173/order-status?order_id={order_id}`;

        const response = await axios.post(`${BASE_URL}/orders`, {
            order_id: orderId,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: customerPhone, // Using phone as unique customer ID for now
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone
            },
            order_meta: {
                return_url: metaReturnUrl
            }
        }, {
            headers: {
                'x-client-id': CASHFREE_ID,
                'x-client-secret': CASHFREE_SECRET,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error creating order:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.post('/api/verify-payment', async (req, res) => {
    try {
        const { orderId } = req.body;
        const response = await axios.get(`${BASE_URL}/orders/${orderId}`, {
            headers: {
                'x-client-id': CASHFREE_ID,
                'x-client-secret': CASHFREE_SECRET,
                'x-api-version': '2023-08-01'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error verifying order:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
