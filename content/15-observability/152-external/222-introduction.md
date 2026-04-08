---
title : "OpenTelemetry Introduction"
weight : 222
---

Observability focuses mainly on three core pillars:

* Logs: Detailed, timestamped records of events and activities within a system, offering a granular view of operations
* Metrics: Quantitative data points that capture various aspects of system performance, such as resource usage, response times, and throughput
* Traces: Visual paths that requests follow as they traverse through different system components, enabling end-to-end analysis of transactions and interactions


#### OpenTelemetry

Here's a concise definition of OpenTelemetry, available on its [website](https://opentelemetry.io/docs/):

“OpenTelemetry, also known as OTel, is a vendor-neutral open source Observability framework for instrumenting, generating, collecting, and exporting telemetry data such as traces, metrics, and logs.”

#### OTel Collector
The OTel specification comprises several [components](https://opentelemetry.io/docs/what-is-opentelemetry/#main-opentelemetry-components), including, for example, the [OpenTelemetry Protocol (OTLP)](https://opentelemetry.io/docs/specs/otlp/). From the architecture perspective, one of the main components is the OpenTelemetry Collector, which is responsible for receiving, processing, and exporting telemetry data. The following diagram is taken from the official [OpenTelemetry Collector documentation page](https://opentelemetry.io/docs/collector/).

![otel_collector](/static/images/otel-collector.svg)

Although it's totally valid to send telemetry signals directly from the application to the observability backends with [no collector](https://opentelemetry.io/docs/collector/deployment/no-collector/) in place, it's generally recommended to use the OTel Collector. The collector abstracts the backend observability infrastructure, so the services can normalize this kind of processing more quickly in a standardized manner as well as let the collector take care of error handling, encryption, data filtering, transformation, etc. 

As you can see in the diagram, the collector defines multiple components such as:
* [Receivers](https://opentelemetry.io/docs/collector/configuration/#receivers): Responsible for collecting telemetry data from the sources
* [Processors](https://opentelemetry.io/docs/collector/configuration/#processors): Apply transformation, filtering, and calculation to the received data
* [Exporters](https://opentelemetry.io/docs/collector/configuration/#exporters): Send data to the Observability backend

OTel Collector offers other types of connectors and extensions. Please, refer to [OTel Collector documentation](https://opentelemetry.io/docs/collector/configuration/) to learn more about these components.

The components are tied together in [Pipelines](https://opentelemetry.io/docs/collector/configuration/#pipelines), inside the [Service](https://opentelemetry.io/docs/collector/configuration/#service) section of the collector configuration file.

From the deployment perspective, here's the minimum recommended scenario called [Agent Pattern](https://opentelemetry.io/docs/collector/deployment/agent/). The application uses the OTel SDK to send telemetry data to the collector through OTLP. The collector, in turn, sends the data to the existing backends. The collector is also flexible enough to support a variety of topologies to address scalability, high availability, fan-out, etc. Check the [OTel Collector deployment page](https://opentelemetry.io/docs/collector/deployment/) for more information.

![otel_collector](/static/images/otel-agent-sdk.svg)

The OTel Collector comes from the community, but Dynatrace provides a distribution for the [OpenTelemetry Collector](https://docs.dynatrace.com/docs/ingest-from/opentelemetry/collector). It is a customized implementation tailored for typical use cases in a Dynatrace context. It ships with an optimized and verified set of collector components.
