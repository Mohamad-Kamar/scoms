// src/utils/logger.ts
import { createLogger, format, transports } from "winston";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine the log level based on the environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "warn";
};

// Define colors for each log level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston about the colors
format.colorize().addColors(colors);

// Define the format of the log messages
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  format.colorize({ all: true }),
  format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// Define transport types based on environment
const logTransports = [
  new transports.Console(),
  new transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
  new transports.File({ filename: "logs/all.log" }),
];

// Create the logger instance
const logger = createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: logTransports,
});

export default logger;
