import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, 'logs');

try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create log directory:', error);
}

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const logFile = path.join(logsDir, `app-${timestamp()}.log`);

// Helper function to get the caller's file and line number
const getCallerInfo = () => {
  const originalFunc = Error.prepareStackTrace;

  let callerFile;
  let callerLine;

  try {
    const err = new Error();
    Error.prepareStackTrace = (err, stack) => stack;
    const currentFile = err.stack[1].getFileName();

    for (let i = 2; i < err.stack.length; i++) {
      callerFile = err.stack[i].getFileName();
      callerLine = err.stack[i].getLineNumber();
      if (callerFile !== currentFile) break;
    }
  } catch (error) {
    console.error('Error getting caller info:', error);
  } finally {
    Error.prepareStackTrace = originalFunc;
  }

  // Extract the file name from the full path
  const fileName = callerFile ? path.basename(callerFile) : 'unknown';
  return `${fileName}:${callerLine}`;
};

// Logger object with various logging methods
export const logger = {
  log: (level, message) => {
    const now = new Date().toISOString();
    const color = logger.getColor(level);
    const formattedMessages = logger.formatMessage(
      level,
      now,
      message,
      getCallerInfo()
    );

    formattedMessages.forEach((formattedMessage) => {
      console.log(`${color}${formattedMessage}\x1b[0m`);

      try {
        fs.appendFileSync(logFile, `${formattedMessage}\n`, 'utf8');
      } catch (error) {
        console.error('Error writing to log file:', error);
      }
    });
  },
  info: (message) => logger.log('INFO', message),
  warn: (message) => logger.log('WARN', message),
  error: (message) => logger.log('ERROR', message),
  debug: (message) => logger.log('DEBUG', `Debugging: ${message}`),
  start: (message) => logger.log('START', `Starting: ${message}`),
  end: (message) => logger.log('END', `Ending: ${message}`),
  attempting: (message) => logger.log('ATTEMPT', `Attempting: ${message}`),
  success: (message) => logger.log('SUCCESS', `Success: ${message}`),

  concurrency: (message, activeTasks) => {
    logger.log('INFO', `${message} | Active tasks: ${activeTasks}`);
  },

  getColor: (level) => {
    switch (level) {
      case 'INFO':
        return '\x1b[0m';
      case 'WARN':
        return '\x1b[33m'; // yellow
      case 'ERROR':
        return '\x1b[31m'; // red
      case 'DEBUG':
        return '\x1b[34m'; // blue
      case 'START':
        return '\x1b[35m'; // magenta
      case 'END':
        return '\x1b[35m'; // magenta
      case 'ATTEMPT':
        return '\x1b[36m'; // cyan
      case 'SUCCESS':
        return '\x1b[32m'; // green
      default:
        return '\x1b[0m'; // reset
    }
  },

  formatMessage: (level, timestamp, message, callerInfo) => {
    const prefix = `[${level}] [${timestamp}] - `;
    const fullMessage = `${prefix}${message} (Called from: ${callerInfo})`;
    const lines = [];

    if (['START', 'END', 'DEBUG'].includes(level)) {
      const border = '*'.repeat(fullMessage.length);
      lines.push(border);
      lines.push(fullMessage);
      lines.push(border);
    } else {
      lines.push(fullMessage);
    }

    return lines;
  }
};
