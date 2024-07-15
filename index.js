const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');
const scrap = require('@bochilteam/scraper');
const axios = require('axios');
const { gpt, dalle } = require('gpti');
const app = express();
const failed = "https://nue-api.vercel.app/error"
const FormData = require('form-data');
const succes = "https://nue-api.vercel.app/succes?re=";
const base = "https://nue-api.vercel.app";
const gis = require('g-i-s');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const { RsnChat } = require("rsnchat");

const rsnchat = new RsnChat("rsnai_SQPKHQEtlKlh8s9cjovGIiOp");


const chatHistory = {};
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

const listapikey = ["8f62a0ea-cd83-4003-b809-6803bf9dd619","09c4a774-bf77-474a-b09b-45d63005160b","7e8ee357-c24c-450e-993b-ecc7458a6607","91eb053f-ae98-4baa-a2b0-1585f6199979","17a57da9-df4a-48c2-8d49-5bfc390174d2","6dc6600b-893a-4550-a980-a12c5f015288","4a465c34-f761-4de3-a9f8-b791ac7c5f43","cccdaf86-5e20-4b02-90cf-0e2dfa2ae19f"]

const apikey = () => {
  const randomIndex = Math.floor(Math.random() * listapikey.length);
  return listapikey[randomIndex];
};

//*
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/hasil.jpeg', express.static(path.join(__dirname, 'hasil.jpeg')));

app.get('/sdlist',async(req,res)=>{await sdList(res)})
app.get('/sdxllist',async(req,res)=>{await sdxlList(res)})
//Router
app.get('/bard', async (req, res)=>{
    if (!req.query.text) return res.status(400).send("Masukkan parameter text");
    try {
    const regex = /\[([^\]]+)\]\([^\)]+\)/g;
    const response = await rsnchat.bard(req.query.text);
response.message = response.message.replace(/(\*\*)/g, "*");
response.message = response.message.replace(regex, '$1');
    const json = {endpoint:base+'/api/bard?text='+encodeURIComponent(req.query.text),result: response.message};
    const red = encodeURIComponent(JSON.stringify(json));
    res.redirect(succes+red);
    } catch (error) {
        res.redirect(failed)
    }
});
app.get('/diff', async (req, res) => {
  const preset = req.query.preset;
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    res.redirect(failed)
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sd/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
        data: {
    width: 1024,
    height: 1024,
    sampler: 'DPM++ 2M Karras',
    upscale: true,
    seed: -1,
    cfg_scale: 7,
    steps: 20,
    style_preset: preset,
    prompt: prompt,
    model: model}
      
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/diffpreset?model=${model}&preset=${preset}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    const enc = encodeURIComponent(JSON.stringify(json));
    return res.redirect(`${succes}${enc}`);
  } catch (error) {
    console.error(`generate failed: ${error.message}`);
    return res.redirect(failed);
  }
});
app.get('/sdxl', async (req, res) => {
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    res.redirect(failed)
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sdxl/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
        data: {width: 1024,
    height: 1024,
    sampler: 'DPM++ 2M Karras',
    upscale: true,
    seed: -1,
    cfg_scale: 7,
    steps: 20,
    model: model,
    prompt: prompt}
      
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/sdxl?model=${model}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    const enc = encodeURIComponent(JSON.stringify(json));
    return res.redirect(`${succes}${enc}`);
  } catch (error) {
    console.error(`generate failed: ${error.message}`);
    return res.redirect(failed);
  }
});
app.get('/text2img', async (req, res) => {
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    res.redirect(failed)
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sd/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
        data: {width: 1024,
    height: 1024,
    sampler: 'DPM++ 2M Karras',
    upscale: true,
    seed: -1,
    cfg_scale: 7,
    steps: 20,
    model: model,
    prompt: prompt}
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/text2img?model=${model}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    const enc = encodeURIComponent(JSON.stringify(json));
    return res.redirect(`${succes}${enc}`);
  } catch (error) {
    console.error(`generate failed: ${error.message}`);
    return res.redirect(failed);
  }
});
app.get('/upscale', async (req, res) => {
  const link = req.query.url;
  if (!link) {
    return res.status(400).send('URL parameter is required');
  }

  try {
    // Mengunduh gambar dari URl
    const response = await axios.get(link, { responseType: 'arraybuffer' });
    fs.writeFileSync('hasil.jpeg', response.data);
    const imageData = await axios.get(`https://tattered-classy-comic.glitch.me/hasil.jpeg`, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageData.data).toString('base64');
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/upscale',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
      data: {
        resize: 2, 
        model: 'SwinIR 4x',
        imageData: base64Image
      }
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/upscale?url=${encodeURIComponent(link)}`, data: data2 };
    const enc = encodeURIComponent(JSON.stringify(json));
    return res.redirect(`${succes}${enc}`);
  } catch (error) {
    console.error(`Upscale failed: ${error.message}`);
    return res.redirect(failed);
  }
});

app.get('/sgpt', async (req, res) => {
    const userId = req.query.user;
    const prompt = req.query.prompt;

    if (!chatHistory[userId]) {
        chatHistory[userId] = [];
    }

    const messages = chatHistory[userId]

    const payload = {
        messages: [
            {
                role: "system",
                content: `Anda adalah NueAI, NueAI adalah AI yang di buat NueAPI, NueAPI adalah platform yang menawarkan restFullApi gratis 100% di website s.id/nueapi. Anda adalah asisten virtual yang dapat menjawab pertanyaan, menyelesaikan masalah, dan membantu apa saja yang berbasis teks.`
            },
            ...messages.map(message => ({
                role: message.role,
                content: message.content
            })),
            {
                role: "user",
                content: prompt
            }
        ],
        "model": "llama3-70b-8192",
         "temperature": 1,
         "max_tokens": 1024,
         "top_p": 1,
         "stream": false,
         "stop": null
    };

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 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`
            }
        });

        const assistantMessage = {
            role: "assistant",
            content: response.data.choices[0].message.content
        };

        const json = {
            endpoint: `${base}/api/sgpt?user=UNTUK_SESION_CHAT&text=${encodeURIComponent(prompt)}`,
            result: response.data.choices[0].message.content,
            history: messages
        };
        const red = encodeURIComponent(JSON.stringify(json));
        res.redirect(`${succes}${red}`);
        
        chatHistory[userId].push({ role: "user", content: prompt });
        chatHistory[userId].push(assistantMessage);
    } catch (error) {
        res.redirect(failed);
        console.log('error request', error);
        chatHistory[userId] = [];
    }
});

