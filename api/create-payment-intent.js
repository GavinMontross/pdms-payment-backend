const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Allow requests from your GoDaddy domain
  res.setHeader('Access-Control-Allow-Origin', '*'); // For testing, '*' is ok. For production, replace with 'https://yourgodaddydomain.com'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, companyName, invoiceNumber } = req.body;
    const baseAmountInCents = Math.round(parseFloat(amount) * 100);
    const finalAmountInCents = Math.round(baseAmountInCents * 1.03);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        companyName: companyName,
        invoiceNumber: invoiceNumber,
        baseAmount: `$${(baseAmountInCents / 100).toFixed(2)}`,
        surcharge: `$${((finalAmountInCents - baseAmountInCents) / 100).toFixed(2)}`
      }
    });

    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};