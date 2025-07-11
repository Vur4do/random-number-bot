const fs = require('fs');
const path = require('path');
const HISTORY_FILE = path.join(__dirname, 'history.json');

const loadHistory = () => {
	try {
		if (fs.existsSync(HISTORY_FILE)) {
			return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
		}
	} catch (e) {
		console.error('Помилка при завантаженні історії:', e);
	}
	return {};
};

const saveHistory = (data) => {
	try {
		fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
	} catch (e) {
		console.error('Помилка при збереженні історії:', e);
	}
};

let saveTimeout;
const saveHistoryDebounced = (data) => {
	clearTimeout(saveTimeout);
	saveTimeout = setTimeout(() => saveHistory(data), 1000);
};

const addToHistory = (histories, chatId, names) => {
	if (!histories[chatId]) histories[chatId] = [];
	histories[chatId].unshift(names);
	histories[chatId] = histories[chatId].slice(0, 3);
};

const getHistory = (histories, chatId) => histories[chatId] || [];

module.exports = {
	loadHistory,
	saveHistoryDebounced,
	getHistory,
	addToHistory
};
