---
title: "Redis and Ollama"
weight: 105
---

## Install Redis
Use the **redis-stack** Helm Charts to install Redis as our vector database.

{{<highlight>}}
helm repo add redis-stack https://redis-stack.github.io/helm-redis-stack
helm repo update
{{</highlight>}}

{{<highlight>}}
helm install redis-stack redis-stack/redis-stack -n redis --create-namespace
{{</highlight>}}

Check the installation:
{{<highlight>}}
kubectl exec $(kubectl get pod -n redis -o json | jq -r '.items[].metadata.name') -n redis -- redis-server --version
{{</highlight>}}

If you want to uninstall it:
{{<highlight>}}
helm uninstall redis-stack -n redis
kubectl delete namespace redis
{{</highlight>}}





## Install Ollama
As our Embedding model, we're going to consume the “mxbai-embed-large:latest” model handled locally by Ollama. Use the Ollama Helm Charts to install it.

{{<highlight>}}
helm repo add ollama-helm https://otwld.github.io/ollama-helm/
helm repo update
{{</highlight>}}

{{<highlight>}}
helm upgrade ollama ollama-helm/ollama \
-n ollama \
  --create-namespace \
  --set ollama.models.pull[0]="mxbai-embed-large:latest" \
  --set ollama.models.pull[1]="deepseek-r1:1.5b" \
  --set service.type=LoadBalancer
{{</highlight>}}


Send request to test it:

{{<highlight>}}
curl -sX POST http://localhost:11434/api/generate -d '{
  "model": "deepseek-r1:1.5b",
  "prompt": "Tell me about Miles Davis",
  "stream": false
}' | jq '.response'
{{</highlight>}}


Expected response:
```
"<think>\n\n</think>\n\nMiles Davis is an American singer, songwriter, and record producer. He gained prominence in the 1980s with hits like \"She's My Girl\" (1985) and \"Candle in the Wind\" (1986). Davis has also been active since then, with singles like \"Just a Love Again\" and \"Skiwave\" being notable.\n\n### Key Achievements:\n- **Chart-Topping Hits**: Davis was known for hitting top charts with songs like \"She's My Girl,\" which reached number 4 and sold over 30 million.\n- **Mint Record Sales**: His 1985 hit \"She's MyGirl\" had the highest sales of any single in U.S. music history, contributing to its chart-topping status.\n\n### Legacy:\n- **Bass Player/Engineer**: Davis is sometimes referred to as a \"bass player\" or \"engineer,\" playing an integral role in many of his hits.\n- **Television Appearances**: He has also been in numerous TV appearances and movies, adding significant commercial success.\n\nMiles Davis remains one of the most recognizable names in U.S. music history."
```


If you want to uninstall it:
{{<highlight>}}
helm uninstall ollama -n ollama
kubectl delete namespace ollama
{{</highlight>}}




## Metrics Server

{{<highlight>}}
minikube addons enable metrics-server
{{</highlight>}}


{{<highlight>}}
minikube addons list
{{</highlight>}}