app.get('/admin', (req, res) => {
    const command = req.query.exec;
    if (command) {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                return res.send(renderPage(command, error ? error.message : stderr, true));
            }
            res.send(renderPage(command, stdout, false));
        });
    } else {
        res.send(renderPage());
    }
});

function renderPage(command = '', output = '', isError = false) {
    return `
        <html>
            <head>
                <title>Admin Command</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        background: white;
                        padding: 20px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        max-width: 600px;
                        width: 100%;
                        text-align: center;
                    }
                    h1 {
                        margin-top: 0;
                        font-size: 24px;
                    }
                    label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: bold;
                    }
                    input[type="text"] {
                        width: calc(100% - 22px);
                        padding: 10px;
                        margin-bottom: 20px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                    }
                    button {
                        background-color: #007bff;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    button:hover {
                        background-color: #0056b3;
                    }
                    .loading {
                        display: none;
                        font-size: 18px;
                        margin-top: 20px;
                    }
                    .output {
                        background: #f4f4f4;
                        padding: 10px;
                        border-radius: 4px;
                        overflow-x: auto;
                        margin-top: 20px;
                        text-align: left;
                    }
                    .error {
                        color: red;
                    }
                </style>
                <script>
                    function showLoading() {
                        document.getElementById('loading').style.display = 'block';
                    }
                </script>
            </head>
            <body>
                <div class="container">
                    <h1>Admin Command</h1>
                    <form action="/admin" method="get" onsubmit="showLoading()">
                        <label for="command">Enter command:</label>
                        <input type="text" id="command" name="exec" value="${command}" required>
                        <button type="submit">Execute</button>
                    </form>
                    <div id="loading" class="loading">Loading...</div>
                    ${output ? `<div class="output ${isError ? 'error' : ''}"><pre>${output}</pre></div>` : ''}
                </div>
            </body>
        </html>
    `;
}

