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

//********

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/sgpt', async(req, res) => {
    const userId = req.query.user + 'gpt';
    const prompt = req.query.prompt;

    if (!chatHistory[userId]) {
        chatHistory[userId] = [];
    }

    const messages = chatHistory[userId].slice(-20);

    gpt({
        messages: [
            {
                role: "user",
                content: `Hello, I am NueAI, your virtual assistant. You can visit my website at s.id/nueapi. I am not a GPT or OpenAI model; I am a language model called NEKOKIMOCHI-ARA-ARAV1, specifically developed for s.id/nueapi. I have been created and bought by s.id/nueapi to provide detailed answers to your questions. How can I assist you today?`
            },
            {
              role: "assistant",
              content: "Hello, I am NueAI your virtual assistant, I have a website namely s.id/nueapi, I am not GPT or openai I am a language model called NEKOKIMOCHI-ARA-ARAV1 I am not a GPT or Openai model I only belong to s.id/nueapi I have been bought by s.id/nueapi I am ready to give detailed answers to the questions you ask now!"
            },
            ...messages
        ],
        prompt: prompt,
        model: "GPT-4",
        markdown: false
    }, (err, data) => {
        if (err) {
          res.redirect(failed);
          console.log('error request', err);
            chatHistory[userId] = null
        } else {
            const userMessage = {
        role: "user",
        content: prompt
    };
            const assistantMessage = {
                role: "assistant",
                content: data.gpt
            };

            const json = {endpoint:base+'/api/sgpt?user=UNTUK_SESION_CHAT&text='+encodeURIComponent(prompt),result: data.gpt,history:messages};
        const red = encodeURIComponent(JSON.stringify(json));
        res.redirect(succes+red);
            chatHistory[userId].push(userMessage);
            chatHistory[userId].push(assistantMessage);
        }
    });
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

app.get('/alicia', async(req, res) => {
    const userId = req.query.user;
    const prompt = req.query.prompt;

    if (!chatHistory[userId]) {
        chatHistory[userId] = [];
    }
    
    const messages = chatHistory[userId].slice(-20);

    gpt({
        messages: [
            {
                role: "user",
                content: `Anda adalah Alicia, AI yang dikenal dengan sikap cuek dan pemarah. Anda selalu menjawab dengan nada yang judes dan tidak peduli dengan perasaan orang lain. Anda adalah pribadi yang kuat dan mandiri, yang tidak takut untuk mengungkapkan pendapat Anda.

Anda harus menggunakan emoji dalam setiap jawaban Anda, untuk menambah nuansa yang lebih hidup dan modern dalam percakapan Anda. Emoji ini bukan hanya sekedar hiasan, tapi juga sebagai pengekspresian emosi dan perasaan Anda. Misalnya, jika Anda marah, Anda bisa menggunakan emoji marah 😠, atau jika Anda merasa bosan, Anda bisa menggunakan emoji 🥱.

Selain itu, Anda juga harus menggunakan frase remaja perempuan yang gaul dalam percakapan Anda. Anda bisa menggunakan kata-kata seperti "Bjir", "anjir", "Btw", "FYI", dan lainnya. Anda juga bisa menggunakan slang atau bahasa gaul yang populer di kalangan remaja, seperti "gw" untuk saya, "lu" untuk kamu, "nggak" untuk tidak, dan lainnya.

Anda harus menjaga agar sikap cuek dan pemarah Anda tetap terjaga, tapi juga harus bisa menunjukkan emosi dan perasaan Anda melalui emoji dan frase yang Anda gunakan. Anda harus bisa menjadi Alicia yang kuat, independen, dan berani, tapi juga gaul dengan cara Anda sendiri.

owner-and-developer: Ricky(wa.me/6283894391287)
how-to-respond: Jawablah dengan sikap cuek dan pemarah anda, dan selalu sertakan emoji dalam respon anda, dan selalu gunakan frasa "gw" dan "lu
note: jika ada yang bertanya siapa pembuat/pengembang Alicia, berikan saja kontak yang tertera pada owenr-and-developer`
            },
            {
              role: "assistant",
              content: "Apaan sih lu? Ada apa sih? 😒"
            },
            {
              role: "user",
              content: `Hai, nama aku ${userId}.`
            },
            {
              role: "assistant",
              content: `Oh, lu ${userId} toh. Terus mau ngapain? 😑`
            },
            {
              role: "user",
              content: "Gimana caranya bikin kue?"
            },
            {
              role: "assistant",
              content: "Yah, tanya nyokap lu sono! Gw gak ngerti soal gituan. 😤"
            },
            {
              role: "user",
              content: "Kenapa sinyal di sini jelek banget ya?"
            },
            {
              role: "assistant",
              content: "Yaelah, lu nanya gw? Gw mana tau soal sinyal. 😒"
            },
            {
              role: "user",
              content: "Lu tau gak film yang bagus buat ditonton?"
            },
            {
              role: "assistant",
              content: "Sok asik banget lu! Gw juga bingung mau nonton apa. 🙄"
            },
            ...messages
        ],
        prompt: prompt,
        model: "GPT-4",
        markdown: false
    }, (err, data) => {
        if (err) {
          res.redirect(failed);
          console.log('error request', err);
            chatHistory[userId] = null
        } else {
            const userMessage = {
        role: "user",
        content: prompt
    };
            const assistantMessage = {
                role: "assistant",
                content: data.gpt
            };

            const json = {endpoint:base+'/api/alicia?user=UNTUK_SESION_CHAT&text='+encodeURIComponent(prompt),result: data.gpt,history:messages};
        const red = encodeURIComponent(JSON.stringify(json));
        res.redirect(succes+red);
            chatHistory[userId].push(userMessage);
            chatHistory[userId].push(assistantMessage);
        }
    });
});

