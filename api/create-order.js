// ============================================================
// VERCEL SERVERLESS FUNCTION - ZapUPI Payment Integration
// ============================================================

export default async function handler(req, res) {
    // Enable CORS for all origins (for development)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        // Get data from request body
        const { action, amount, order_id } = req.body;

        // Validate required fields
        if (!action || !amount || !order_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: action, amount, order_id'
            });
        }

        // Validate amount
        const amountNum = parseInt(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount. Must be a positive number.'
            });
        }

        // Get ZapUPI key from environment variable
        const ZAPUPI_KEY = process.env.ZAPUPI_KEY;
        if (!ZAPUPI_KEY) {
            console.error('ZAPUPI_KEY environment variable is not set');
            return res.status(500).json({
                success: false,
                error: 'Payment gateway configuration error'
            });
        }

        // Prepare remark based on action
        let remark = '';
        if (action === 'deposit') {
            remark = 'Wallet Deposit | ARYAN TECHX';
        } else if (action === 'checkout') {
            remark = 'ARYAN TECHX Product Purchase';
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Must be "deposit" or "checkout"'
            });
        }

        // Prepare data for ZapUPI API
        const postData = {
            zap_key: ZAPUPI_KEY,
            order_id: order_id,
            amount: amount.toString(),
            remark: remark
        };

        console.log('Creating ZapUPI order:', { order_id, amount, action });

        // Call ZapUPI API to create order
        const response = await fetch('https://zapupi.com/api/v1/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        });

        // Get response data
        const data = await response.json();
        console.log('ZapUPI Response:', data);

        // Check if order creation was successful
        if (response.ok && data && data.payment_url) {
            // Return payment URL to frontend
            return res.status(200).json({
                success: true,
                payment_url: data.payment_url,
                order_id: order_id,
                amount: amount
            });
        } else {
            // Handle error from ZapUPI
            console.error('ZapUPI Error:', data);
            return res.status(500).json({
                success: false,
                error: data.message || 'Failed to create payment order'
            });
        }

    } catch (error) {
        // Handle any unexpected errors
        console.error('Server Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
}
