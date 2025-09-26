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
$ kubectl exec $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-server --version
Redis server v=7.4.5 sha=00000000:0 malloc=libc bits=64 build=d2e5921793838dd
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
  --set ollama.models.pull[0]="mxbai-embed-large:latest" \
  --set ollama.models.pull[1]="llama3.2:1b" \
  --set service.type=LoadBalancer
```

Check the version and models
```
$ kubectl exec -it $(kubectl get pod -n ollama -o json | jq -r '.items[].metadata.name') -n ollama -- ollama --version
ollama version is 0.12.2


$ kubectl exec -it $(kubectl get pod -n ollama -o json | jq -r '.items[].metadata.name') -n ollama -- ollama list
NAME                        ID              SIZE      MODIFIED
llama3.2:1b                 baf6a787fdff    1.3 GB    31 minutes ago
mxbai-embed-large:latest    468836162de7    669 MB    32 minutes ago
```

Send request to test it:

```
curl -sX POST http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Tell me about Miles Davis",
  "stream": false
}' | jq '.response'
```


Expected response:
```
"Miles Davis (1926-1991) was an American jazz trumpeter, bandleader, and composer. He is widely regarded as one of the most influential musicians in the history of jazz.\n\nEarly Life and Career:\n\nBorn in Alton, Illinois, Davis grew up in a musical family and began playing trumpet at age five. He studied music theory and composition at the Juilliard School in New York City before serving in the United States Army during World War II.\n\nAfter the war, Davis moved to New York City's lower East Side, where he formed his first jazz group with guitarist Red Garland and pianist Cannonball Adderley. In 1954, he joined the cool jazz group Chirps, later renamed Art Bayou's Jazz Experience.\n\nThe \"Cool\" Period:\n\nIn 1956, Davis moved to Los Angeles to form a new band with pianist John Coltrane, bassist Charles Mingus, and drummer Bill Evans. This group was known as Miles Davis Quintet and released several critically acclaimed albums, including \"Birth of the Cool\" (1957) and \"Kind of Blue\" (1959). The quintet's music marked a turning point in jazz history, with its emphasis on cool, introspective, and expressive playing.\n\nIn the early 1960s, Davis began to experiment with more avant-garde and experimental approaches to jazz. He collaborated with pianist Herbie Hancock on the album \"Milestones\" (1960), which featured a more complex and electronic approach to jazz.\n\nLater Years:\n\nIn the late 1960s, Davis's playing became increasingly introspective and personal. He released several critically acclaimed albums, including \"Bitches Brew\" (1970) and \"A Tribute to Jack Johnson\" (1971). His later work was marked by a more relaxed and improvisational approach, as he explored new musical territories and collaborated with artists from other genres.\n\nPersonal Life:\n\nDavis's personal life was marked by periods of great creativity and introspection. He had several high-profile relationships, including with actress Joanna Glenn and fashion designer Carole King. In the 1970s, Davis became increasingly interested in Eastern spirituality and meditation, which influenced his later music.\n\nDeath:\n\nMiles Davis died on September 28, 1991, at the age of 65, due to complications from heart failure. He was buried in the Forest Lawn Memorial Park Cemetery in Glendale, California.\n\nLegacy:\n\nMiles Davis's legacy is profound and far-reaching. He helped shape the development of cool jazz and improvisational music, and his influence can be heard in countless artists across multiple genres. His innovative approach to jazz has inspired generations of musicians, from John Coltrane to Wayne Shorter and beyond.\n\nDavis's music continues to be celebrated for its complexity, depth, and emotional resonance. He remains one of the most beloved and respected figures in jazz history, and his impact on modern music is immeasurable."
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


