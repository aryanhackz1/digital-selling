const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { amount, order_id, remark } = req.body;

    // Validate required fields
    if (!amount || !order_id) {
      return res.status(400).json({
        success: false,
        error: 'Amount and order_id are required'
      });
    }

    // Get ZapUPI Key from environment variables
    const zapupiKey = process.env.ZAPUPI_KEY;
    
    if (!zapupiKey) {
      console.error('ZAPUPI_KEY environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Payment gateway configuration error'
      });
    }

    // Prepare ZapUPI API request
    const zapupiApiUrl = 'https://zapupi.com/api/create-order';
    const requestData = {
      zap_key: zapupiKey,
      order_id: order_id,
      amount: amount.toString(),
      remark: remark || 'ARYAN TECHX Digital Product'
    };

    console.log('Creating ZapUPI order:', requestData);

    // Call ZapUPI API
    const response = await axios.post(zapupiApiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    // Check if response has payment URL
    if (response.data && response.data.payment_url) {
      console.log('✅ Order created successfully:', response.data.order_id);
      
      return res.status(200).json({
        success: true,
        payment_url: response.data.payment_url,
        order_id: response.data.order_id || order_id
      });
    } else {
      console.error('❌ Invalid response from ZapUPI:', response.data);
      
      return res.status(500).json({
        success: false,
        error: 'Invalid response from payment gateway',
        details: response.data
      });
    }

  } catch (error) {
    console.error('❌ ZapUPI API Error:', error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }

    return res.status(500).json({
      success: false,
      error: 'Payment gateway error: ' + error.message
    });
  }
};