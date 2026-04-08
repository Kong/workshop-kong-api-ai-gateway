---
title : "Observability Stack Installation"
weight : 224
---

#### Jaeger Installation

We are going to use the [Jaeger Helm Charts](https://github.com/jaegertracing/helm-charts/tree/v2/charts/jaeger)

Save the ```values.yaml``` Jaeger provides as an example:

```
wget -O jaeger-values.yaml https://raw.githubusercontent.com/jaegertracing/helm-charts/refs/heads/v2/charts/jaeger/values.yaml
```

And use it to install Jaeger 2.9.0
```
helm install jaeger jaegertracing/jaeger -n jaeger \
  --create-namespace \
  --set allInOne.image.repository=jaegertracing/jaeger \
  --set allInOne.image.tag=2.9.0 \
  --values ./jaeger-values.yaml

kubectl patch deployment jaeger -n jaeger --type json \
  -p='[
    {"op": "remove", "path": "/spec/template/spec/containers/0/readinessProbe"},
    {"op": "remove", "path": "/spec/template/spec/containers/0/livenessProbe"}
  ]'
```

Check Jaeger's log with:

```
kubectl logs -f $(kubectl get pod -n jaeger -o json | jq -r '.items[].metadata | select(.name | startswith("jaeger-"))' | jq -r '.name') -n jaeger
```





#### Prometheus Installation

Add the [Helm Charts](https://github.com/prometheus-community/helm-charts) repo first:

```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
```

Again, after the installation, we should have two new Minikube tunnels defined:
```
helm install prometheus -n prometheus prometheus-community/kube-prometheus-stack \
--create-namespace \
--set alertmanager.enabled=false \
--set grafana.enabled=false \
--set prometheus.service.type=LoadBalancer \
--set prometheus.service.port=9090 \
--set prometheus.prometheusSpec.additionalArgs[0].name=web.enable-otlp-receiver \
--set prometheus.prometheusSpec.additionalArgs[0].value=
```





#### Loki Installation

First, add the [Helm Charts](https://github.com/grafana/loki/blob/main/production/helm/loki/README.md). Read the [documentation](https://grafana.com/docs/loki/next/setup/install/helm/) to learn more.

```
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

Now, create a ``loki-values.yaml`` with the deployment configuration. We are using a simple monolithic [**SingleBinary**](https://grafana.com/docs/loki/latest/setup/install/helm/install-monolithic/) option.

```
cat > loki-values.yaml << 'EOF'
deploymentMode: SingleBinary

singleBinary:
  replicas: 1
  persistence:
    enabled: false
  canary:
    enabled: false
    args:
      - -log-output=false
  extraVolumeMounts:
    - name: loki-storage
      mountPath: /var/loki
  extraVolumes:
    - name: loki-storage
      emptyDir: {}

loki:
  commonConfig:
    replication_factor: 1
  image:
    tag: 3.5.3
  auth_enabled: false
  memberlist:
    enable: false
  storage:
    type: filesystem
    filesystem:
      chunks_directory: /var/loki/chunks
      rules_directory: /var/loki/rules

  schemaConfig:
    configs:
      - from: "2024-04-01"
        store: tsdb
        object_store: filesystem
        schema: v13
        index:
          prefix: loki_index_
          period: 24h

  limits_config:
    allow_structured_metadata: true
    volume_enabled: true

  ruler:
    enable_api: true

  pattern_ingester:
    enabled: true

chunksCache:
  enabled: false

resultsCache:
  enabled: false

indexGateway:
  enabled: false

minio:
  enabled: false

gateway:
  enabled: false

backend:
  replicas: 0
read:
  replicas: 0
write:
  replicas: 0
ingester:
  replicas: 0
querier:
  replicas: 0
queryFrontend:
  replicas: 0
queryScheduler:
  replicas: 0
distributor:
  replicas: 0
compactor:
  replicas: 0
bloomCompactor:
  replicas: 0
bloomGateway:
  replicas: 0
EOF
```


Install Loki with the following Helm command. Since we are exposing it with a Load Balancer, Minikube will start a new tunnel for the port 3100.



```
helm install loki grafana/loki \
  --namespace=loki --create-namespace \
  -f loki-values.yaml
```

```
kubectl patch svc loki \
  -n loki \
  -p '{"spec": {"type": "LoadBalancer"}}'
```





#### Grafana Installation

The Grafana installation [Helm](https://github.com/grafana/helm-charts/) commands creates the Data Sources for the 3 components, Jaeger, Prometheus and Loki, using their specific Kubernetes FQDN endpoints.

Add the repo:
```
helm repo add grafana https://grafana.github.io/helm-charts
```

Deploy Grafana and three Data Sources.

```
helm upgrade --install grafana grafana/grafana \
--namespace grafana \
--create-namespace \
--set adminUser=admin \
--set adminPassword=admin \
--set service.type=LoadBalancer \
--set service.port=3000 \
--set datasources."datasources\.yaml".apiVersion=1 \
--set datasources."datasources\.yaml".datasources[0].name=Jaeger \
--set datasources."datasources\.yaml".datasources[0].type=jaeger \
--set datasources."datasources\.yaml".datasources[0].url=http://jaeger-query.jaeger:16686 \
--set datasources."datasources\.yaml".datasources[0].access=proxy \
--set datasources."datasources\.yaml".datasources[1].name=Prometheus \
--set datasources."datasources\.yaml".datasources[1].type=prometheus \
--set datasources."datasources\.yaml".datasources[1].url=http://prometheus-kube-prometheus-prometheus.prometheus:9090 \
--set datasources."datasources\.yaml".datasources[1].access=proxy \
--set datasources."datasources\.yaml".datasources[2].name=Loki \
--set datasources."datasources\.yaml".datasources[2].type=loki \
--set datasources."datasources\.yaml".datasources[2].url=http://loki.loki:3100 \
--set datasources."datasources\.yaml".datasources[2].access=proxy
```




#### Uninstall

If you want to uninstall them run:

```
helm uninstall jaeger -n jaeger
kubectl delete namespace jaeger
```

```
helm uninstall prometheus -n prometheus
kubectl delete namespace prometheus
```

```
helm uninstall loki -n loki
kubectl delete namespace loki
```

```
helm uninstall grafana -n grafana
kubectl delete namespace grafana
```
