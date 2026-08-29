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

```
kubectl -n kong-system rollout status deployment/ko-kong-operator-controller-manager
```


You can check the Operator’s log with:
```
kubectl logs -f $(kubectl get pod -n kong-system -o json | jq -r '.items[].metadata | select(.name | startswith("ko-kong-operator"))' | jq -r '.name') -n kong-system
```

Delete Kong Operator

```
helm uninstall kong-operator -n kong-system
kubectl delete namespace kong-system
```

```
export PAT=<YOUR_PAT>
```

## Control Plane

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
  name: konnect-api-auth
  namespace: kong
spec:
  type: secretRef
  secretRef:
    name: konnect-api-auth-secret
  serverURL: us.api.konghq.com
EOF
```

```
kubectl get konnectapiauthconfiguration konnect-api-auth-conf -n kong -o jsonpath='{.spec.token}'
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
      name: konnect-api-auth
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
        serviceAccountName: kaigateway-podid-sa
  network:
    services:
      ingress:
        #name: proxy-kong-aws
        type: LoadBalancer
        ports:
        - name: https
          port: 8443
          targetPort: 8000
        - name: http
          port: 8000
          targetPort: 8000
        annotations:
          "service.beta.kubernetes.io/aws-load-balancer-type": "nlb"
          "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing"
          "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip"
          service.beta.kubernetes.io/aws-load-balancer-ssl-cert: $CERTIFICATE_ARN
          service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "8443"
          service.beta.kubernetes.io/aws-load-balancer-listen-ports: '[{"HTTP":8000},{"HTTPS":8443}]'
          service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS-1-2-2017-01
          service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "http"
EOF
```





```
kubectl get -n kong dataplane kong-aws-dp \
  -o=jsonpath='{.status.conditions[?(@.type=="Ready")]}' | jq
```


```
kubectl describe pod $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("dataplane-kong-aws"))' | jq -r '.name') -n kong
```

```
kubectl logs -f $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("ai-gateway-1-dp"))' | jq -r '.name') -n kong
```


```
kubectl delete aigatewaydataplane ai-gateway-1-dp -n kong
kubectl delete konnectaigateway ai-gateway-1 -n kong
```






You should get a response like this:

```
curl http://$DATA_PLANE_LB
curl http://kong-dp.kong-demo.com
curl -i https://kong-dp.kong-demo.com
```

```
HTTP/1.1 404 Not Found
Date: Tue, 09 Dec 2025 12:55:42 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
Content-Length: 103
X-Kong-Response-Latency: 0
Server: kong/3.12.0.1-enterprise-edition
X-Kong-Request-Id: 95b09b2a40dc745d59ea6d684f9c4a13

{
  "message":"no Route matched with those values",
  "request_id":"95b09b2a40dc745d59ea6d684f9c4a13"
}
```

Now we can define the Kong Objects necessary to expose and control Bedrock, including Kong Gateway Service, Routes, and Plugins.




## Delete CP/DP
```
kubectl delete aigatewaydataplane ai-gateway-1-dp -n kong
kubectl delete konnectextensions.konnect.konghq.com konnect-config-aws -n kong


kubectl delete konnectaigateway ai-gateway-1 -n kong
kubectl delete konnectapiauthconfiguration konnect-api-auth-conf -n kong

//kubectl delete secret konnect-pat -n kong
kubectl delete namespace kong
```


```
kubectl logs -f $(kubectl get pod -n kong -o json | jq -r '.items[].metadata | select(.name | startswith("dataplane-kong-polyapi"))' | jq -r '.name') -n kong
```


```
http https://kong-dp.kong-demo.com

curl http://kong-dp.kong-demo.com/llm-route \
  -H "Content-Type: application/json" \
  -H "apikey-llm: 12345" \
  -d '{
     "messages": [
       {
         "role": "user",
         "content": "Hello!"
       }
     ]
   }'
```