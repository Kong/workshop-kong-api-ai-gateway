---
title : "OTel Collector Operator Installation"
weight : 223
---

To deploy the OpenTelemetry Collector and to get better control over it, we're going to do it through the OpenTelemetry Kubernetes Operator. In fact, the collector is also capable of auto-instrument applications and services using OpenTelemetry instrumentation libraries.

#### Installing Cert-Manager
The OpenTelemetry Operator requires [Cert-Manager](https://cert-manager.io/) to be installed in your Kubernetes cluster. The Cert-Manager can then issue certificates to be used by the communication between the Kubernetes API Server and the existing webhook included in the operator.

Use the [Cert-Manager Helm Charts](https://cert-manager.io/docs/installation/helm/) to get it installed.

```
helm install \
  cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --version v1.18.2 \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

#### Installing OpenTelemetry Operator
Now we're going to use the [OpenTelemetry Helm Charts](https://github.com/open-telemetry/opentelemetry-helm-charts) to install it. Add its repo:

```
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
```


Install the operator:

```
helm install opentelemetry-operator open-telemetry/opentelemetry-operator \
  --namespace opentelemetry-operator-system \
  --create-namespace \
  --set manager.collectorImage.repository=otel/opentelemetry-collector-k8s \
  --set admissionWebhooks.certManager.enabled=true
```

The “admissionWebhooks” parameter asks Cert-Manager to generate a self-signed certificate. The operator installs some new CRDs used to create a new OpenTelemetry Collector. You can check them out with:

```
kubectl describe crd opentelemetrycollectors.opentelemetry.io
kubectl describe crd instrumentations.opentelemetry.io
```


