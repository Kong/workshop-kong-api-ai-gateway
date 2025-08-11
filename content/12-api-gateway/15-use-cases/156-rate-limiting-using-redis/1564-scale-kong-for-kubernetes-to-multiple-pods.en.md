---
title : "Scale Kong for Kubernetes to multiple pods"
weight : 1564
---


Let's scale out the Kong Data Plane deployment to 3 pods, for scalability and redundancy:

{{<highlight>}}
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
         image: kong/kong-gateway:3.11
   replicas: 3
 network:
   services:
     ingress:
       name: proxy1
       type: LoadBalancer
EOF
{{</highlight>}}




#### Wait for replicas to deploy
It will take a couple minutes for the new pods to start up. Run the following command to show that the replicas are ready.

{{<highlight>}}
kubectl get pods -n kong
{{</highlight>}}

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

{{<highlight>}}
curl -I $DATA_PLANE_LB/rate-limiting-route/get
{{</highlight>}}

**Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 389
Connection: keep-alive
X-RateLimit-Remaining-Minute: 4
RateLimit-Limit: 5
X-RateLimit-Limit-Minute: 5
RateLimit-Remaining: 4
RateLimit-Reset: 57
Server: gunicorn
Date: Mon, 11 Aug 2025 15:12:03 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 9
X-Kong-Proxy-Latency: 8
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 278fcb4ae01a6e7fcc88ed701adaf942
```

#### Results
You will observe that the rate-limit is not consistent anymore and you can make more than 5 requests in a minute.

To understand this behavior, we need to understand how we have configured Kong. In the current policy, each Kong node is tracking a rate-limit in-memory and it will allow 5 requests to go through for a client. There is no synchronization of the rate-limit information across Kong nodes. In use-cases where rate-limiting is used as a protection mechanism and to avoid over-loading your services, each Kong node tracking it's own counter for requests is good enough as a malicious user will hit rate-limits on all nodes eventually. Or if the load-balance in-front of Kong is performing some sort of deterministic hashing of requests such that the same Kong node always receives the requests from a client, then we won't have this problem at all.

#### Whats Next ?
In some cases, a synchronization of information that each Kong node maintains in-memory is needed. For that purpose, Redis can be used. Let's go ahead and set this up next.
