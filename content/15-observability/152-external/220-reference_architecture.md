---
title : "Reference Architecture"
weight : 220
---

The Kong Konnect and Observability Stack topology is quite simple in this example:

![otel_collector](/static/images/otel_reference_architeture.jpg)

The main components here are:

* Konnect Control Plane: responsible for administration tasks including APIs and Policies definition
* Konnect Data Plane: handles the requests sent by the API consumers
* Kong Gateway Plugins: components running inside the Data Plane to produce OpenTelemetry signals
* Upstream Service: services or microservices protected by the Konnnect Data Plane
* OpenTelemetry Collector: handles and processes the signals sent by the OTel plugin and sends them to the Dynatrace tenant
* Observability Stack: formed by Loki, Prometheus, Jaeger and Grafana, provides a single pane of glass with dashboards, reports, etc.
