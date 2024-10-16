const express = require('express');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Подключение к MongoDB успешно'))
    .catch(err => console.error('Ошибка подключения к MongoDB:', err));

const taskSchema = new mongoose.Schema({
    description: String,
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
Привет! Я ваш новый бот для управления задачами.

Вот список доступных команд:
- /start - Начать взаимодействие с ботом
- /addtask <описание задачи> - Добавить новую задачу
- /tasks - Просмотреть все задачи
- /deletetask <ID задачи> - Удалить задачу по ID
- /completetask <ID задачи> - Отметить задачу как выполненную

Просто введите команду, и я вам помогу!
    `;
    
    bot.sendMessage(chatId, welcomeMessage);
});


bot.onText(/\/addtask (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskDescription = match[1];
    const newTask = new Task({ description: taskDescription });
    try {
        await newTask.save();
        bot.sendMessage(chatId, `Задача добавлена: ${taskDescription}`);
    } catch (error) {
        console.error('Ошибка при добавлении задачи:', error);
        bot.sendMessage(chatId, 'Ошибка при добавлении задачи. Попробуйте еще раз.');
    }
});

bot.onText(/\/tasks/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const tasks = await Task.find();
        if (tasks.length === 0) {
            bot.sendMessage(chatId, 'Список задач пуст.');
        } else {
            let taskList = 'Ваши задачи:\n';
            tasks.forEach((task, index) => {
                taskList += `${index + 1}. ${task.description} - ${task.completed ? '✅' : '❌'}\n`;
            });
            bot.sendMessage(chatId, taskList);
        }
    } catch (error) {
        console.error('Ошибка при получении задач:', error);
        bot.sendMessage(chatId, 'Ошибка при получении задач. Попробуйте еще раз.');
    }
});

bot.onText(/\/deletetask (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = match[1];
    try {
        const result = await Task.findByIdAndDelete(taskId);
        if (result) {
            bot.sendMessage(chatId, `Задача с ID ${taskId} удалена.`);
        } else {
            bot.sendMessage(chatId, `Задача с ID ${taskId} не найдена.`);
        }
    } catch (error) {
        console.error('Ошибка при удалении задачи:', error);
        bot.sendMessage(chatId, 'Ошибка при удалении задачи. Попробуйте еще раз.');
    }
});

bot.onText(/\/completetask (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = match[1];
    try {
        const result = await Task.findByIdAndUpdate(taskId, { completed: true }, { new: true });
        if (result) {
            bot.sendMessage(chatId, `Задача с ID ${taskId} отмечена как выполненная.`);
        } else {
            bot.sendMessage(chatId, `Задача с ID ${taskId} не найдена.`);
        }
    } catch (error) {
        console.error('Ошибка при обновлении задачи:', error);
        bot.sendMessage(chatId, 'Ошибка при обновлении задачи. Попробуйте еще раз.');
    }
});

app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
