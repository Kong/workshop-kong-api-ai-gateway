---
title : "External Observability Stack"
weight : 220
---

The external Observability infrastructure we are going to use is based on the [OpenTelemetry](https://opentelemetry.io/) standard and it comprises:
* [OTel Collector](https://github.com/open-telemetry/opentelemetry-collector): implements the component responsible for receiving, processing and exporting telemetry data. 
* [Loki](https://grafana.com/oss/loki/): plays the log processing role and receiving all requests and responses processed by the Kong API and AI Gateway Data Plane.
* [Prometheus](https://prometheus.io/): responsible for scraping and storing the metrics the Kong API and AI Gateway generate.
* [Grafana](https://grafana.com/oss/grafana/): used to query and analyze logs and metrics.
* [Jaeger](https://www.jaegertracing.io/): distributed tracing platform.


![observability_stack](/static/images/observability_stack.png)

You can now click **Next** to begin the module.

## Optional Reading

* [Analytics and Monitor plugins](https://developer.konghq.com/plugins/?category=analytics-monitoring)
* [Logging plugins](https://developer.konghq.com/plugins/?category=logging)

