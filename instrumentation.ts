import { registerOTel } from "@vercel/otel";

export async function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "gatehub",
  });

  // @vercel/otel only wires up traces, so logs are registered separately.
  // Node-only: the logs SDK isn't edge-compatible, and the OTLP exporter
  // reads OTEL_EXPORTER_OTLP_{ENDPOINT,HEADERS} from the environment just
  // like the trace exporter does.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;

  const [{ logs }, { LoggerProvider, BatchLogRecordProcessor }, { OTLPLogExporter }, { resourceFromAttributes }] =
    await Promise.all([
      import("@opentelemetry/api-logs"),
      import("@opentelemetry/sdk-logs"),
      import("@opentelemetry/exporter-logs-otlp-http"),
      import("@opentelemetry/resources"),
    ]);

  logs.setGlobalLoggerProvider(
    new LoggerProvider({
      resource: resourceFromAttributes({
        "service.name": process.env.OTEL_SERVICE_NAME ?? "gatehub",
      }),
      processors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() })],
    }),
  );
}
