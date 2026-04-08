---
title : "Konnect Debugger"
weight : 212
---

**Konnect Debugger** provides a connected debugging experience and real-time trace-level visibility into API traffic, enabling you to:

* Troubleshoot issues: Investigate and resolve problems during deployments or incidents with targeted, on-demand traces.
* Understand request lifecycle: Visualize exactly what happened during a specific request, including order and duration plugin execution. See Debugger spans for a list of spans captured.
* Improve performance and reliability: Use deep insights to fine-tune configurations and resolve bottlenecks.


### Capture traces and logs
Konnect Debugger allows you to capture traces and logs.

##### Traces
Traces provide a visual representation of the request and response lifecycle, offering a comprehensive overview of Kong’s request processing pipeline.

The debugger helps capture OpenTelemetry-compatible traces for all requests matching the sampling criteria. The detailed spans are captured for the entire request/response lifecycle. These traces can be visualized with Konnect’s built-in span viewer with no additional instrumentation or telemetry tools. For a complete list of available spans and their meanings, see Debugger spans.

##### Key Highlights

* Traces can be generated for a service or per route
* Refined traces can be generated for all requests matching a sampling criteria
* Sampling criteria can be defined with simple expressions language, for example: http.method == GET
* Trace sessions are retained for up to 7 days
* Traces can be visualized in Konnect’s built in trace viewer

To ensure consistency and interoperability, tracing adheres to OpenTelemetry naming conventions for spans and attributes, wherever possible.

##### Logs
For deeper insights, logs can be captured along with traces. When initiating a debug session, administrators can choose to capture logs. Detailed Kong Gateway logs are captured for the duration of the session. These logs are then correlated with traces using trace_id and span_id providing a comprehensive and drill-down view of logs generated during specific trace or span.

##### Reading traces and logs
Traces captured during a debug session can be visualized in debugger’s built-in trace viewer. The trace viewer displays Summary, Spans and Logs view. You can gain instant insights with the summary view while the spans and logs view help you to dive deeper.

##### Summary view
Summary view helps you visualize the entire API request-response flow in a single glance. This view provides a concise overview of critical latency metrics and a transaction map. The lifecycle map includes the different phases of Kong Gateway and the plugins executed by Kong Gateway on both the request and the response along with the times spent in each phase. Use the summary view to quickly understand the end-to-end API flow, identify performance bottlenecks, and optimize your API strategy.

![debugger_summary](/static/images/debugger_summary.png)

##### Spans view
The span view gives you unparalleled visibility into Kong Gateway’s internal workings. This detailed view breaks down into individual spans, providing a comprehensive understanding of:

* Kong Gateway’s internal processes and phases
* Plugin execution and performance
* Request and response handling

For detailed definitions of each span, see Debugger spans. Use the span view to troubleshoot issues, optimize performance, and refine your configuration.

![debugger_spans](/static/images/debugger_spans.png)


#### Logs View
A drill-down view of all the logs generated during specific debug session are shown in the logs tab. All the spans in the trace are correlated using trace_id and span_id. The logs can be filtered on log level and spans. Logs are displayed in reverse chronological order. Konnect encrypts all the logs that are ingested. You can further ensure complete privacy and control by using customer-managed encryption keys (CMEK). Use the logs view to quickly troubleshoot and pinpoint issues.

![debugger_logs](/static/images/debugger_logs.png)



##### Data Security with Customer-Managed Encryption Keys (CMEK)
By default, logs are automatically encrypted using encryption keys that are owned and managed by Konnect. However if you have a specific compliance and regulatory requirements related to the keys that protect your data, you can use the customer-managed encryption keys. This ensures that sensitive data are secured for each organization with their own key and nobody, including Konnect, has access to that data. For more information about how to create and manage CMEK keys, see Customer-Managed Encryption Keys (CMEK).

### Start your first debug session
To begin using the Debugger, ensure the following requirements are met:

* Your data plane nodes are running Kong Gateway version 3.9.1 or later.
* Logs require Kong Gateway version 3.11.0 or later.
* Your Konnect data planes are hosted using self-managed hybrid, Dedicated Cloud Gateways, or serverless gateways. Kong Ingress Controller or Kong Native Event Proxy Gateways aren’t currently supported.

1. In Gateway Manager, select the control plane that contains the data plane to be traced.
2. In the left navigation menu, click Debugger.
3. Click New session.
4. Define the sampling criteria and click Start Session.

Once the session starts, traces will be captured for requests that match the rule. Click a trace to view it in the span viewer.

Each session can be configured to run for a time between 10 seconds and 30 minutes. Sessions are retained for up to 7 days.

For details on defining sampling rules, see Debugger sessions.

##### Sampling rules
Sampling rules help you capture only relevant traffic. Requests that match the defined criteria are included in the session. There are two types:

* Basic sampling rules: Filter by Route or Service.
* Advanced sampling rules: Use expressions for fine-grained filtering.





