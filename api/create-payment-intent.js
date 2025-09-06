const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// --- CONFIGURATION ---
// This list is the security whitelist for your function.
// IMPORTANT: Make sure your Live Server address and final GoDaddy domain are in this list.
const ALLOWED_ORIGINS = [
  "https://www.pdmsusa.com", // Your future production domain
  "http://127.0.0.1:5500"    // Your local Live Server for testing
];

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  // Security Check: This block ensures only sites from your list can access the function.
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Browsers send a "preflight" OPTIONS request first to check security. This handles it.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests for the actual payment processing.
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

