---
title : "Import an OpenAPI specification - optional"
weight : 123
---


For our first Kong Service, we are going to import an OpenAPI spec (OAS) to our Control Plane. The Control Plane will convert the spec into Kong Service and Kong Routes.

* Download the [bankong.yaml](/code/bankong.yaml) spec.
* In your Control Plane, click on **Import via OAS spec**.
* Choose the ``bankong.yaml`` spec and click **Continue**.
* Review the Import Summary and click Import
* Notice the Services and Routes that will be imported
* Notice declarative representation of this import as well (more on this later)


You should see your new Kong Service and Routes:

![bankong](/static/images/bankong-service-route.png)


### Test the API Deployment

```
curl -i $DATA_PLANE_LB/transactions
```

You should get a response from the API. Notice the ``x-kong-*`` headers like ``request id``, ``proxy latency``, ``upstream latency``. Run the request again, what do you notice about the proxy latency now?
 

```
HTTP/2 200 
content-type: application/json; charset=utf-8
content-length: 517
x-kong-request-id: 79d76d16883197392033bd590536481b
x-powered-by: Express
vary: Origin, Accept-Encoding
access-control-allow-credentials: true
cache-control: no-cache
pragma: no-cache
expires: -1
x-content-type-options: nosniff
etag: W/"205-u4o2XSHOR6oYVCAyD/5BTbm6Xgk"
date: Tue, 23 Sep 2025 11:58:13 GMT
server: kong/3.11.0.1-enterprise-edition
x-kong-upstream-latency: 39
x-kong-proxy-latency: 1
via: 1.1 kong/3.11.0.1-enterprise-edition, 1.1 kong/3.11.0.0-enterprise-edition

[
  {
    "source": "DE8412325587359375895",
    "senderName": "Max Mustermann",
    "destination": "GR872659435350353",
    "amount": 10.2,
    "currency": "EUR",
    "subject": "The money we have talked about",
    "id": "b88f7029-fa93-41a5-9462-4884e544bf63"
  },
  {
    "source": "UK8412325587359375895",
    "senderName": "Mister Smith",
    "destination": "GR872559435350353",
    "amount": 10000,
    "currency": "EUR",
    "subject": "Invoice #34078ja",
    "id": "143aadce-f995-4503-ba6e-01ed01c6af88"
  }
]
```