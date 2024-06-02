const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');
const scrap = require('@bochilteam/scraper');
const axios = require('axios');
const { gpt } = require('gpti');
const app = express();
const failed = "https://nue-api.vercel.app/error"
const FormData = require('form-data');
const succes = "https://nue-api.vercel.app/succes?re=";
const base = "https://nue-api.vercel.app";
const gis = require('g-i-s');

let data = {
  today: 0,
  yesterday: 0,
  total: 0,
  lastDate: new Date().getDate()
};

if (!fs.existsSync('data.json')) {
  fs.writeFileSync('data.json', JSON.stringify(data));
} else {
  data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
}

app.get('/diff', async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).send('Prompt query parameter is required');
  }

  const alternativeAPIs = [
    'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
    'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5'
  ];

  const apiKeys = [
    "Bearer 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",
    "Bearer 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",
    "Bearer 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"
  ];

  let response;

  try {
    const randomApiKey = Math.floor(Math.random() * apiKeys.length);
    const apiKey = apiKeys[randomApiKey];

    const data = { "inputs": prompt };
    const primaryUrl = 'https://api-inference.huggingface.co/models/sd-community/sdxl-flash';
    response = await axios.post(primaryUrl, data, { headers: { Authorization: apiKey }, responseType: 'arraybuffer' });
  } catch (error) {
    for (const apiUrl of alternativeAPIs) {
      try {
        const randomApiKey = Math.floor(Math.random() * apiKeys.length);
        const apiKey = apiKeys[randomApiKey];

        const data = { "inputs": prompt };
        response = await axios.post(apiUrl, data, { headers: { Authorization: apiKey }, responseType: 'arraybuffer' });
        break;
      } catch (alternativeError) {
        console.error('Alternative API failed:', alternativeError.message);
      }
    }
  }

  if (!response) {
    return res.redirect(failed);
  }

  // Upload the image to Telegra.ph
  try {
    const form = new FormData();
    form.append('file', response.data, { filename: 'image.jpg', contentType: 'image/jpeg' });

    const uploadResponse = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders() });

    const imageUrl = uploadResponse.data[0].src;
    const result = {
      endpoint: base+'/api/diff?prompt='+encodeURIComponent(prompt),
      status: 200,
      url: `https://telegra.ph${imageUrl}`
    };
    const red = Buffer.from(JSON.stringify(result)).toString('base64');
    res.redirect(success + red);
  } catch (uploadError) {
    console.error('Upload to Telegra.ph failed:', uploadError.message);
    return res.redirect(failed);
  }
});


app.get('/count', (req, res) => {
  const currentDate = new Date().getDate();
  if (currentDate !== data.lastDate) {
    data.yesterday = data.today;
    data.today = 0;
    data.lastDate = currentDate;
  }
  data.today += 1;
  data.total += 1;
  fs.writeFileSync('data.json', JSON.stringify(data));
  res.json(data);
});

app.get('/read', (req, res) => {
  const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  res.json(data);
});

app.get('/image', async (req, res) => {
  const query = req.query.query;

  try {
    const results = await new Promise((resolve, reject) => {
      gis(query, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    const urls = results
      .filter(result => result.width >= 800 && result.height >= 600)
      .map(result => result.url);

    const checkUrl = async (url) => {
      try {
        const response = await axios.head(url);
        return (response.status === 200 && response.headers['content-type'].startsWith('image')) ? url : null;
      } catch (error) {
        return null;
      }
    };

    const getValidUrl = async () => {
      while (urls.length > 0) {
        const randomIndex = Math.floor(Math.random() * urls.length);
        const url = urls.splice(randomIndex, 1)[0];
        const validUrl = await checkUrl(url);
        if (validUrl) {
          return validUrl;
        }
      }
      return null;
    };

    const validUrl = await getValidUrl();

    if (validUrl) {
      const imageResponse = await axios.get(validUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(imageResponse.data, 'binary');

      const form = new FormData();
      form.append('file', buffer, { filename: 'image.jpg' });

      const uploadResponse = await axios.post('https://telegra.ph/upload', form, {
        headers: {
          ...form.getHeaders()
        }
      });

      if (uploadResponse.data && uploadResponse.data[0] && uploadResponse.data[0].src) {
        const telegraPhUrl = 'https://telegra.ph' + uploadResponse.data[0].src;

        const json = {
          endpoint: base + '/api/image?query=' + encodeURIComponent(query),
          status: 200,
          result: telegraPhUrl
        };
        const red = Buffer.from(JSON.stringify(json)).toString('base64');
        res.redirect(succes + red);
      } else {
        res.redirect(failed);
      }
    } else {
      res.redirect(failed);
    }
  } catch (error) {
    res.redirect(failed);
  }
});

app.get('/gemini', async (req, res) => {
  try {
    if (!req.query.prompt) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyB2tVdHido-pSjSNGrCrLeEgGGW3y28yWg', {
      contents: [{
        parts: [{
          text: req.query.prompt
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = {endpoint:base+"/api/gemini?prompt="+encodeURIComponent(req.query.prompt),status : 200, result : response.data.candidates[0].content.parts[0].text}
    const red = Buffer.from(JSON.stringify(json)).toString('base64');
  res.redirect(succes+red);
  } catch (error) {
    res.redirect(failed)
  }
});
app.get('/gpt', async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).send('Model and prompt query parameters are required');
    }

    try {
        const data = await new Promise((resolve, reject) => {
            gpt({
                messages: [],
                prompt: prompt,
                model: 'gpt-4',
                markdown: false
            }, (err, data) => {
                if (err != null) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        const json = {endpoint:base+'/api/gpt?prompt='+encodeURIComponent(prompt),status:200, result:data.gpt}
        const red = Buffer.from(JSON.stringify(json)).toString('base64')
        res.redirect(succes+red);
    } catch (err) {
        console.log(err)
        res.redirect(failed);
    }
});

app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, './index.html'));
});

app.get('/snapsave', async (req, res) => {
  try {
    if (!req.query.url) {
      return res.status(400).json({
        status: 400,
        message: "Masukkan parameter url"
      });
    }

    const hasil = await scrap.snapsave(req.query.url);
    const response = await axios.head(hasil[0].url);
    let type = 'video';
    if (response.headers['content-type'].includes('image')) {
      type = 'image';
    } else if (response.headers['content-type'].includes('video')) {
      type = 'video';
    }
    const json = {endpoint: base+'/api/snapsave?url='+encodeURIComponent(req.query.url),status: 200,type, result: hasil};
    res.redirect(succes + Buffer.from(JSON.stringify(json)).toString('base64')); 
  } catch (error) {
    console.error(error);
    res.redirect(failed);
  }
});

app.get('/yt-mp3', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).send('URL tidak valid');
    }
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    ytdl(url, { filter : 'audioonly' }).pipe(res);
});

app.get('/yt-mp4', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).send('URL tidak valid');
    }
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    ytdl(url, { filter: 'videoandaudio' }).pipe(res);
});

app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});
