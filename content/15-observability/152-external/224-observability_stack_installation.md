---
title : "Observability Stack Installation"
weight : 224
---

#### Jaeger Installation

We are going to use the [Jaeger Helm Charts](https://github.com/jaegertracing/helm-charts/tree/v2/charts/jaeger). Add its repo:

```
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update
```


And use it to install Jaeger
```
helm install jaeger jaegertracing/jaeger -n jaeger \
  --create-namespace \
  --set allInOne.image.repository=jaegertracing/jaeger \
  --set allInOne.image.tag=2.17.0 \
  --set livenessProbe.initialDelaySeconds=30 \
  --set livenessProbe.periodSeconds=15 \
  --set readinessProbe.initialDelaySeconds=30 \
  --set readinessProbe.periodSeconds=15 \
  --set provisionDataStore.cassandra=false \
  --set storage.type=memory \
  --set agent.enabled=false \
  --set collector.enabled=false \
  --set query.enabled=false \
  --set service.type=ClusterIP
```




Check Jaeger's log with:

```
kubectl logs -f $(kubectl get pod -n jaeger -o json | jq -r '.items[].metadata | select(.name | startswith("jaeger-"))' | jq -r '.name') -n jaeger
```





#### Prometheus Installation

Add the [Helm Charts](https://github.com/prometheus-community/helm-charts) repo first:

```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
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
--set prometheus.prometheusSpec.additionalArgs[0].value=""
```





#### Loki Installation

First, add the [Helm Charts](https://github.com/grafana/loki/blob/main/production/helm/loki/README.md). Read the [documentation](https://grafana.com/docs/loki/next/setup/install/helm/) to learn more.

```
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```


Install Loki with the following Helm command.

```
helm upgrade --install loki grafana/loki \
--namespace loki \
--create-namespace \
--set deploymentMode=SingleBinary \
--set singleBinary.replicas=1 \
--set singleBinary.persistence.enabled=false \
--set singleBinary.extraVolumeMounts[0].name=loki-storage \
--set singleBinary.extraVolumeMounts[0].mountPath=/var/loki \
--set singleBinary.extraVolumes[0].name=loki-storage \
--set-json 'singleBinary.extraVolumes[0].emptyDir={}' \
--set loki.image.tag=3.7.1 \
--set loki.auth_enabled=false \
--set loki.commonConfig.replication_factor=1 \
--set loki.storage.type=filesystem \
--set loki.useTestSchema=true \
--set loki.limits_config.allow_structured_metadata=true \
--set loki.otlp_config.resource_attributes.attributes_config[0].action=index_label \
--set loki.otlp_config.resource_attributes.attributes_config[0].attributes[0]=service.name \
--set chunksCache.enabled=false \
--set resultsCache.enabled=false \
--set minio.enabled=false \
--set gateway.enabled=false \
--set read.replicas=0 \
--set write.replicas=0 \
--set backend.replicas=0
```






#### Grafana Installation

The Grafana installation [Helm](https://github.com/grafana/helm-charts/) commands creates the Data Sources for the 3 components, Jaeger, Prometheus and Loki, using their specific Kubernetes FQDN endpoints.

Add the repo:
```
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
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
--set datasources."datasources\.yaml".datasources[0].url=http://jaeger.jaeger:16686 \
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
