---
title : "Update the Rate Limiting Plugin"
weight : 1565
---


#### Update the Rate Limiting Plugin
Let's update our Kong Plugin configuration to use Redis as a data store rather than each Kong node storing the counter information in-memory. As a reminder, Redis was installed previously and it is available in the EKS cluster.

Here's the new declarion:

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > rate-limiting.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-aws
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  host: httpbin.kong.svc.cluster.local
  port: 8000
  routes:
  - name: rate-limiting-route
    paths:
    - /rate-limiting-route
    plugins:
    - name: rate-limiting
      instance_name: rate-limiting1
      config:
        minute: 5
        policy: redis
        redis:
          host: redis-stack.redis.svc.cluster.local
          port: 6379
EOF
:::





Submit the declaration:

:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway sync --konnect-token $PAT rate-limiting.yaml
:::



#### Test it

Execute the following commands more than 5 times.

What happens?

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl -I $DATA_PLANE_LB/rate-limiting-route/get
:::

**Response**

```
HTTP/1.1 429 Too Many Requests
Date: Wed, 28 May 2025 12:40:06 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-RateLimit-Limit-Minute: 5
X-RateLimit-Remaining-Minute: 0
RateLimit-Reset: 54
Retry-After: 54
RateLimit-Remaining: 0
RateLimit-Limit: 5
Content-Length: 92
X-Kong-Response-Latency: 2
Server: kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: d517af1d0873f14cca18af72d314072c
```

**Expected Results**  Because Redis is the data-store for the rate-limiting plugin, you should be able to make only 5 requests in a minute



#### Reduce the number of replicas

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
   replicas: 1
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



Kong-gratulations! have now reached the end of this section by configuring Redis as a data-store to synchronize information across multiple Kong nodes to enforce the rate-limiting policy.  This can also be used for other plugins which support Redis as a data-store such as proxy-cache. You can now click **Next** to proceed with the next section of the module.
