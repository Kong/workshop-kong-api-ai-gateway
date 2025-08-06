---
title : "Request Callout Plugin"
weight : 154
---

The [Request Callout](https://developer.konghq.com/plugins/request-callout/) plugin allows you to insert arbitrary API calls before proxying a request to the upstream service.

In this section, you will configure the Request Callout plugin on the Kong Route. Specifically, you will configure Kong Konnect to add a new header "demo: injected-by-kong" before responding to the client.


#### Create the Request Callout Plugin

Take the plugins declaration and enable the **Request Callout** plugin to the Route.

{{<highlight>}}
cat > request-callout.yaml << 'EOF'
_format_version: "3.0"
_konnect:
  control_plane_name: kong-workshop
_info:
  select_tags:
  - httpbin-service-route
services:
- name: httpbin-service
  host: httpbin.kong.svc.cluster.local
  port: 8000
  routes:
  - name: request-callout-route
    paths:
    - /request-callout-route
    plugins:
      - name: request-callout
        instance_name: request-callout1
        config:
          callouts:
          - name: wikipedia
            request:
              url: en.wikipedia.org/w/api.php
              method: GET
              forward: false
              query:
                - srsearch:theorem
                - action:query
                - list:search
                - format:json
            response:
              body:
                decode: true
          upstream:
            by_lua: kong.response.exit(200, { uuid = kong.ctx.shared.callouts.c1.response.body.uuid,
              origin = kong.ctx.shared.callouts.c2.response.body.url})
EOF
{{</highlight>}}


{{<highlight>}}
:::code{showCopyAction=true showLineNumbers=false language=shell}
deck gateway sync --konnect-token $PAT request-callout.yaml
{{</highlight>}}


### Verify
Test to make sure Kong transforms the request to the echo server and httpbin server. 

{{<highlight>}}
curl --head $DATA_PLANE_LB/request-callout-route/get
{{</highlight>}}

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