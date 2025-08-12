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
* [jwt-cli](https://github.com/mike-engel/jwt-cli)
* [wget](https://www.gnu.org/software/wget/)


## Redis
[Redis](https://redis.io/docs/) is used in some use cases, including Rate Limiting, Caching, Semantic Routing and RAG.


## LLM
### Ollama
The Kong AI Gateway use cases consume and protect LLMs running on [Ollama](https://github.com/ollama)


### OpenAI
Some AI use cases also use OpenAI's Embeddings and LLMs. Please make sure you have an OpenAI API key.



## Recommended hardware not including Ollama

* CPU: 4-6 vCPUs
* Memory: 8-16GB
* Disk: 30–50GB

## Recommended hardware including Ollama

* CPU: 6-8 vCPUs
* Memory: 12-24GB
* Disk:	50-100GB
