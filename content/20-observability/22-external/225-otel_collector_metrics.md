---
title : "OTel Collector and Metrics"
weight : 225
---

Now, let's add Metrics to our environment. Kong has supported Prometheus-based metrics for a long time through the [Prometheus Plugin](https://docs.konghq.com/hub/kong-inc/prometheus/). In an OpenTelemetry configuration scenario the plugin is an option, where we could add a specific [“prometheusreceiver”](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/receiver/prometheusreceiver/README.md) to the collector configuration. The receiver is responsible for scraping the Data Plane's [Status API](https://docs.konghq.com/gateway/latest/reference/configuration/#status_listen), which, by default, is configured with the ``:8100/metrics`` endpoint.

You can check the port with:

```
kubectl get pod -o yaml $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("dataplane-"))' | jq -r '.name') -n kong | yq '.spec.containers[].env[] | select(.name == "KONG_STATUS_LISTEN")'
```

Expected result:
```
name: KONG_STATUS_LISTEN
value: 0.0.0.0:8100
```

and with:

```
kubectl get pod -o yaml $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("dataplane-"))' | jq -r '.name') -n kong | yq '.spec.containers[].ports[] | select(.name == "metrics")'           
```

Expected result:
```
containerPort: 8100
name: metrics
protocol: TCP
```



https://prometheus.io/docs/guides/opentelemetry/



### New collector configuration

We need to add the new ``Prometheus Receiver`` to our OTel Collector configuration:

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

    exporters:
      otlphttp/jaeger:
        endpoint: http://jaeger-collector.jaeger:4318
      otlphttp/prometheus:
        endpoint: http://prometheus-operated.prometheus:9090/api/v1/otlp
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
EOF
```

The declaration has critical parameters defined:
* Inside the “service” configuration section, a new “metrics” pipeline have been included:
  * The Prometheus exporter configured, so we can access the metrics sending requests directly to the collector through port 8889 as described in the exporter section.
  * It also includes the ``otlp`` receiver, so it can grab metrics coming from the Backend microservices as well.


#### Kubernetes Service Account for Prometheus Receiver
The OTel Collector [Prometheus Receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/receiver/prometheusreceiver/README.md) fully supports the [scraping configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#scrape_config) defined by Prometheus. The receiver, more precisely, uses the [``pod``](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#pod) role of the Kubernetes Service Discovery configurations ([``kubernetes_sd_config``](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config)). Specific [``relabel_config``](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#relabel_config) settings with “regex” expressions allow the receiver to discover Kubernetes Pods that belong to the Kong Data Plane deployment.

One of the relabeling configs is related to the port 8100, named ``metrics``. This port configuration is part of the Data Plane deployment we used to get it running. 


That's the Kong Gateway's Status API where the Prometheus plugin exposes the metrics produced. In fact, the endpoint the receiver scrapes is, as specified in the OTel Collector configuration, ``http://<Data_Plane_Pod_IP>:8100/metrics``

On the other hand, the OTel Collector has to be allowed to scrape the endpoint. We can define such permission with a Kubernetes ClusterRole and apply it to a Kubernetes Service Account with a Kubernetes ClusterRoleBinding.

Here's the ClusterRole declaration. It's a quite open one but it's good enough for this exercise.

```
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
EOF
```

Then we need to create a Kubernetes Service Account and bind the Role to it.
```
kubectl create sa collector -n opentelemetry-operator-system
```

```
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-pods
roleRef:
  kind: ClusterRole
  name: pod-reader
subjects:
- kind: ServiceAccount
  name: collector
  namespace: opentelemetry-operator-system
EOF
```



```
cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: collector
  namespace: opentelemetry-operator-system 
  labels:
    app.kubernetes.io/name: kong
spec:
 selector:
   matchLabels:
     gateway-operator.konghq.com/dataplane-service-type: ingress
 endpoints:
 - targetPort: metrics
   scheme: http
 jobLabel: kong
 namespaceSelector:
   matchNames:
     - kong
EOF
```




### Check Prometheus

In MacOS, you can open Grafana with:

```
open -a "Google Chrome" "http://localhost:9090"
```


Finally, note that the OTel Collector configuration is deployed using the Service Account with ``serviceAccount: collector`` and then it will be able to scrape the endpoint exposed by Kong Gateway.

#### Deploy the collector
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

### Configure the Prometheus Plugins
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
  routes:
  - name: httpbin-route
    tags:
    - httpbin-service-route
    paths:
    - /httpbin-route
EOF
```

Submit the new plugin declaration with:
```
deck gateway sync --konnect-token $PAT httpbin.yaml
```

Consume the Application and check collector's Prometheus endpoint
Using “port-forward”, send a request to the collector's Prometheus endpoint. In a terminal run:
```
kubectl port-forward service/collector-kong-collector -n opentelemetry-operator-system 8889
```

Continue navigating the Application to see some metrics getting generated. In another terminal send a request to Prometheus’ endpoint.
```
http :8889/metrics
```

You should see several related Kong metrics including, for example, Histogram metrics like “kong_kong_latency_ms_bucket”, “kong_request_latency_ms_bucket” and “kong_upstream_latency_ms_bucket”. Maybe one of the most important is “kong_http_requests_total” where we can see consumption metrics. Here's a snippet of the output:

```
# HELP kong_http_requests_total HTTP status codes per consumer/service/route in Kong
# TYPE kong_http_requests_total counter
kong_http_requests_total{code="200",instance="192.168.76.233:8100",job="otel-collector",route="coupon_route",service="coupon_service",source="service",workspace="default"} 1
kong_http_requests_total{code="200",instance="192.168.76.233:8100",job="otel-collector",route="inventory_route",service="inventory_service",source="service",workspace="default"} 1
kong_http_requests_total{code="200",instance="192.168.76.233:8100",job="otel-collector",route="pricing_route",service="pricing_service",source="service",workspace="default"} 1
```

### Check Metrics in Grafana


