---
title : "OTel Collector and Jaeger Tracing"
weight : 240
---

Here's a nice introduction of [OTel Collector and Jaeger](https://www.jaegertracing.io/docs/latest/architecture/#with-opentelemetry-collector) deployment. The Collector is going to be running as a "remote cluster" in a specific K8s deployument.

#### Jaeger Installation

We are going to use the [Jaeger Helm Charts](https://github.com/jaegertracing/helm-charts/tree/v2/charts/jaeger)

Save the ```values.yaml``` Jaeger provides as an example:

```
wget -O jaeger-values.yaml https://raw.githubusercontent.com/jaegertracing/helm-charts/refs/heads/v2/charts/jaeger/values.yaml
```

And use it to install Jaeger 2.9.0
```
helm install jaeger jaegertracing/jaeger -n observability \
  --create-namespace \
  --set allInOne.image.repository=jaegertracing/jaeger \
  --set allInOne.image.tag=2.9.0 \
  --values ./jaeger-values.yaml

kubectl patch deployment jaeger -n observability --type json \
  -p='[
    {"op": "remove", "path": "/spec/template/spec/containers/0/readinessProbe"},
    {"op": "remove", "path": "/spec/template/spec/containers/0/livenessProbe"}
  ]'
```

If you want to uninstall it run:
```
helm uninstall jaeger -n observability
kubectl delete namespace observability
```


Check Jaeger's log with:

```
kubectl logs -f $(kubectl get pod -n observability -o json | jq -r '.items[].metadata | select(.name | startswith("jaeger-"))' | jq -r '.name') -n observability
```


#### OpenTelemetry Collector instantiation

##### Create a collector declaration
To get started we're going to manage Traces first. Later on, we'll enhance the collector to process both Metrics and Logs. Here's the declaration:

```
cat > otelcollector.yaml << 'EOF'
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
metadata:
  name: collector-kong
  namespace: opentelemetry-operator-system
spec:
  image: otel/opentelemetry-collector-contrib:0.132.2
  mode: deployment
  config:
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    exporters:
      otlphttp:
        endpoint: http://jaeger-collector.observability:4318
      #debug:
      #  verbosity: detailed

    service:
      pipelines:
        traces:
          receivers: [otlp]
          exporters: [otlphttp]
EOF
```

The declaration has critical parameters defined:
* image: it refers to the OTel Collector contrib distribution.
* mode: deployment. The collector can be deployed in 4 different modes: “Deployment”, “DaemonSet”, “StatefulSet” and “Sidecar”. For better control of the Controller, we've chosen regular Kubernetes Deployment mode. Please, refer to the Kubernetes documentation to learn more about them.
* The config section has the collector components (receivers and exporters) as well as the “service” section defining the Pipeline.
* The “receivers” section tells us the collector will be listening to ports 4317 and 4318 and will be receiving data over “grpc” and “http”.
* The “exporters” section used the endpoint and the API Token to send data to Jaeger. You can check the Jaeger's APIs [here](https://www.jaegertracing.io/docs/latest/architecture/apis/).
* The “service” section defines the Pipeline.

##### Deploy the collector

```
kubectl apply -f otelcollector.yaml
```

If you want to destroy it run:

```
kubectl delete opentelemetrycollector collector-kong -n opentelemetry-operator-system
```

Check the collector's log with:
```
kubectl logs -f $(kubectl get pod -n opentelemetry-operator-system -o json | jq '.items[].metadata | select(.name | startswith("collector"))' | jq -r '.name') -n opentelemetry-operator-system
```

Based on the declaration, the deployment creates a Kubernetes service named “collector-kong-collector” listening to ports 4317 and 4318. That means that any application, including Kong Data Plane, should refer to the OTel Collector's Kubernetes FQDN (e.g., http://collector-kong-collector.opentelemetry-operator-system.svc.cluster.local:4318/v1/traces) to send data to the collector. The “/v1/traces” path is the default the collector uses to handle requests with trace data.

```
% kubectl get service collector-kong-collector -n opentelemetry-operator-system 
NAME                       TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)             AGE
collector-kong-collector   ClusterIP   10.102.44.48   <none>        4317/TCP,4318/TCP   55s
```


#### Update the DataPlane with tracing instrumentations

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
  network:
    services:
      ingress:
        name: proxy1
        type: LoadBalancer
EOF
```

#### Apply the OTel Plugin to the Kong Service and consume the Kong Route

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
  routes:
  - name: httpbin-route
    tags:
    - httpbin-service-route
    paths:
    - /httpbin-route
EOF
```

Submit the declaration

```
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
deck gateway sync --konnect-token $PAT httpbin.yaml
```

Consume the Kong Route
```
curl -v $DATA_PLANE_LB/httpbin-route/get
```



#### Use Grafana to see your traces

##### Installing Prometheus and Grafana

The Prometheus community distribution embeds Grafana so we can install both with a single command. Add the Helm Charts first:

```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
```

Again, after the installation, we should have two new Minikube tunnels defined:
```
helm install prometheus -n prometheus prometheus-community/kube-prometheus-stack \
--create-namespace \
--set alertmanager.enabled=false \
--set prometheus.service.type=LoadBalancer \
--set prometheus.service.port=9090 \
--set grafana.service.type=LoadBalancer \
--set grafana.service.port=3000 \
--set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

If you want to uninstall them run:

```
helm uninstall prometheus -n prometheus
kubectl delete namespace prometheus
```

By default, Grafana administrador's credentials are: ```admin/prom-operator```


In MacOS, you can open Grafana with:

```
open -a "Google Chrome" "http://localhost:3000"
```


##### Configure Grafana

[Documentation](https://grafana.com/docs/grafana/latest/datasources/jaeger)

![grafana_jaeger](/static/images/grafana_jaeger.png)


