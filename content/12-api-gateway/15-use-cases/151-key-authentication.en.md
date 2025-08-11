---
title : "API Key Authentication"
weight : 151
---

To get started with API Authentication, let's implement a basic Key Authentication mechanism. API Keys are one of the foundamental security mechanisms provided by Konnect. In order to consume an API, the consumer should inject a previously created API Key in the header of the request. The API consumption is allowed if the Gateway recognizes the API Key. Consumers add their API key either in a query string parameter, a header, or a request body to authenticate their requests and consume the application.

A Kong Consumer represents a consumer (user or application) of a Service. A Kong Consumer is tightly coupled to an Authentication mechanism the Kong Gateway provides.

![kong_consumer](/static/images/kong_consumer.png)

Please, check the [**Key-Auth** plugin](https://docs.konghq.com/hub/kong-inc/key-auth/) plugin and [**Kong Consumer**](https://docs.konghq.com/gateway/latest/key-concepts/consumers/) documentation pages to learn more about them.



### Enable the Key Authentication Plugin on the Kong Route

{{<highlight>}}
cat > key-auth.yaml << 'EOF'
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
  - name: httpbin-route
    paths:
    - /key-auth-route
  plugins:
  - name: key-auth
    instance_name: key-auth1
EOF
{{</highlight>}}

{{<highlight>}}
deck gateway sync --konnect-token $PAT key-auth.yaml
{{</highlight>}}



#### Consume the Route

Now, if you try the Route, you'll get a specific **401** error code meaning that, since you don't have any API Key injected in your request, you are not allowd to consume it.

{{<highlight>}}
curl -i $DATA_PLANE_LB/key-auth-route/get
{{</highlight>}}

```
HTTP/1.1 401 Unauthorized
Date: Mon, 11 Aug 2025 14:44:59 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
WWW-Authenticate: Key
Content-Length: 96
X-Kong-Response-Latency: 2
Server: kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 1f8a6c1c9d0d1853d9db426588c1ce1c

{
  "message":"No API key found in request",
  "request_id":"1f8a6c1c9d0d1853d9db426588c1ce1c"
}
```


#### Create a Kong Consumer

In order to consume the Route we need to create a Kong Consumer. Here's its declaration:

{{<highlight>}}
cat > key-auth.yaml << 'EOF'
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
  - name: httpbin-route
    paths:
    - /key-auth-route
  plugins:
  - name: key-auth
    instance_name: key-auth1
consumers:
- keyauth_credentials:
  - key: "123456"
  username: consumer1
EOF
{{</highlight>}}


Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT key-auth.yaml
{{</highlight>}}



#### Consume the Route with the API Key

Now, you need to inject the Key you've just created, as a header, in your requests. Using HTTPie, you can do it easily like this:

{{<highlight>}}
curl --head $DATA_PLANE_LB/key-auth-route/get -H 'apikey:123456'
{{</highlight>}}

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 551
Connection: keep-alive
Server: gunicorn
Date: Mon, 11 Aug 2025 14:45:52 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 9
X-Kong-Proxy-Latency: 4
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: b535885591f5ec7f7fb5f070fa365465
```

Of course, if you inject a wrong key, you get a specific error like this:
```
# curl --head $DATA_PLANE_LB/key-auth-route/get -H 'apikey:12'
HTTP/1.1 401 Unauthorized
Date: Mon, 11 Aug 2025 14:46:36 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
WWW-Authenticate: Key
Content-Length: 81
X-Kong-Response-Latency: 1
Server: kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 688e271ea4cae5794bc1cb59ea3ec131
```


**NOTE**

* The header has to have the API Key name, which is, in our case, ``apikey``. That was the default name provided by Konnect when you enabled the **Key Authentication** on the Kong Route. You can change the plugin configuration, if you will.


### Kong Consumer Policies

With the API Key policy in place, we can control the incoming requests. However, the policies implemented by the other plugins are the same regardless the consumer.

It's important then to be able to define specific policies for each one of these consumers. For example, it would be great to define Rate Limiting policies for different consumers like this:

* consumer1:
    * apikey = 123456
    * rate limiting policy = 5 rpm
* consumer2:
    * apikey = 987654
    * rate limiting policy = 8 rpm

Doing that, the Data Plane is capable to not just protect the Route but to identify the consumer based on the key injected to enforce specific policies to the consumer.

For this section we're implementing a Rate Limiting policy. Keep in mind that a Consumer might have other plugins also enabled such as [Request Transformer](https://docs.konghq.com/hub/kong-inc/request-transformer/), [TCP Log](https://docs.konghq.com/hub/kong-inc/tcp-log/), etc.


#### New Consumer

Create the second ``consumer2``, just like you did with the first one, with the ``987654`` key.

{{<highlight>}}
cat > key-auth.yaml << 'EOF'
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
  - name: httpbin-route
    paths:
    - /key-auth-route
  plugins:
  - name: key-auth
    instance_name: key-auth1
consumers:
- keyauth_credentials:
  - key: "123456"
  username: consumer1
- keyauth_credentials:
  - key: "987654"
  username: consumer2
EOF
{{</highlight>}}

Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT key-auth.yaml
{{</highlight>}}



If you will, you can inject both keys to your requests.

{{<highlight>}}
curl --head $DATA_PLANE_LB/key-auth-route/get -H 'apikey:123456'
{{</highlight>}}

or

{{<highlight>}}
curl --head $DATA_PLANE_LB/key-auth-route/get -H 'apikey:987654'
{{</highlight>}}


#### Consumers' Policy

Now let's enhance the plugins declaration enabling the Rate Limiting plugin to each one of our consumers.

{{<highlight>}}
cat > key-auth.yaml << 'EOF'
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
  - name: httpbin-route
    paths:
    - /key-auth-route
  plugins:
  - name: key-auth
    instance_name: key-auth1
consumers:
- keyauth_credentials:
  - key: "123456"
  username: consumer1
  plugins:
  - name: rate-limiting
    instance_name: rate-limiting1
    config:
      minute: 5
- keyauth_credentials:
  - key: "987654"
  username: consumer2
  plugins:
  - name: rate-limiting
    instance_name: rate-limiting2
    config:
      minute: 8
EOF
{{</highlight>}}


Submit the declaration
{{<highlight>}}
deck gateway sync --konnect-token $PAT key-auth.yaml
{{</highlight>}}



#### Consumer the Route using different API Keys.

First of all let's consume the Route with the Consumer1's API Key:

{{<highlight>}}
curl --head $DATA_PLANE_LB/key-auth-route/get -H 'apikey:123456'
{{</highlight>}}

**Expected Output**

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 551
Connection: keep-alive
X-RateLimit-Limit-Minute: 5
X-RateLimit-Remaining-Minute: 4
RateLimit-Reset: 11
RateLimit-Remaining: 4
RateLimit-Limit: 5
Server: gunicorn
Date: Mon, 11 Aug 2025 14:47:49 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 3
X-Kong-Proxy-Latency: 2
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: ad38e60e76c57d5826f3c37fdce4925c
```

Now, let's consume it with the Consumer2's API Key. As you can see the Data Plane is processing the Rate Limiting processes independently.

{{<highlight>}}
curl --head $DATA_PLANE_LB/key-auth-route/get -H 'apikey:987654'
{{</highlight>}}

**Expected Output**

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 551
Connection: keep-alive
X-RateLimit-Limit-Minute: 8
X-RateLimit-Remaining-Minute: 7
RateLimit-Reset: 27
RateLimit-Remaining: 7
RateLimit-Limit: 8
Server: gunicorn
Date: Mon, 11 Aug 2025 14:49:33 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 2
X-Kong-Proxy-Latency: 3
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 9cf1fb53db3a9b740d9bd42e9091d245
```

If we keep sending requests using the first API Key, eventually, as expected, we'll get an error code:


{{<highlight>}}
curl --head $DATA_PLANE_LB/key-auth-route/get -H 'apikey:123456'
{{</highlight>}}


**Expected Output**

```
HTTP/1.1 429 Too Many Requests
Date: Mon, 11 Aug 2025 14:50:21 GMT
Content-Type: application/json; charset=utf-8
Connection: keep-alive
X-RateLimit-Limit-Minute: 5
X-RateLimit-Remaining-Minute: 0
RateLimit-Reset: 39
Retry-After: 39
RateLimit-Remaining: 0
RateLimit-Limit: 5
Content-Length: 92
X-Kong-Response-Latency: 1
Server: kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: 38afd254e246a946a65153780606be3c
```

However, the second API Key is still allowed to consume the Kong Route:

{{<highlight>}}
curl --head $DATA_PLANE_LB/key-auth-route/get -H 'apikey:987654'
{{</highlight>}}

**Expected Output**

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 551
Connection: keep-alive
X-RateLimit-Limit-Minute: 8
X-RateLimit-Remaining-Minute: 7
RateLimit-Reset: 34
RateLimit-Remaining: 7
RateLimit-Limit: 8
Server: gunicorn
Date: Mon, 11 Aug 2025 14:50:26 GMT
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Kong-Upstream-Latency: 1
X-Kong-Proxy-Latency: 2
Via: 1.1 kong/3.11.0.2-enterprise-edition
X-Kong-Request-Id: f8602e2e2778f306fba41f1661ef554c
```

Kong-gratulations! have now reached the end of this module by authenticating the API requests with a key and associating different consumers with policy plans. You can now click **Next** to proceed with the next module.

### Optional Reading

Applying Kong Plugins on Services, Routes or Globally helps us to implement an extensive list of policies in the API Gateway layer. However, so far, we are not controlling who is sending the requests to the Data Plane. That is, anyone who has the Runtime Instance ELB address is capable to send requests to it and consumer the Services.

API Gateway Authentication is an important way to control the data that is allowed to be transmitted using your APIs. Basically, it checks that a particular consumer has permission to access the API, using a predefined set of credentials.

Kong Gateway has a library of plugins that provide simple ways to implement the best known and most widely used methods of API gateway authentication. Here are some of the commonly used ones:

* Basic Authentication
* Key Authentication
* OAuth 2.0 Authentication
* LDAP Authentication
* OpenID Connect

Kong Plugin Hub provides documentation about all [Authentication](https://docs.konghq.com/hub/#authentication) based plugins. Refer to the following link to read more about [API Gateway Authentication](https://konghq.com/learning-center/api-gateway/api-gateway-authentication)
