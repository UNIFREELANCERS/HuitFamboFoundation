/**
 * Simple Express server that handles Mpesa Daraja STK Push donations.
 * Replace the sandbox credentials in .env with your live ones when ready.
 */

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const {
  DARAJA_CONSUMER_KEY,
  DARAJA_CONSUMER_SECRET,
  BUSINESS_SHORT_CODE,
  PASSKEY,
  CALLBACK_URL,
  PORT = 5000,
} = process.env;

if (!DARAJA_CONSUMER_KEY || !DARAJA_CONSUMER_SECRET) {
  console.warn('⚠️  Missing Daraja credentials. Update your .env file.');
}

const app = express();
app.use(cors());
app.use(express.json());

const tokenUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

function formatTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const MM = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
}

async function getAccessToken() {
  const credentials = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64');
  const response = await fetch(tokenUrl, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Daraja token');
  }

  const data = await response.json();
  return data.access_token;
}

app.post('/mpesa/pay', async (req, res) => {
  try {
    const { phone, amount, name } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Phone and amount are required' });
    }

    const token = await getAccessToken();
    const timestamp = formatTimestamp();
    const password = Buffer.from(`${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Number(amount),
      PartyA: phone,
      PartyB: BUSINESS_SHORT_CODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: name || 'HuitFamboDonation',
      TransactionDesc: 'Huit Fambo Donation',
    };

    const stkResponse = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const stkData = await stkResponse.json();

    if (stkResponse.status >= 400) {
      return res.status(500).json({ error: stkData.errorMessage || 'Mpesa request failed' });
    }

    return res.json({
      message: 'Mpesa STK push initiated. Complete the prompt on your phone.',
      data: stkData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/mpesa/callback', (req, res) => {
  console.log('Mpesa Callback:', JSON.stringify(req.body, null, 2));
  res.json({ status: 'received' });
});

app.listen(PORT, () => {
  console.log(`Daraja server running on http://localhost:${PORT}`);
});

