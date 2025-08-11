---
title : "Request Callout Plugin"
weight : 154
---

The [Request Callout](https://developer.konghq.com/plugins/request-callout/) plugin allows you to insert arbitrary API calls before proxying a request to the upstream service.

In this section, you will configure the Request Callout plugin on the Kong Route. Specifically, you will configure the plugin to do the following:
* Call Wikipedia using the "srseach" header as a parameter.
* The number of hits found and returned by Wikipeadia is added as a new header to the request.
* The request is sent to **httpbin** application which echoes the number of hits.

#### Hit Wikipedia

Just to get an idea what the Wikipedia response, send the following request:

{{<highlight>}}
curl -s "https://en.wikipedia.org/w/api.php?srsearch=Miles%20Davis&action=query&list=search&format=json" | jq '.query.searchinfo.totalhits'
{{</highlight>}}

You should get a number like **43555**, which represents the number of total hits related to **Miles Davis**


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
              url: https://en.wikipedia.org/w/api.php
              method: GET
              query:
                forward: true
              by_lua:
                local srsearch = kong.request.get_header("srsearch");
                local srsearch_encoded = ngx.escape_uri(srsearch)
                query = "srsearch=" .. srsearch_encoded .. "&action=query&list=search&format=json";
                kong.log.inspect(query);
                kong.ctx.shared.callouts.wikipedia.request.params.query = query
            response:
              body:
                decode: true
              by_lua:
                kong.service.request.add_header("wikipedia-total-hits-header", kong.ctx.shared.callouts.wikipedia.response.body.query.searchinfo.totalhits)
EOF
{{</highlight>}}


Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT request-callout.yaml
{{</highlight>}}


### Verify
Send the request to Kong and check the response

{{<highlight>}}
curl -s "http://$DATA_PLANE_LB/request-callout-route/get" -H srsearch:"Miles Davis" | jq
{{</highlight>}}

```
{
  "args": {},
  "headers": {
    "Accept": "*/*",
    "Connection": "keep-alive",
    "Content-Length": "0",
    "Host": "httpbin.kong.svc.cluster.local:8000",
    "Srsearch": "Miles Davis",
    "User-Agent": "curl/8.7.1",
    "Wipikedia-Total-Hits-Header": "43555",
    "X-Forwarded-Host": "127.0.0.1",
    "X-Forwarded-Path": "/request-callout-route/get",
    "X-Forwarded-Prefix": "/request-callout-route",
    "X-Kong-Request-Id": "6e4df528567f446630c6ae5c0b461c2e"
  },
  "origin": "10.244.0.1",
  "url": "http://httpbin.kong.svc.cluster.local:8000/get"
}
```


**Expected Results**
Notice that new ``Wikipedia-Total-Hits-Header`` header is injected.


#### Cleanup

Reset the Control Plane to ensure that the plugins do not interfere with any other modules in the workshop for demo purposes and each workshop module code continues to function independently.

{{<highlight>}}
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
{{</highlight>}}

In real world scenario, you can enable as many plugins as you like depending on your use cases.

Kong-gratulations! have now reached the end of this module. You can now click **Next** to proceed with the next module.