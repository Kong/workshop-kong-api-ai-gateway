---
title : "Response-Transformer Plugin"
weight : 153
---

The [Response-Transformer](https://docs.konghq.com/hub/kong-inc/response-transformer/) plugin modifies the upstream response (e.g. response from the server) before returning it to the client.

In this section, you will configure the Response-Transformer plugin on the Kong Route. Specifically, you will configure Kong Konnect to add a new header "demo: injected-by-kong" before responding to the client.


#### Create the Response Transformer Plugin

Take the plugins declaration and enable the **Response Transformer** plugin to the Route.

:::code{showCopyAction=true showLineNumbers=false language=shell}
cat > response-transformer.yaml << 'EOF'
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
  - name: response-transformer-route
    paths:
    - /response-transformer-route
    plugins:
    - name: response-transformer
      instance_name: response-transformer1
      config:
        add:
          headers:
          - demo:injected-by-kong
EOF
:::


Submit the declaration
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway sync --konnect-token $PAT response-transformer.yaml
:::


### Verify
Test to make sure Kong transforms the request to the echo server and httpbin server. 

:::code{showCopyAction=true showLineNumbers=false language=shell}
curl --head $DATA_PLANE_LB/response-transformer-route/get
:::

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 469
Connection: keep-alive
Server: gunicorn
Date: Wed, 28 May 2025 12:24:14 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
demo: injected-by-kong
X-Kong-Upstream-Latency: 2
X-Kong-Proxy-Latency: 1
Via: 1.1 kong/3.10.0.1-enterprise-edition
X-Kong-Request-Id: a08fac3ca8cc994a3d90bd70ece7745a
```


**Expected Results** Notice that ``demo: injected-by-kong`` is injected in the header.


#### Cleanup

Reset the Control Plane to ensure that the plugins do not interfere with any other modules in the workshop for demo purposes and each workshop module code continues to function independently.

:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway reset --konnect-control-plane-name kong-aws --konnect-token $PAT -f
:::

In real world scenario, you can enable as many plugins as you like depending on your use cases.

Kong-gratulations! have now reached the end of this module by configuring the Kong Route to include ``demo: injected-by-kong`` before responding to the client. You can now click **Next** to proceed with the next module.