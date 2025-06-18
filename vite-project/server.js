// server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS from localhost:5173

app.get('/api/checkoutrules', async (req, res) => {
  const { pincode = '457777' } = req.query;
  try {
    const response = await axios.get(
      'https://ulcheckout.extensions.swadeshz5.de/api/v1/checkoutrules',
      {
        params: { pincode },
        headers: {
          'x-application-data': JSON.stringify({
            company_id: '17',
            _id: '65f437fae78851028707daee',
            applicationId: '65f437fae78851028707daee',
          }),
        },
        maxBodyLength: Infinity
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy fetch failed' });
  }
});

app.listen(port, () => console.log(`Proxy server listening on http://localhost:${port}`));
