---
title : "Konnect Advanced Analytics"
weight : 211
---

**Konnect Advanced Analytics** is a real-time, highly contextual analytics platform that provides deep insights into API health, performance, and usage. It helps businesses optimize their API strategies and improve operational efficiency. This feature is offered as a premium service within Konnect.

Key benefits:

* Centralized visibility: Gain insights across all APIs, Services, and data planes.
* Contextual API analytics: Analyze API requests, Routes, Consumers, and Services.
* Democratized data insights: Generate reports based on your needs.
* Fast time to insight: Retrieve critical API metrics in less than a second.
* Reduced cost of ownership: A turn-key analytics solution without third-party dependencies.

### Enabling data ingestion

Manage data ingestion from any Control Plane Dashboard using the **Advanced Analytics** toggle. This toggle lets you enable or disable data collection for your API traffic per control plane.

{{< figure src="/static/images/advanced_analytics_toggle.png" alt="advanced_analytics_toggle" width="600" >}}

Modes:

* **On**: Both basic and advanced analytics data is collected, allowing in-depth insights and reporting.
* **Off**: Advanced analytics collection stops, but basic API metrics remain available in Gateway Manager, and can still be used for custom reports.


### Explorer Interface

The Explorer interface displays API usage data gathered by Konnect Analytics from your Data Plane nodes. You can use this tool to:

* Diagnose performance issues
* Monitor LLM token consumption and costs
* Capture essential usage metrics

![explorer](/static/images/explorer.png)


The Analytics Explorer also lets you save the output as a custom report.

![add_report](/static/images/add_report.png)


Check the [**Advanced Analytics Explorer documentation**](https://developer.konghq.com/advanced-analytics/explorer/) to learn more.

### Dashboards

The **Summary Dashboard** shows performance and health statistics of all your APIs across your organization on a single page and provides insights into your Service usage.

![summary_dashboard](/static/images/summary_dashboard.png)


### Custom Dasboards

Advanced Analytics includes the ability to build organization-specific views with Custom Dashboards. You can create them from scratch or use existing templates. The functionality is powered by a robust [API](https://developer.konghq.com/api/konnect/analytics-dashboards/), and [Terraform integration](https://developer.konghq.com/how-to/automate-dashboard-terraform/).


##### Create a dashboard
You can create custom dashboards either from scratch or from a template. In this tutorial, we’ll use a template.

To create a custom dashboard, do the following:

1. In Konnect, navigate to **Dashboards** in the sidebar.
2. From the **Create dashboard** dropdown menu, select “Create from template”.
3. Click **Quick summary dashboard**.
4. Click **Use template**.
This creates a new template with pre-configured tiles.

![custom_dashboard](/static/images/custom_dashboard.png)

##### Add a filter

Filters help you narrow down the data shown in charts without modifying individual tiles.

For this example, let’s add a filter so that the data shown in the dashboard is scoped to only one control plane:

1. From the dashboard, click **Add filter**. This brings up the configuration options.
2. Select “Control plane” from the **Filter** by dropdown menu.
3. Select “In” from the **Operator** dropdown menu.
4. Select “kong-workshop from the **Filter value** dropdown menu.
5. Select the **Make this a preset for all viewers** checkbox.
6. Click Apply.

This applies the filter to the dashboard. Anyone that views this dashboard will be viewing it scoped to the filter you created.

Check the [**Advanced Analytics Custom Dashboards documentation**](https://developer.konghq.com/custom-dashboards/) to learn more.



### Requests

The **Requests** options shows all requests that have been processed by the Data Planes. For example, here's the requests processed by the Data Planes created for the ``kong-workshop`` Control Plane.

![requests](/static/images/requests.png)


