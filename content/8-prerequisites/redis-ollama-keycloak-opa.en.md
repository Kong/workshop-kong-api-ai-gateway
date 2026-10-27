---
title: "Redis and Ollama"
weight: 105
---

## Install Redis
Use the **redis-stack** Helm Charts to install Redis as our vector database.

```
helm repo add redis-stack https://redis-stack.github.io/helm-redis-stack
helm repo update
```

```
helm install redis-stack redis-stack/redis-stack -n redis --create-namespace
```

Check the installation:
```
kubectl exec $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-server --version
```
Output: 
```
Redis server v=7.4.7 sha=00000000:0 malloc=libc bits=64 build=35af8276b891a7b7
```

If you want to uninstall it:
```
helm uninstall redis-stack -n redis
kubectl delete namespace redis
```





## Install Ollama
As our Embedding model, we're going to consume the “mxbai-embed-large:latest” model handled locally by Ollama. Use the Ollama Helm Charts to install it.

```
helm repo add ollama-helm https://otwld.github.io/ollama-helm/
helm repo update
```

```
helm install ollama ollama-helm/ollama \
-n ollama \
  --create-namespace \
  --set 'ollama.models.pull[0]=mxbai-embed-large:latest' \
  --set 'ollama.models.pull[1]=llama3.2:1b' \
  --set service.type=LoadBalancer
```
>Zsh fixed now. errors because of the [0]

Additional Models to try IF you have a very fast download connection only (many GB to download)
```
helm install ollama ollama-helm/ollama \
-n ollama \
  --create-namespace \
  --set 'ollama.models.pull[0]=mxbai-embed-large:latest' \
  --set 'ollama.models.pull[1]=llama3.2:1b' \
  --set 'ollama.models.pull[2]=gemma4:latest' \
  --set 'ollama.models.pull[3]=qwen3.5:4b' \
  --set 'ollama.models.pull[4]=mistral:7b' \
  --set service.type=LoadBalancer
```
Check the version and models
```
kubectl exec -it $(kubectl get pod -n ollama -o json | jq -r '.items[].metadata.name') -n ollama -- ollama --version
```
Output:
```
ollama version is 0.32.4
```

```
kubectl exec -it $(kubectl get pod -n ollama -o json | jq -r '.items[].metadata.name') -n ollama -- ollama list
```
Output:
```
NAME                        ID              SIZE      MODIFIED
llama3.2:1b                 baf6a787fdff    1.3 GB    31 minutes ago
mxbai-embed-large:latest    468836162de7    669 MB    32 minutes ago
```

Send request to test it:

```
curl -sX POST http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Tell me about Claudio Acquaviva",
  "stream": false
}' | jq '.response'
```


Expected response:
```
"Claudio Acquaviva is an Italian film director, screenwriter, and actor. He was born in 1964 in Rome, Italy. Acquaviva's work often explores themes of Italian identity, history, and culture, often blending elements of drama, comedy, and documentary genres.\n\nAcquaviva gained recognition in the 1990s for his work as a director and screenwriter, directing several films that were critical and commercial successes. Some of his notable works include:\n\n* \"L'Amico al 13\" (1998), a comedy-drama that explores the complexities of male friendships.\n* \"Il grande leone\" (2009), a biographical drama about the life of Italian film director and writer Enrico De Cicco.\n* \"Caccia al tesoro del cuore\" (2012), a comedy-drama that follows a young man as he navigates love, loss, and family relationships.\n\nAcquaviva has also collaborated with other notable Italian filmmakers, such as Bernardo Bertolucci and Giuseppe Tornatore. He has received several awards and nominations for his work, including a Goya Award for Best Director for his film \"Il grande leone\".\n\nIn addition to his film work, Acquaviva is also an accomplished actor, with roles in several Italian films and television productions. He has worked with various notable Italian actors, including Alberto Sordi and Alberto Cambogia.\n\nOverall, Claudio Acquaviva is a respected and accomplished filmmaker in Italy, known for his nuanced and engaging storytelling, which often explores themes of identity, history, and culture."
```


If you want to uninstall it:
```
helm uninstall ollama -n ollama
kubectl delete namespace ollama
```


## Enable Metrics Server

```
minikube addons enable metrics-server
```


```
minikube addons list
```



## Keycloak and OPA
The installation procedures for both servers are available in the **OpenID Connect** and **OPA (Open Policy Agent)** sections


