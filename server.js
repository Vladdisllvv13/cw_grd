const express = require('express');
const path = require('path');
const multer = require('multer'); // Для обработки файлов

const app = express();
const port = 3001; // Вы можете выбрать любой порт

// Конфигурация multer для сохранения файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'static', '3DModels', 'clothes'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Разрешаем CORS (если ваш фронтенд и бэкенд разные домены)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Обработка POST-запроса с файлом
app.post('/upload', upload.single('file'), (req, res) => {
  res.send('File uploaded!');
});

// Запускаем сервер
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});