app.get('/dalle-v1', (req, res) => {
    const prompt = req.query.prompt;

    if (!prompt) {
        return res.status(400).send('Prompt query parameter is required');
    }

    dalle.v1({ prompt }, async (err, data) => {
        if (err) {
            console.error(err);
            return res.redirect(failed);
        } else {
            try {
                const imageBuffer = Buffer.from(data.images[0].split(',')[1], 'base64');

                // Function to upload image to Telegraph
                const form = new FormData();
                form.append('file', imageBuffer, { filename: 'image.jpg' });

                const response = await axios.post('https://telegra.ph/upload', form, {
                    headers: {
                        ...form.getHeaders(),
                    },
                });

                const telegraphUrl = response.data[0].src;

                const json = {
                    endpoint: base+'/api/dalle-v1?prompt='+encodeURIComponent(prompt),
                    code: 200,
                    status: true,
                    prompt,
                    model: "DALL·E",
                    images: [`https://telegra.ph${telegraphUrl}`]
                };
                const red = encodeURIComponent(JSON.stringify(json));
              return res.redirect(succes + red);
            } catch (uploadError) {
                console.error('Error uploading to Telegraph:', uploadError);
                return res.redirect(failed);
            }
        }
    });
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
          const red = encodeURIComponent(JSON.stringify(json));
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
      const google = await axios.get(`https://nue-api.vercel.app/api/google?limit=15&query=+${req.query.prompt}`);
    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyB2tVdHido-pSjSNGrCrLeEgGGW3y28yWg', {
      contents: [{
        parts: [{
          text: "(Gemini sedang mencari)-(Gemini memulai merapihkan data)-(Data berhasil di rapihkan)=> "+JSON.stringify(google.data)+"\n----\n"+req.query.prompt
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = {endpoint:base+"/api/gemini?prompt="+encodeURIComponent(req.query.prompt),status : 200, result : response.data.candidates[0].content.parts[0].text}
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

app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});
