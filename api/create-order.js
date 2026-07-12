// api/create-order.js
export default async function handler(request, response) {
  // CORS Headers lagana zaroori hai taaki frontend block na kare
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method === 'POST') {
    try {
      const { amount } = request.body;
      const zapupi_key = process.env.ZAPUPI_KEY;

      // ZapUPI ko call karne ke liye hum node ka inbuilt fetch use karenge
      const zapResponse = await fetch('https://api.zapupi.com/v1/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: zapupi_key,
          amount: amount,
          order_id: "ORD" + Date.now()
        })
      });

      const data = await zapResponse.json();
      
      // Frontend ko JSON response bhej rahe hain
      return response.status(200).json(data);

    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  } else {
    return response.status(405).json({ error: 'Method not allowed' });
  }
}
