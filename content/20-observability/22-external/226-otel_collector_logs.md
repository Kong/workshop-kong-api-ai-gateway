---
title : "OTel Collector and Logs"
weight : 226
---

We still need to add logs to our environment. To inject Kong Gateway's Access Logs, we can use Log Processing plugin Kong Gateway provides, for example the [TCP Log Plugin](https://docs.konghq.com/hub/kong-inc/tcp-log/).

https://grafana.com/docs/loki/latest/send-data/otel/
https://grafana.com/docs/loki/latest/send-data/otel/#loki-configuration

### New collector configuration

```
cat > otelcollector << 'EOF'
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
metadata:
  name: collector-kong
  namespace: opentelemetry-operator-system
spec:
  image: otel/opentelemetry-collector-contrib:0.132.2
  serviceAccount: collector
  mode: deployment
  config:
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
      prometheus:
        config:
          scrape_configs:
            - job_name: 'otel-collector'
              scrape_interval: 5s
              kubernetes_sd_configs:
              - role: pod
              scheme: http
              tls_config:
                ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
              authorization:
                credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
              metrics_path: /metrics
              relabel_configs:
              - source_labels: [__meta_kubernetes_namespace]
                action: keep
                regex: "kong"
              - source_labels: [__meta_kubernetes_pod_name]
                action: keep
                regex: "kong-kong-(.+)"
              - source_labels: [__meta_kubernetes_pod_container_name]
                action: keep
                regex: "proxy"
              - source_labels: [__meta_kubernetes_pod_container_port_number]
                action: keep
                regex: "8100"
      tcplog:
        listen_address: 0.0.0.0:54525
        operators:
          - type: json_parser

    exporters:
      otlphttp/jaeger:
        endpoint: http://jaeger-collector.observability:4318
      prometheus:
        endpoint: 0.0.0.0:8889
      otlphttp/loki:
        endpoint: http://loki.loki:3100/otlp
      debug:
        verbosity: detailed

    service:
      pipelines:
        traces:
          receivers: [otlp]
          exporters: [otlphttp/jaeger]
        metrics:
          receivers: [otlp, prometheus]
          exporters: [otlphttp, prometheus]
        logs:
          receivers: [tcplog]
          exporters: [otlphttp/loku]
EOF
```

The declaration has critical parameters defined:

* A new TCP Receiver has been added, listening to the port 54525, used by the Kong Gateway TCP Log Plugin. It uses the “json_parser” operator to send formatted data to Dynatrace.
* Still inside the “service” section we have included the new “logs” pipeline. Its “receivers” are set to “tcplog” to get data from the TCP Log Kong Gateway Plugin. Its “exporters” is set to a different “otlphttp” which sends data to Loki.

### Deploy the collector
Delete the current collector first and instantiate a new one simply submitting the declaration:

```
kubectl delete opentelemetrycollector collector-kong -n opentelemetry-operator-system

kubectl apply -f otelcollector.yaml
```

Interestingly enough, the collector service now listens to four ports:

```
% kubectl get service collector-kong-collector -n opentelemetry-operator-system 
NAME                       TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                                AGE
collector-kong-collector   ClusterIP   10.100.67.18   <none>        4317/TCP,4318/TCP,8889/TCP,54525/TCP   21h
```

### Configure the Prometheus and TCP Log Plugins
Add the Prometheus and TCP Log plugins to our decK declaration and submit it to Konnect:

```
cat > kong-plugins.yaml << 'EOF'
_format_version: "3.0"
_info:
  select_tags:
  - kong-plugins
_konnect:
  control_plane_name: default
plugins:
- name: opentelemetry
  instance_name: opentelemetry1
  enabled: true
  config:
    traces_endpoint: http://collector-kong-collector.opentelemetry-operator-system.svc.cluster.local:4318/v1/traces
    propagation:
      default_format: "w3c"
      inject: ["w3c"]
    resource_attributes:
      service.name: "kong-otel"
- name: prometheus
  instance_name: prometheus1
  config:
    per_consumer: true
    status_code_metrics: true
    latency_metrics: true
    bandwidth_metrics: true
    upstream_health_metrics: true
    ai_metrics: true
- name: tcp-log
  instance_name: tcp-log1
  enabled: true
  config:
    host: collector-kong-collector.opentelemetry-operator-system.svc.cluster.local
    port: 54525
    custom_fields_by_lua:
      trace_id: local log_payload = kong.log.serialize()  local trace_id = log_payload['trace_id']['w3c']   return trace_id
EOF
```
Submit the new plugin declaration with:


deck gateway sync --konnect-token $PAT kong-plugins.yaml
Consume the Application and check collector's Prometheus endpoint
Using “port-forward”, send a request to the collector's Prometheus endpoint. In a terminal run:


kubectl port-forward service/collector-kong-collector -n opentelemetry-operator-system 8889
Continue navigating the Application to see some metrics getting generated. In another terminal send a request to Prometheus’ endpoint.


% http :8889/metrics
You should see several related Kong metrics including, for example, Histogram metrics like “kong_kong_latency_ms_bucket”, “kong_request_latency_ms_bucket” and “kong_upstream_latency_ms_bucket”. Maybe one of the most important is “kong_http_requests_total” where we can see consumption metrics. Here's a snippet of the output:


# HELP kong_http_requests_total HTTP status codes per consumer/service/route in Kong
# TYPE kong_http_requests_total counter
kong_http_requests_total{code="200",instance="192.168.76.233:8100",job="otel-collector",route="coupon_route",service="coupon_service",source="service",workspace="default"} 1
kong_http_requests_total{code="200",instance="192.168.76.233:8100",job="otel-collector",route="inventory_route",service="inventory_service",source="service",workspace="default"} 1
kong_http_requests_total{code="200",instance="192.168.76.233:8100",job="otel-collector",route="pricing_route",service="pricing_service",source="service",workspace="default"} 1
Check Metrics and Logs in Dynatrace
One of the main values provided by Dynatrace is Dashboard creation capabilities. You can create them visually and using DQL (Dynatrace Query Language). As an example, Dynatrace provides a Kong Dashboard where we can manage the main metrics and the access log.

The Kong Dashboard should look like this.


Connecting Log Data to Traces
Dynatrace has the ability to connect Log Events to Traces. That allows us to navigate to the trace associated with a given log event.

In order to do it, the log event has to have a “trace_id” field with the actual trace id it is related to. By default, the OpenTelemetry Plugin injects such a field. However, it adds the format used, in order case “w3c”. For example:


{
  "trace_id":{
    "w3c":"3b7fb854f5442239c0e94edc69fd6886"
  },
  "route":{
    "paths":[
      "/coupon"
    ],
    "created_at":1738765016,
….
}
As you can see here, the TCP Log gets executed after the OpenTelemetry Plugin. So, to solve that, the TCP Log Plugin configuration has the “custom_fields_by_lua” set with a Lua code which removes the “w3c” part out of the field added by the OpenTelemetry Plugin. The new log event can then follow the format Dynatrace looks for:


{
  "trace_id":"3b7fb854f5442239c0e94edc69fd6886",
  "route":{
    "paths":[
      "/inventory"
    ],
    "created_at":1738765016,
….
}
Here's a Dynatrace Logs app with events generated by the TCP Log Plugin. Choose an event and you'll see the right panel with the “Open trace” button.

