const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const winston = require('winston');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
require('dotenv').config();

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'books-service',
    environment: 'prod'
  },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
app.use(cors());
app.use(express.json());

const getEnvVar = (name) => {
  const value = process.env[name];
  if (!value) {
    logger.error(`Environment variable ${name} is not defined`);
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
};

// MySQL connection
const db = mysql.createConnection({
  host: getEnvVar('DATABASE_ENDPOINT'),
  user: getEnvVar('MYSQL_USER'),
  password: getEnvVar('MYSQL_PASSWORD'),
  database: getEnvVar('MYSQL_DATABASE'),
  port: getEnvVar('MYSQL_PORT')
});

db.connect(async (err) => {
  await sleep(3000);
  if (err) {
    logger.error('Error connecting to the database:', { error: err.message, stack: err.stack });
    logger.info('Waiting for 5 sec before retry');
    await sleep(5000);
    
    db.connect((retryErr) => {
      if (retryErr) {
        logger.error('Error connecting to the database after retry:', { error: retryErr.message, stack: retryErr.stack });
        process.exit(1);
      }
    });
  }
  logger.info('Successfully connected to the database');
});

// Middleware to log all requests
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    ip: req.ip
  });
  next();
});

// Routes
app.get('/api/books', (req, res) => {
  db.query('SELECT * FROM books', (err, results) => {
    if (err) {
      logger.error('Error fetching books:', { error: err.message, stack: err.stack });
      res.status(500).json({ error: err.message });
      process.exit(1);
    }
    logger.info('Successfully retrieved books', { count: results.length });
    res.json(results);
  });
});

app.post('/api/books', (req, res) => {
  const { name, publisher, date } = req.body;
  logger.info('Attempting to create new book', { name, publisher, date });

  db.query('INSERT INTO books (name, publisher, date) VALUES (?, ?, ?)', 
    [name, publisher, date], 
    (err, result) => {
      if (err) {
        logger.error('Error creating book:', { error: err.message, stack: err.stack });
        res.status(500).json({ error: err.message });
        process.exit(1);
      }
      logger.info('Successfully created new book', { id: result.insertId, name, publisher, date });
      res.status(201).json({ id: result.insertId, name, publisher, date });
    }
  );
});

app.put('/api/books/:id', (req, res) => {
  const { name, publisher, date } = req.body;
  const bookId = req.params.id;
  logger.info('Attempting to update book', { id: bookId, name, publisher, date });

  db.query('UPDATE books SET name = ?, publisher = ?, date = ? WHERE id = ?',
    [name, publisher, date, bookId],
    (err) => {
      if (err) {
        logger.error('Error updating book:', { id: bookId, error: err.message, stack: err.stack });
        res.status(500).json({ error: err.message });
        process.exit(1);
      }
      logger.info('Successfully updated book', { id: bookId, name, publisher, date });
      res.json({ id: bookId, name, publisher, date });
    }
  );
});

app.delete('/api/books/:id', (req, res) => {
  const bookId = req.params.id;
  logger.info('Attempting to delete book', { id: bookId });

  db.query('DELETE FROM books WHERE id = ?', [bookId], (err) => {
    if (err) {
      logger.error('Error deleting book:', { id: bookId, error: err.message, stack: err.stack });
      res.status(500).json({ error: err.message });
      process.exit(1);
    }
    logger.info('Successfully deleted book', { id: bookId });
    res.json({ message: 'Book deleted successfully' });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server started and running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason: reason, stack: reason.stack });
  process.exit(1);
});