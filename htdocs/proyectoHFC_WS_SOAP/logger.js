//DECLARAMOS EL LOG DE MENSAJES
const { createLogger, format, transports } = require('winston'),
  DailyRotateFile = require('winston-daily-rotate-file'),
  path = require('path'),
  fs = require('fs');

const logDir = 'logs';

if (!fs.existsSync(logDir)) {  // Create the log directory if it does not exist
  fs.mkdirSync(logDir);
}

const dailyRotateFileTransport = new DailyRotateFile({
    filename: `${logDir}/log_api_services_%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m'
});
 
const logger = createLogger({

  level: 'info',
  format: format.combine(
    //format.label({ label: req.headers["X-Forwarded-For"] || req.connection.remoteAddress }),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    //format.printf(info => `[${info.timestamp}] IP:${info.message}`)
    format.printf(info => `---------- Descripción de Acceso ---------- \nFecha de acceso: ${info.timestamp} ${info.message}`)
  ),
  transports: [
    //new transports.File({ filename }),
    dailyRotateFileTransport
  ]
  
});

module.exports = logger;