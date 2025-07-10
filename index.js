require('dotenv').config();

const http = require('http');

http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Bot is alive');
}).listen(3000);

const TelegramApi = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const token = process.env.BOT_TOKEN;
const bot = new TelegramApi(token, { polling: true });

const HISTORY_FILE = path.join(__dirname, 'history.json');

let userHistories = {}; // Історія списків по chatId

const sendName = async (text, chatId) => {
	const names = text
		.split(',')
		.map(name => name.trim())
		.filter(name => name.length > 0);

	if (names.length > 50) {
		return bot.sendMessage(chatId, 'А не дохіба? \nДавай поменше');
	}

	if (!userHistories[chatId]) userHistories[chatId] = [];
	userHistories[chatId].unshift(names);
	userHistories[chatId] = userHistories[chatId].slice(0, 3);

	saveHistoryDebounced(); // Використовуємо debounced версію

	const randomName = names[Math.floor(Math.random() * names.length)];

	await bot.sendMessage(chatId, `🎉 Цей гєрой: ${randomName}`, {
		reply_markup: {
			inline_keyboard: [
				[{ text: '🔁 Повторити', callback_data: 'history_0' }, { text: '📜 Історія', callback_data: 'show_history' }]
			]
		}
	});
};

const showHistory = (chatId) => {
	const history = userHistories[chatId];
	if (!history || history.length === 0) {
		return bot.sendMessage(chatId, 'Історія порожня. Спочатку надішли список імен.');
	}

	// Формуємо кнопки для кожного списку з коротким превʼю (перші 3 імена)
	const buttons = history.map((names, index) => {
		const preview = names.slice(0, 3).join(', ');
		return [{ text: `${preview}${names.length > 3 ? ', ...' : ''}`, callback_data: `history_${index}` }];
	});

	return bot.sendMessage(chatId, 'Останні списки:', {
		reply_markup: {
			inline_keyboard: buttons
		}
	});
}

// Функція для завантаження історії з файлу
const loadHistory = () => {
	try {
		if (fs.existsSync(HISTORY_FILE)) {
			const data = fs.readFileSync(HISTORY_FILE, 'utf8');
			userHistories = JSON.parse(data);
		}
	} catch (e) {
		console.error('Помилка при завантаженні історії:', e);
		userHistories = {};
	}
	return;
};

// Альтернативний варіант з debounce для уникнення частих записів
let saveTimeout;
const saveHistoryDebounced = () => {
	clearTimeout(saveTimeout);
	saveTimeout = setTimeout(() => {
		try {
			fs.writeFileSync(HISTORY_FILE, JSON.stringify(userHistories, null, 2));
		} catch (e) {
			console.error('Помилка при збереженні історії:', e);
		}
	}, 1000); // Затримка 1 секунда
};

const start = () => {
	// Завантажуємо історію при старті
	loadHistory();

	bot.setMyCommands([
		{ command: '/start', description: 'Привітання та інструкція' },
		{ command: '/history', description: 'Показати останні 3 списки' },
	]);

	bot.on('message', async (msg) => {
		const chatId = String(msg.chat.id);
		const text = msg.text || '';

		if (text === '/start') {
			return bot.sendMessage(chatId, 'Здоров! Напиши імена через кому (напр.: Алєг, Євлампій, Бомж), і я випадково виберу одне з них.');
		}

		if (text === '/history') {
			return showHistory(chatId);
		}

		if (text.includes(',')) {
			return sendName(text, chatId);
		}

		return bot.sendMessage(chatId, 'Це шо за маячня? \nНадішли список імен через кому');
	});

	// Обробка кнопки
	bot.on('callback_query', async (query) => {
		const chatId = query.message.chat.id;
		const data = query.data;

		if (query.data === 'repeat_last') {
			const history = userHistories[chatId];
			if (!history || history.length === 0) {
				return bot.sendMessage(chatId, 'Історії поки немає. Надішли список імен.');
			}
			const lastList = history[0]; // найновіший список
			const randomName = lastList[Math.floor(Math.random() * lastList.length)];

			return bot.sendMessage(chatId, `🎉 Цей гєрой: ${randomName}`, {
				reply_markup: {
					inline_keyboard: [
						[{ text: '🔁 Ще раз', callback_data: 'repeat_last' }],
						[{ text: '📜 Історія списків', callback_data: 'show_history' }]
					]
				}
			});
		}

		if (data === 'show_history') {
			const history = userHistories[chatId];
			if (!history || history.length === 0) {
				return bot.sendMessage(chatId, 'Історія поки порожня. Надішли список імен через кому');
			}

			const buttons = history.map((names, index) => {
				const preview = names.slice(0, 3).join(', ');
				return [{ text: `${preview}${names.length > 3 ? ', ...' : ''}`, callback_data: `history_${index}` }];
			});

			return bot.sendMessage(chatId, 'Останні списки:', {
				reply_markup: { inline_keyboard: buttons }
			});
		}

		if (data.startsWith('history_')) {
			const index = parseInt(data.split('_')[1]);
			const history = userHistories[chatId];

			if (!history || !history[index]) {
				return bot.sendMessage(chatId, 'Цей список більше не доступний.');
			}

			const list = history[index];
			const randomName = list[Math.floor(Math.random() * list.length)];

			return bot.sendMessage(chatId, `Список: ${list.join(", ")}\n\n🎉 Цей гєрой: ${randomName}`, {
				reply_markup: {
					inline_keyboard: [
						[{ text: '🔁 Повторити', callback_data: `history_${index}` }, { text: '📜 Історія', callback_data: 'show_history' }]
					]
				}
			});
		}
	});
};

start();
