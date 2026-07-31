import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { trace } from "@opentelemetry/api";

// Thin wrapper over the OTel Logs API so application code doesn't depend on
// the SDK directly. Always also writes to console, and never throws — if the
// provider isn't registered (local dev without OTLP env vars) logging still
// works and a request is never broken by telemetry.

const SEVERITY = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
} as const;

export type LogLevel = keyof typeof SEVERITY;

function emit(level: LogLevel, message: string, attributes: Record<string, unknown> = {}) {
  // Attaching the active trace context lets Grafana jump from a log line to
  // the request that produced it.
  const span = trace.getActiveSpan();
  const ctx = span?.spanContext();

  try {
    logs.getLogger("gatehub").emit({
      severityNumber: SEVERITY[level],
      severityText: level.toUpperCase(),
      body: message,
      attributes: {
        ...(attributes as Record<string, string | number | boolean>),
        ...(ctx ? { trace_id: ctx.traceId, span_id: ctx.spanId } : {}),
      },
    });
  } catch {
    // Provider not registered — fall through to console below.
  }

  const line = Object.keys(attributes).length
    ? `${message} ${JSON.stringify(attributes)}`
    : message;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (m: string, a?: Record<string, unknown>) => emit("debug", m, a),
  info: (m: string, a?: Record<string, unknown>) => emit("info", m, a),
  warn: (m: string, a?: Record<string, unknown>) => emit("warn", m, a),
  error: (m: string, a?: Record<string, unknown>) => emit("error", m, a),
};
