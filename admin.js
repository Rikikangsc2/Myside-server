const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
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
                        max-width: 400px;
                        width: 100%;
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
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Admin Command</h1>
                    <form action="/admin" method="post">
                        <label for="command">Enter command:</label>
                        <input type="text" id="command" name="command" required>
                        <button type="submit">Execute</button>
                    </form>
                </div>
            </body>
        </html>
    `);
});

app.post('/admin', (req, res) => {
    const command = req.body.command;

    if (!command) {
        return res.status(400).send('No command provided.');
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error}`);
            return res.status(500).send(`
                <html>
                    <head>
                        <title>Error</title>
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
                                max-width: 400px;
                                width: 100%;
                                text-align: center;
                            }
                            a {
                                display: inline-block;
                                margin-top: 20px;
                                text-decoration: none;
                                color: #007bff;
                            }
                            a:hover {
                                text-decoration: underline;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Error</h1>
                            <pre>${error.message}</pre>
                            <a href="/">Go back</a>
                        </div>
                    </body>
                </html>
            `);
        }
        if (stderr) {
            console.error(`Command stderr: ${stderr}`);
            return res.status(500).send(`
                <html>
                    <head>
                        <title>Error</title>
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
                                max-width: 400px;
                                width: 100%;
                                text-align: center;
                            }
                            a {
                                display: inline-block;
                                margin-top: 20px;
                                text-decoration: none;
                                color: #007bff;
                            }
                            a:hover {
                                text-decoration: underline;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Error</h1>
                            <pre>${stderr}</pre>
                            <a href="/admin">Go back</a>
                        </div>
                    </body>
                </html>
            `);
        }

        res.send(`
            <html>
                <head>
                    <title>Command Output</title>
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
                        }
                        pre {
                            background: #f4f4f4;
                            padding: 10px;
                            border-radius: 4px;
                            overflow-x: auto;
                        }
                        a {
                            display: inline-block;
                            margin-top: 20px;
                            text-decoration: none;
                            color: #007bff;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Command Output</h1>
                        <pre>${stdout}</pre>
                        <a href="/admin">Go back</a>
                    </div>
                </body>
            </html>
        `);
    });
});

app.listen(3001, () => {
    console.log('Server is running on port 3000');
});