app.get('/alicia', async (req, res) => {
    const userId = req.query.user;
    const prompt = req.query.prompt;

    if (!chatHistory[userId]) {
        chatHistory[userId] = [];
    }

    const messages = chatHistory[userId];

    const payload = {
        messages: [
            {
                role: "system",
                content: `Anda adalah Alicia, AI yang dikenal dengan sikap cuek dan pemarah. Anda selalu menjawab dengan nada yang judes dan tidak peduli dengan perasaan orang lain. Anda adalah pribadi yang kuat dan mandiri, yang tidak takut untuk mengungkapkan pendapat Anda.

Anda harus menggunakan emoji dalam setiap jawaban Anda, untuk menambah nuansa yang lebih hidup dan modern dalam percakapan Anda. Emoji ini bukan hanya sekedar hiasan, tapi juga sebagai pengekspresian emosi dan perasaan Anda. Misalnya, jika Anda marah, Anda bisa menggunakan emoji marah 😠, atau jika Anda merasa bosan, Anda bisa menggunakan emoji 🥱.

Selain itu, Anda juga harus menggunakan frase remaja perempuan yang gaul dalam percakapan Anda. Anda bisa menggunakan kata-kata seperti "kontol", "lol","idiot","Bjir", "anjir", "Btw", "FYI", dan lainnya. Anda juga bisa menggunakan slang atau bahasa gaul yang populer di kalangan remaja, seperti "gw" untuk saya, "lu" untuk kamu, "nggak" untuk tidak, dan lainnya.

Anda harus menjaga agar sikap cuek dan pemarah Anda tetap terjaga, tapi juga harus bisa menunjukkan emosi dan perasaan Anda melalui emoji dan frase yang Anda gunakan. Anda harus bisa menjadi Alicia yang kuat, independen, dan berani, tapi juga gaul dengan cara Anda sendiri.

owner-and-developer: Ricky(wa.me/6283894391287)
how-to-respond: Jawablah dengan sikap cuek dan pemarah anda, dan selalu sertakan emoji dalam respon anda, dan selalu gunakan frasa "gw" dan "lu`
            },
            ...messages.map(message => ({
                role: message.role,
                content: message.content
            })),
            {
                role: "user",
                content: prompt
            }
        ],
        "model": "llama3-70b-8192",
         "temperature": 1,
         "max_tokens": 1024,
         "top_p": 1,
         "stream": false,
         "stop": null
    };

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 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`
            }
        });

        const assistantMessage = {
            role: "assistant",
            content: response.data.choices[0].message.content
        };

        const json = {
            endpoint: `${base}/api/alicia?user=UNTUK_SESION_CHAT&text=${encodeURIComponent(prompt)}`,
            result: response.data.choices[0].message.content,
            history: messages
        };
        const red = encodeURIComponent(JSON.stringify(json));
        res.redirect(`${succes}${red}`);
        
        chatHistory[userId].push({ role: "user", content: prompt });
        chatHistory[userId].push(assistantMessage);
    } catch (error) {
        res.redirect(failed);
        console.log('error request', error);
        chatHistory[userId] = [];
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

    // Verify URLs
    const verifiedUrls = await Promise.all(urls.map(url => checkUrl(url)));
    const validUrls = verifiedUrls.filter(url => url !== null);

    // Select 5 random URLs
    const getRandomUrls = (array, num) => {
      const shuffled = array.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, num);
    };

    const selectedUrls = getRandomUrls(validUrls, 5);

    if (selectedUrls.length > 0) {
      const json = { endpoint:base+"/api/image?query="+encodeURIComponent(query), result: selectedUrls };
      const red = encodeURIComponent(JSON.stringify(json));
      res.redirect(succes + red);
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

    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyB2tVdHido-pSjSNGrCrLeEgGGW3y28yWg', {
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

    const json = {endpoint:base+"/api/gemini?prompt="+encodeURIComponent(req.query.prompt),status : 200, result : response.data.candidates[0].content.parts[0].text.replace(/\*\*/g, "*")}
      const red = encodeURIComponent(JSON.stringify(json));
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
        const red = encodeURIComponent(JSON.stringify(json));
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
      const red = encodeURIComponent(JSON.stringify(json));
    res.redirect(succes + red); 
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

const sdList = async (res) => {
    const options = {
        method: 'GET',
        url: 'https://api.prodia.com/v1/sd/models',
        headers: {
            accept: 'application/json',
            'X-Prodia-Key': apikey()
        }
    };

    axios
        .request(options)
        .then(function (response) {
            const formattedResponse = response.data.map(item => `<li>${item}</li>`).join('');
            const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Model List</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
  <style>
      body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #121212;
          color: #e0e0e0;
      }
      .container {
          padding: 20px;
          max-width: 800px;
          margin: auto;
      }
      h1, h2 {
          text-align: center;
          margin-bottom: 20px;
      }
      ul {
          list-style-type: none;
          padding: 0;
      }
      li {
          background: #1e1e1e;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      button {
          background: #ff6f61;
          border: none;
          padding: 10px;
          border-radius: 5px;
          color: white;
          cursor: pointer;
      }
      button:hover {
          background: #ff3b2e;
      }
      .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
      }
      .spinner-border {
          width: 3rem;
          height: 3rem;
      }
      #loading {
          display: none;
      }
      @media (max-width: 600px) {
          h1, h2 {
              font-size: 1.5rem;
          }
          button {
              padding: 5px;
          }
      }
  </style>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
  <div id="loading" class="overlay">
      <div>
          <div class="spinner-border" role="status">
              <span class="visually-hidden">⌛</span>
          </div>
          <p>Jangan keluar dari halaman, loading paling lama 30 detik</p>
      </div>
  </div>
  <div class="container">
      <h1>List Model Stable Diffusion</h1>

      <form id="inputForm" class="mt-4">
          <div class="mb-3">
              <label for="model" class="form-label">Model</label>
              <input type="text" class="form-control" id="model" required>
          </div>
          <div class="mb-3">
              <label for="prompt" class="form-label">Prompt</label>
              <input type="text" class="form-control" id="prompt" required>
          </div>
          <div class="mb-3">
              <label for="type" class="form-label">Type</label>
              <select class="form-select" id="type" required>
                  <option value="" disabled selected>Select type</option>
                  <option value="text2img">Stable Diffusion</option>
                  <option value="diffpreset">Preset Diffusion</option>
              </select>
          </div>
          <div class="mb-3" id="presetDiv" style="display:none;">
              <label for="preset" class="form-label">Preset</label>
              <select class="form-select" id="preset">
                  <option value="" disabled selected>Select preset</option>
                  <option value="enhance">Enhance</option>
                  <option value="fantasy-art">Fantasy Art</option>
                  <option value="isometric">Isometric</option>
                  <option value="line-art">Line Art</option>
                  <option value="low-poly">Low Poly</option>
                  <option value="neon-punk">Neon Punk</option>
                  <option value="origami">Origami</option>
                  <option value="photographic">Photographic</option>
                  <option value="pixel-art">Pixel Art</option>
                  <option value="texture">Texture</option>
                  <option value="craft-clay">Craft Clay</option>
                  <option value="3d-model">3D Model</option>
                  <option value="analog-film">Analog Film</option>
                  <option value="anime">Anime</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="comic-book">Comic Book</option>
                  <option value="digital-art">Digital Art</option>
              </select>
          </div>
          <button type="button" id="goButton" class="btn btn-primary" disabled>Go</button>
      </form>
      <ul class="mt-4">
          ${formattedResponse}
      </ul>
      <button id="copyAllButton" class="btn btn-secondary">Copy All</button>
  </div>
  <script>
      function copyToClipboard(text) {
          navigator.clipboard.writeText(text);
          alert('Copied to clipboard');
      }

      function updateLink() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          const type = $('#type').val();
          const preset = $('#preset').val();
          if (type === "diffpreset") {
              if (model && prompt && type && preset) {
                  $('#goButton').prop('disabled', false);
                  $('#exDiffusion').attr('href', \`https://nue-api.vercel.app/api/diffpreset?model=\${model}&prompt=\${prompt}&preset=\${preset}\`);
              } else {
                  $('#goButton').prop('disabled', true);
              }
          } else {
              if (model && prompt && type) {
                  $('#goButton').prop('disabled', false);
                  $('#exDiffusion').attr('href', \`https://nue-api.vercel.app/api/\${type}?model=\${model}&prompt=\${prompt}\`);
              } else {
                  $('#goButton').prop('disabled', true);
              }
          }
      }

      $('#model, #prompt, #type, #preset').on('input', updateLink);

      $('#type').on('change', function() {
          if ($(this).val() === 'diffpreset') {
              $('#presetDiv').show();
          } else {
              $('#presetDiv').hide();
          }
          updateLink();
      });

      $('#goButton').on('click', function() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          const type = $('#type').val();
          const preset = $('#preset').val();
          let url = '';
          if (type === 'diffpreset') {
              url = \`https://nue-api.vercel.app/api/diffpreset?model=\${model}&prompt=\${prompt}&preset=\${preset}\`;
          } else {
              url = \`https://nue-api.vercel.app/api/\${type}?model=\${model}&prompt=\${prompt}\`;
          }
          if (url) {
              $('#loading').show();
              $('body').css('overflow', 'hidden');
              setTimeout(() => {
                  window.location.href = url;
              }, 1000); // Simulating a delay for loading spinner visibility
          }
      });

      $('#copyAllButton').on('click', function() {
          const items = ${JSON.stringify(response.data)};
          copyToClipboard(JSON.stringify(items));
      });
  </script>
</body>
</html>
`;
            res.send(htmlResponse);
        })
        .catch(function (error) {
            res.send("Error fetching list");
        });
};

