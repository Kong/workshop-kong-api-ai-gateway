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

Add the Helm Charts first:

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
--set prometheus.prometheusSpec.additionalArgs[0].name=web.enable-otlp-receiver \
--set prometheus.prometheusSpec.additionalArgs[0].value=
```

#### Loki Installation

First, all the Helm Charts

```
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

Install Loki with the following Helm command. Since we are exposing it with a Load Balancer, Minikube will start a new tunnel for the port 3100.


```
helm install loki grafana/loki \
  --namespace=loki --create-namespace \
  -f loki-config.yaml
```

```
kubectl patch svc loki \             
  -n loki \
  -p '{"spec": {"type": "LoadBalancer"}}'
```


#### Grafana Installation

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
