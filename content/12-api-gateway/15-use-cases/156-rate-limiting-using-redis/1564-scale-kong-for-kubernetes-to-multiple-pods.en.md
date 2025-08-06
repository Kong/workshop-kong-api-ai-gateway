---
title : "Scale Kong for Kubernetes to multiple pods"
weight : 1564
---


Let's scale out the Kong Data Plane deployment to 3 pods, for scalability and redundancy:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat <<EOF | kubectl apply -f -
apiVersion: gateway-operator.konghq.com/v1beta1
kind: DataPlane
metadata:
 name: dataplane1
 namespace: kong
spec:
 extensions:
 - kind: KonnectExtension
   name: konnect-config1
   group: konnect.konghq.com
 deployment:
   podTemplateSpec:
     spec:
       containers:
       - name: proxy
         image: kong/kong-gateway:3.10.0.1
       serviceAccountName: kaigateway-podid-sa
   replicas: 3
 network:
   services:
     ingress:
       name: proxy1
       type: LoadBalancer
       annotations:
         "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing"
         "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip"
EOF
:::




#### Wait for replicas to deploy
It will take a couple minutes for the new pods to start up. Run the following command to show that the replicas are ready.

:::code{showCopyAction=true showLineNumbers=false language=shell}
kubectl get pods -n kong
:::

```
NAME                                          READY   STATUS    RESTARTS   AGE
dataplane-dataplane1-qdc66-84d7746bbf-dnvp8   1/1     Running   0          4d23h
dataplane-dataplane1-qdc66-84d7746bbf-hlxwx   1/1     Running   0          26s
dataplane-dataplane1-qdc66-84d7746bbf-kpbpl   1/1     Running   0          26s
httpbin-5c69574c95-xq76q                      1/1     Running   0          6d19h
```

### Check Konnect Runtime Group

Similarly you can see new Runtime Instances connected to your Runtime Group

![3-runtime-instances](/static/images/3-runtime-instances.png)



#### Verify traffic control
Test the rate-limiting policy by executing the following command and observing the rate-limit headers.

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -I $DATA_PLANE_LB/rate-limiting-route/get
:::

**Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 455
Connection: keep-alive
RateLimit-Reset: 29
X-RateLimit-Remaining-Minute: 4
X-RateLimit-Limit-Minute: 5
RateLimit-Limit: 5
RateLimit-Remaining: 4
Server: gunicorn
Date: Wed, 28 May 2025 12:35:31 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 1
X-Kong-Proxy-Latency: 6
Via: 1.1 kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: 2373ed35e4fff87e406eb4347e15702f
```

#### Results
You will observe that the rate-limit is not consistent anymore and you can make more than 5 requests in a minute.

To understand this behavior, we need to understand how we have configured Kong. In the current policy, each Kong node is tracking a rate-limit in-memory and it will allow 5 requests to go through for a client. There is no synchronization of the rate-limit information across Kong nodes. In use-cases where rate-limiting is used as a protection mechanism and to avoid over-loading your services, each Kong node tracking it's own counter for requests is good enough as a malicious user will hit rate-limits on all nodes eventually. Or if the load-balance in-front of Kong is performing some sort of deterministic hashing of requests such that the same Kong node always receives the requests from a client, then we won't have this problem at all.

#### Whats Next ?
In some cases, a synchronization of information that each Kong node maintains in-memory is needed. For that purpose, Redis can be used. Let's go ahead and set this up next.
