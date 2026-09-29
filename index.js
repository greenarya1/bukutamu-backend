// index.js
const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Middleware untuk membaca JSON dari request body
app.use(express.json());

// Endpoint untuk menerima webhook dari Midtrans
app.post('/midtrans-webhook', (req, res) => {
    const notification = req.body;
    console.log('✅ Notifikasi diterima:', notification);

    // 1. Verifikasi Signature Key (untuk keamanan)
    const serverKey = 'GANTI_DENGAN_SERVER_KEY_MIDTRANS_SANDBOX_ANDA'; // Nanti kita isi
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    
    const hash = crypto
        .createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest('hex');

    if (hash !== notification.signature_key) {
        console.warn('❌ Signature tidak valid!');
        return res.status(403).send('Invalid signature');
    }

    // 2. Cek Status Transaksi
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log(`📊 Status: ${transactionStatus}, Fraud: ${fraudStatus}`);

    // 3. Logika untuk update paket user (nanti kita isi)
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        if (fraudStatus === 'accept' || transactionStatus === 'settlement') {
            // Pembayaran sukses! Di sini kita akan update Firestore.
            console.log('🎉 Pembayaran berhasil untuk order:', orderId);
            
            // TODO: Update Firestore (kita bahas di langkah berikutnya)
        }
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        console.log('❌ Pembayaran gagal atau dibatalkan:', transactionStatus);
    }

    // Selalu kirim respons 200 OK ke Midtrans
    res.status(200).send('OK');
});

// Endpoint health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'bukutamu-midtrans-webhook' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'BUKUTAMU Webhook Server', status: 'running' });
});

app.listen(port, () => {
    console.log(`🚀 Webhook server berjalan di port ${port}`);
});