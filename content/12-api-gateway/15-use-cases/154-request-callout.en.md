---
title : "Request Callout"
weight : 154
---

The [Request Callout](https://developer.konghq.com/plugins/request-callout/) plugin allows you to insert arbitrary API calls before proxying a request to the upstream service.

In this section, you will configure the Request Callout plugin on the Kong Route. Specifically, you will configure the plugin to do the following:
* Call the ``dummyjson.com`` service using the “user id” as a parameter.
* The email of the user is returned and is added as a new header to the request.
* The request is sent to httpbin application which echoes the number of hits.

#### Hit dummyjson Service
Just to get an idea of the ``dummyjson`` response, send the following request:

{{<highlight>}}
curl -s "https://dummyjson.com/users/1" | jq -r '.email'
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
    host: httpbin.konghq.com
    port: 80
    routes:
      - name: request-callout-route
        paths:
          - /request-callout-route
        plugins:
          - name: request-callout
            instance_name: request-callout1
            config:
              callouts:
                - name: dummyjson
                  request:
                    url: https://dummyjson.com/users/1
                    method: GET
                    headers:
                      forward: false
                      custom:
                        User-Agent: kong-request-callout-demo
                    by_lua: |
                      local user_id = kong.request.get_header("X-User-ID")
                      if not user_id then
                        kong.log.err("Missing X-User-ID header")
                        return
                      end
                      kong.ctx.shared.callouts.dummyjson.request.params.url =
                        "https://dummyjson.com/users/" .. tostring(user_id)
                  response:
                    body:
                      decode: true
                    by_lua: |
                      local c = kong.ctx.shared.callouts.dummyjson
                      if not c or not c.response or not c.response.body then
                        kong.log.err("callout dummyjson failed or empty response")
                        return
                      end
                      local email = c.response.body.email
                      if email then
                        kong.service.request.add_header("user-email", tostring(email))
                      else
                        kong.log.err("email not found in dummyjson response")
                      end
EOF
{{</highlight>}}


Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT request-callout.yaml
{{</highlight>}}


### Verify
Send the request to Kong and check the response

{{<highlight>}}
curl -s "$DATA_PLANE_LB/request-callout-route/get" -H 'X-User-ID: 1' | jq '.headers["User-Email"]'
{{</highlight>}}

or

{{<highlight>}}
curl -s "$DATA_PLANE_LB/request-callout-route/get" -H 'X-User-ID: 2'
{{</highlight>}}


**Expected Results**: Notice that new User-Email header is injected.
{{<highlight>}}
{
  "args": {}, 
  "headers": {
    "Accept": "*/*", 
    "Connection": "keep-alive", 
    "Content-Length": "0", 
    "Host": "httpbin.konghq.com", 
    "User-Agent": "curl/8.7.1", 
    "User-Email": "michael.williams@x.dummyjson.com", 
    "X-Forwarded-Host": "7aadd278a4.serverless.gateways.konggateway.com", 
    "X-Forwarded-Path": "/request-callout-route/get", 
    "X-Forwarded-Prefix": "/request-callout-route", 
    "X-Kong-Request-Id": "2fe945127f5b5b67f169be1ab8c4e848", 
    "X-User-Id": "2"
  }, 
  "origin": "167.60.7.166", 
  "url": "https://7aadd278a4.serverless.gateways.konggateway.com/get"
}
{{</highlight>}}





#### Cleanup

Reset the Control Plane to ensure that the plugins do not interfere with any other modules in the workshop for demo purposes and each workshop module code continues to function independently.

{{<highlight>}}
deck gateway reset --konnect-control-plane-name kong-workshop --konnect-token $PAT -f
{{</highlight>}}

In real world scenario, you can enable as many plugins as you like depending on your use cases.

Kong-gratulations! have now reached the end of this module. You can now click **Next** to proceed with the next module.