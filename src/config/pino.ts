import { Params } from "nestjs-pino";
import { formatBytes, formatResponseTime } from "src/common/utils";

export const development_pinoHttpOptions: Params["pinoHttp"] = {
  level: "debug",

  customLogLevel: (req, res, error) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || error) {
      return "error";
    }
    return "info";
  },

  customSuccessMessage: function (req, res, responseTime) {
    if (res.statusCode === 404) {
      return `${req.method} ${res.statusCode} ${req.url} - ${formatResponseTime(responseTime)}`;
    }
    return `${req.method} ${res.statusCode} ${req.url} - ${formatBytes(Number(res.getHeader("content-length") || 0))} - ${formatResponseTime(responseTime)}`;
  },

  customErrorMessage: function (req, res) {
    return `${req.method} ${res.statusCode} ${req.url}`;
  },

  serializers: {
    req: () => undefined,
    res: () => undefined,
    responseTime: () => undefined,
  },

  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    ],
  },
};

export const production_pinoHttpOptions: Params["pinoHttp"] = {
  level: "info",

  customLogLevel: (req, res, error) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || error) {
      return "error";
    }
    return "info";
  },

  customSuccessMessage: function (req, res, responseTime) {
    if (res.statusCode === 404) {
      return `Resource not found: ${req.method} ${res.statusCode} ${req.url} - ${formatResponseTime(responseTime)}`;
    }
    return `Request completed: ${req.method} ${res.statusCode} ${req.url} - ${formatBytes(Number(res.getHeader("content-length") || 0))} - ${formatResponseTime(responseTime)}`;
  },

  customErrorMessage: function (req, res) {
    return `Request failed: ${req.method} ${res.statusCode} ${req.url} - ${res.getHeader("content-length")}B`;
  },

  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    ],
  },
};
