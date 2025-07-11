require('dotenv').config();
const startBot = require('./bot');

const express = require("express");
const app = express();

app.get("/", (req, res) => {
	res.send("Bot is alive");
});

app.listen(process.env.PORT || 3000, () => {
	console.log("✅ Web server is running");
});

// const http = require('http');

// http.createServer((req, res) => {
// 	res.writeHead(200, { 'Content-Type': 'text/plain' });
// 	res.end('Bot is alive');
// }).listen(process.env.PORT || 3000, () => {
// 	console.log('✅ HTTP-сервер працює');
// });

startBot();