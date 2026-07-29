import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { registerOTel } from "@vercel/otel";

export function register() {
  // TEMPORARY: surfaces OTel's internal export errors (auth failures,
  // bad endpoint, network issues) in Vercel runtime logs. Remove once
  // data is confirmed flowing in Grafana Cloud.
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

  console.log("[otel] instrumentation.ts register() called", {
    serviceName: process.env.OTEL_SERVICE_NAME,
    hasEndpoint: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    hasHeaders: Boolean(process.env.OTEL_EXPORTER_OTLP_HEADERS),
  });

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "gatehub",
  });
}
