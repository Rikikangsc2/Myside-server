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

    const json = {endpoint:base+"/api/gemini?prompt=",status : 200, result : response.data.candidates[0].content.parts[0].text}
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
        const json = {endpoint:base+'/api/gpt?prompt=',status:200, result:data.gpt}
        const red = Buffer.from(JSON.stringify(json)).toString('base64')
        res.redirect(succes+red);
    } catch (err) {
        console.log(err)
        res.redirect(failed);
    }
});

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
  const randomApiKey = Math.floor(Math.random() * apiKeys.length);
  const apiKey = apiKeys[randomApiKey];

  let response;

  try {
    const data = { "inputs": prompt };
    const primaryUrl = 'https://api-inference.huggingface.co/models/sd-community/sdxl-flash';
    response = await axios.post(primaryUrl, data, { headers: { Authorization: apiKey }, responseType: 'arraybuffer' });
  } catch (error) {
    for (const apiUrl of alternativeAPIs) {
      try {
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
      endpoint:base+'/api/diff?prompt=',
      status: 200,
      url: `https://telegra.ph${imageUrl}`
    };
    const red = Buffer.from(JSON.stringify(result)).toString('base64')
    res.redirect(succes+red);
  } catch (uploadError) {
    console.error('Upload to Telegra.ph failed:', uploadError.message);
    return res.redirect(failed)
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
    const json = {endpoint: base+'/api/snapsave?url=',status: 200,type, result: hasil};
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
    let info = await ytdl.getInfo(url);
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    ytdl(url, { filter : 'audioonly' }).pipe(res);
});

app.get('/yt-mp4', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).send('URL tidak valid');
    }
    let info = await ytdl.getInfo(url);
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    ytdl(url, { filter: 'videoandaudio' }).pipe(res);
});

app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});
