---
title: "Redis and Ollama"
weight: 105
---


## Install Ollama
As our Embedding model, we're going to consume the “mxbai-embed-large:latest” model handled locally by Ollama. Use the Ollama Helm Charts to install it.

{{<highlight>}}
helm repo add ollama-helm https://otwld.github.io/ollama-helm/
helm repo update

helm install ollama ollama-helm/ollama \
-n ollama \
  --create-namespace \
  --set ollama.models.pull[0]="mxbai-embed-large:latest" \
  --set service.type=LoadBalancer
{{</highlight>}}


## Install Redis
Use the Redis-stack Helm Charts to Redis as our vector database.

{{<highlight>}}
helm repo add redis-stack https://redis-stack.github.io/helm-redis-stack
helm repo update

helm install redis-stack redis-stack/redis-stack -n redis --create-namespace
{{</highlight>}}
