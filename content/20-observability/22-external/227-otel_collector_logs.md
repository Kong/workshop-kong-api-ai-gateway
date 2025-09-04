---
title : "OTel Collector and Logs"
weight : 227
---


We still need to add logs to our environment where [Loki](https://github.com/grafana/loki/blob/main/README.md) has been deployed. To inject Kong Gateway's Access Logs, we can use a Log Processing plugin Kong Gateway provides, for example the [TCP Log Plugin](https://docs.konghq.com/hub/kong-inc/tcp-log/).




Hit the port to make sure Loki is ready to accept requests:

```
curl http://localhost:3100/ready
```




### New collector configuration

```
cat > otelcollector.yaml << 'EOF'
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
                regex: "dataplane-(.+)"
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
        endpoint: http://jaeger-collector.jaeger:4318
      otlphttp/prometheus:
        endpoint: http://prometheus-kube-prometheus-prometheus.prometheus:9090/api/v1/otlp
      otlphttp/loki:
        endpoint: http://loki.loki:3100/otlp
      prometheus:
        endpoint: 0.0.0.0:8889
      #debug:
      #  verbosity: detailed

    service:
      pipelines:
        traces:
          receivers: [otlp]
          exporters: [otlphttp/jaeger]
        metrics:
          receivers: [prometheus]
          exporters: [otlphttp/prometheus, prometheus]
        logs:
          receivers: [tcplog]
          exporters: [otlphttp/loki]
EOF
```

The declaration has critical parameters defined:

* A new TCP Receiver has been added, listening to the port 54525, used by the Kong Gateway TCP Log Plugin. It uses the “json_parser” operator to send formatted data to Loki.
* Still inside the “service” section we have included the new “logs” pipeline. Its “receivers” are set to “tcplog” to get data from the TCP Log Kong Gateway Plugin. Its “exporters” is set to a different “otlphttp/loki” which sends data to the [Loki endpoint](https://grafana.com/docs/loki/latest/send-data/otel/).

### Deploy the collector
Delete the current collector first and instantiate a new one simply submitting the declaration:

```
kubectl delete opentelemetrycollector collector-kong -n opentelemetry-operator-system

kubectl apply -f otelcollector.yaml
```

The collector service now listens to four ports:

```
% kubectl get service collector-kong-collector -n opentelemetry-operator-system 
NAME                       TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                                AGE
collector-kong-collector   ClusterIP   10.100.67.18   <none>        4317/TCP,4318/TCP,8889/TCP,54525/TCP   21h
```

### Configure the Prometheus and TCP Log Plugins
Add the Prometheus and TCP Log plugins to our decK declaration and submit it to Konnect:

```
cat > httpbin.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  tags:
  - httpbin-service-route
  host: httpbin.kong.svc.cluster.local
  port: 8000
  plugins:
  - name: opentelemetry
    instance_name: opentelemetry1
    enabled: true
    config:
      traces_endpoint: http://collector-kong-collector.opentelemetry-operator-system.svc.cluster.local:4318/v1/traces
      #propagation:
      #  default_format: "w3c"
      #  inject: ["w3c"]
      resource_attributes:
        service.name: "kong-otel"
  - name: prometheus
    instance_name: prometheus1
    enabled: true
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
        streams: local ts=string.format('%18.0f', os.time()*1000000000) local log_payload         =
          kong.log.serialize() local service = log_payload['service'] or 'noService'
          local cjson         =
          require "cjson" local payload_string = cjson.encode(log_payload) local
          t         = { {stream = {gateway='kong-gateway', service_name=service['name']},
          values={{ts,         payload_string}}} } return
          t
  routes:
  - name: httpbin-route
    tags:
    - httpbin-service-route
    paths:
    - /httpbin-route
EOF
```

Loki requires a specific format for [log ingestion](https://grafana.com/docs/loki/latest/reference/loki-http-api/#ingest-logs). The Lua code inside the ``custom_fields_for_lua`` parameter processes the log to be supported by Loki.

### Update the DataPlane with new Lua configuration

The **cjon** Lua function, used by the **TCP Log** plugin is considered ``untrusted`` so we need to configure the Data Plane with the ``KONG_UNTRUSTED_LUA_SANDBOX_REQUIRES`` paramenter to accept it.

```
kubectl delete dataplane dataplane1 -n kong
```

```
cat <<EOF | kubectl apply -f -
apiVersion: gateway-operator.konghq.com/v1beta1
kind: DataPlane
metadata:
  name: dataplane1
  namespace: kong
spec:
  extensions:
  - kind: KonnectExtension
    name: konnect-config1
    group: konnect.konghq.com
  deployment:
    podTemplateSpec:
      spec:
        containers:
        - name: proxy
          image: kong/kong-gateway:3.11
          env:
          - name: KONG_TRACING_INSTRUMENTATIONS
            value: all
          - name: KONG_TRACING_SAMPLING_RATE
            value: "1.0"
          - name: KONG_UNTRUSTED_LUA_SANDBOX_REQUIRES
            value: cjson
  network:
    services:
      ingress:
        name: proxy1
        type: LoadBalancer
EOF
```


### Consume the Kong Route
```
curl -v $DATA_PLANE_LB/httpbin-route/get
```


### Check Logs in Grafana

In Grafana UI:

* Click "Explore" in the left-side menu.
* Choose "Loki" as the data source.
* Click "Run query" with the following parameters. You should see the logs there.


![grafana_loki](/static/images/grafana_loki.png)

