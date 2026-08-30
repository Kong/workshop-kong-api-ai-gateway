---
title : "AI Gateway 2 Control Plane and Data Plane"
weight : 206
---

## Kong Operator

Install the Operator
```
helm repo add kong https://charts.konghq.com
helm repo update
helm search repo kong/kong-operator --versions --devel
```


```
helm upgrade --install ko kong/kong-operator \
-n kong-system \
--create-namespace \
--set image.tag=2.3.0-rc.3 \
--version 1.4.0-rc.2 \
--set env.ENABLE_CONTROLLER_KONNECT=true \
--set env.ENABLE_CONTROLLER_AIGATEWAYDATAPLANE=true
```



You can check the Operator’s log with:
```
kubectl -n kong-system rollout status deployment/ko-kong-operator-controller-manager
```

or

```
kubectl logs -f $(kubectl get pod -n kong-system -o json | jq -r '.items[].metadata | select(.name | startswith("ko-kong-operator"))' | jq -r '.name') -n kong-system
```

If you want to delete Kong Operator

```
helm uninstall kong-operator -n kong-system
kubectl delete namespace kong-system
```



## Control Plane

Set your PAT environment variable

```
export PAT=<YOUR_PAT>
```


Create the namespace

```
kubectl create namespace kong
```


Create a Kubernetes Secret with the PAT and the [Authentication Configuration](https://developer.konghq.com/operator/reference/custom-resources/#konnect-konghq-com-v1alpha1-konnectapiauthconfiguration)

```
cat <<EOF | kubectl apply -f -
kind: Secret
apiVersion: v1
metadata:
  name: konnect-api-auth-secret
  namespace: kong
  labels:
    konghq.com/credential: konnect
    konghq.com/secret: "true"
stringData:
  token: $PAT
---
kind: KonnectAPIAuthConfiguration
apiVersion: konnect.konghq.com/v1alpha1
metadata:
  name: konnect-api-auth-conf
  namespace: kong
spec:
  type: secretRef
  secretRef:
    name: konnect-api-auth-secret
  serverURL: us.api.konghq.com
EOF
```



The second CRD creates the new Control Plane:

```
cat <<EOF | kubectl apply -f -
kind: KonnectAIGateway
apiVersion: konnect.konghq.com/v1alpha1
metadata:
  name: ai-gateway-1
  namespace: kong
spec:
  apiSpec:
    name: ai-gateway-1
    displayName: Kong AI Gateway 2
    description: AI Gateway Control Plane
  konnect:
    authRef:
      name: konnect-api-auth-conf
EOF
```




## Data Plane

```
cat <<EOF | kubectl apply -f -
apiVersion: aigateway.konghq.com/v1alpha1
kind: AIGatewayDataPlane
metadata:
  name: ai-gateway-1-dp
  namespace: kong
spec:
  controlPlaneRef:
    type: konnectNamespacedRef
    konnectNamespacedRef:
      name: ai-gateway-1
  deployment:
    replicas: 1
    podTemplateSpec:
      spec:
        containers:
          - name: aigw
            image: kong/kong-ai-gateway:2.0
  network:
    services:
      ingress:
        type: LoadBalancer
        ports:
          - name: http
            port: 8000
            targetPort: 8000
EOF
```


Check the Data Plane

```
kubectl get aigatewaydataplane ai-gateway-1-dp -n kong \
  -o=jsonpath='{.status.conditions[?(@.type=="Ready")]}' | jq
```


```
kubectl describe pod $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("ai-gateway-1-dp"))' | jq -r '.name') -n kong
```

```
kubectl logs -f $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("ai-gateway-1-dp"))' | jq -r '.name') -n kong
```




## Consume the Data Plane

```
export DATA_PLANE_LB=$(kubectl get svc -n kong ai-gateway-1-dp-ingress --output=jsonpath='{.status.loadBalancer.ingress[].ip}'):$(kubectl get svc -n kong ai-gateway-1-dp-ingress --output=jsonpath='{.spec.ports[?(@.name=="http")].port}')
```

Send a request
```
curl -i http://$DATA_PLANE_LB
```

You should get a response like this:

```
HTTP/1.1 404 Not Found
Date: Sun, 30 Aug 2026 21:44:48 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Content-Length: 103
X-Kong-Response-Latency: 0
Server: kong/2.0.2-ai-gateway
X-Kong-Request-Id: 2a05717da318e834560c161b1fb67e31

{
  "message":"no Route matched with those values",
  "request_id":"2a05717da318e834560c161b1fb67e31"
}
```



## Delete CP/DP
```
kubectl delete aigatewaydataplane ai-gateway-1-dp -n kong

kubectl delete konnectaigateway ai-gateway-1 -n kong
kubectl delete konnectapiauthconfiguration konnect-api-auth-conf -n kong

kubectl delete secret konnect-api-auth-secret -n kong
kubectl delete namespace kong
```

