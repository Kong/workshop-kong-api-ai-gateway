---
title : "Prerequisites"
weight : 100
---


This chapter will walk you through the prerequisites.


## Kong Konnect Subscription
You will need a Kong Konnect Subscription to execute this workshop.

If you want to check the Konnect Pricing and Plans, please, redirect to https://konghq.com/pricing


## Kong Gateway Data Plane
In this workshop, the Data Plane will be running locally on a [Minikube](https://minikube.sigs.k8s.io/) Kubernetes Cluster over [Podman](https://podman.io/).

* [Podman installation](https://podman.io/docs/installation)
* [Minikube installation](https://minikube.sigs.k8s.io/docs/start)


## Command Line Utilities
In this workshop, we will use the following command line utilities

* [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
* [k9s](https://k9scli.io/)
* [curl](https://curl.se/)
* [jq](https://jqlang.org/)
* [yq](https://github.com/mikefarah/yq)
* [wget](https://www.gnu.org/software/wget/)


## Redis
[Redis](https://redis.io/docs/) is used in some use cases, including Rate Limiting, Caching, Semantic Routing and RAG.


## Ollama
The Kong AI Gateway use cases consume and protect LLM models running on [Ollama](https://github.com/ollama)