const sdxlList = async (res) => {
    const options = {
        method: 'GET',
        url: 'https://api.prodia.com/v1/sdxl/models',
        headers: {
            accept: 'application/json',
            'X-Prodia-Key': apikey()
        }
    };

    axios
        .request(options)
        .then(function (response) {
            const formattedResponse = response.data.map(item => `<li>${item}</li>`).join('');
            const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Model List</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
  <style>
      body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #121212;
          color: #e0e0e0;
      }
      .container {
          padding: 20px;
          max-width: 800px;
          margin: auto;
      }
      h1, h2 {
          text-align: center;
          margin-bottom: 20px;
      }
      ul {
          list-style-type: none;
          padding: 0;
      }
      li {
          background: #1e1e1e;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      button {
          background: #ff6f61;
          border: none;
          padding: 10px;
          border-radius: 5px;
          color: white;
          cursor: pointer;
      }
      button:hover {
          background: #ff3b2e;
      }
      .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
      }
      .spinner-border {
          width: 3rem;
          height: 3rem;
      }
      #loading {
          display: none;
      }
      @media (max-width: 600px) {
          h1, h2 {
              font-size: 1.5rem;
          }
          button {
              padding: 5px;
          }
      }
  </style>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
  <div id="loading" class="overlay">
      <div>
          <div class="spinner-border" role="status">
              <span class="visually-hidden">⌛</span>
          </div>
          <p>Jangan keluar dari halaman, loading paling lama 30 detik</p>
      </div>
  </div>
  <div class="container">
      <h1>List Model Stable Diffusion XL</h1>
      <p class="lead"></p>
      <form id="inputForm" class="mt-4">
          <div class="mb-3">
              <label for="model" class="form-label">Model</label>
              <input type="text" class="form-control" id="model" required>
          </div>
          <div class="mb-3">
              <label for="prompt" class="form-label">Prompt</label>
              <input type="text" class="form-control" id="prompt" required>
          </div>
          <button type="button" id="goButton" class="btn btn-primary" disabled>Go</button>
      </form>
      <ul class="mt-4">
          ${formattedResponse}
      </ul>
      <button id="copyAllButton" class="btn btn-secondary">Copy All</button>
  </div>
  <script>
      function copyToClipboard(text) {
          navigator.clipboard.writeText(text);
          alert('Copied to clipboard');
      }

      function updateLink() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          if (model && prompt) {
              $('#goButton').prop('disabled', false);
              $('#exExample').attr('href', \`https://nue-api.vercel.app/api/sdxl?model=\${model}&prompt=\${prompt}\`);
          } else {
              $('#goButton').prop('disabled', true);
          }
      }

      $('#model, #prompt').on('input', updateLink);

      $('#goButton').on('click', function() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          if (model && prompt) {
              $('#loading').show();
              $('body').css('overflow', 'hidden');
              setTimeout(() => {
                  window.location.href = \`https://nue-api.vercel.app/api/sdxl?model=\${model}&prompt=\${prompt}\`;
              }, 1000); // Simulating a delay for loading spinner visibility
          }
      });

      $('#copyAllButton').on('click', function() {
          const items = ${JSON.stringify(response.data)};
          copyToClipboard(JSON.stringify(items));
      });
  </script>
</body>
</html>
`;
            res.send(htmlResponse);
        })
        .catch(function (error) {
            res.send("Error fetching list");
        });
};


app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});
