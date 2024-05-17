[aws-emf-spec]: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
[npm]: https://www.npmjs.com/package/cloudwatch-embedded-metrics

[![npm verison](https://img.shields.io/npm/v/cloudwatch-embedded-metrics)][npm]
[![npm bundle size](https://img.shields.io/bundlephobia/min/cloudwatch-embedded-metrics)][npm]
[![npm downloads](https://img.shields.io/npm/dm/cloudwatch-embedded-metrics)][npm]

# CloudWatch Embedded Metrics

The CloudWatch embedded metric format (EMF) is a JSON [specification][aws-emf-spec] used to instruct CloudWatch Logs to automatically extract metric values embedded in structured log events. 

`cloudwatch-embedded-metrics` provides type-safe utilities to create EMF-compliant objects.

Please consult AWS documentation for information on sending logs to CloudWatch.

## Installation

```
npm install cloudwatch-embedded-metrics
```

## Usage

### Creating events using `emf`

Use the `emf` utility to create events by specifying the desired namespaces, metrics and dimensions and corresponding values.

```ts
import { emf, Unit } from "cloudwatch-embedded-metrics";

function addItemsEvent(request, response) {
  return emf({
    namespaces: ["my-company/services"],
    metrics: {
      "my-company/services": [
        ["duration", Unit.Milliseconds],
        ["errors": Unit.Count],
      ],
    },
    dimensions: {
      "my-company/services": [
        ["environment", "serviceName"],
        ["environment", "serviceName", "endpointName"],
      ],
    },
    metricTargets: {
      duration: response.duration,
      errors: response.ok ? 0 : 1,
    },
    dimensionTargets: {
      environment: "prod",
      serviceName: "shopping-cart-service",
      endpointName: "add-items",
    },
    properties: {
      userId: request.userId,
      cartId: request.cartId,
      items: request.items,
    },
  });
}
```


### Creating events using a `createMetricGenerator`

Generators make it easy to reuse the same configuration (namespaces, metrics and dimensions) for multiple events.

```ts
import { createMetricGenerator, Unit } from "cloudwatch-embedded-metrics";

const generator = createMetricGenerator({
  namespaces: ["my-company/services"],
  metrics: {
    "my-company/services": [
      ["duration", Unit.Milliseconds],
      ["errors": Unit.Count],
    ],
  },
  dimensions: {
    "my-company/services": [
      ["environment", "serviceName"],
      ["environment", "serviceName", "endpointName"],
    ],
  },
});

function addItemsEvent(request, response) {
  return generator({
    metricTargets: {
      duration: response.duration,
      errors: response.ok ? 0 : 1,
    },
    dimensionTargets: {
      environment: "prod",
      serviceName: "shopping-cart-service",
      endpointName: "add-items",
    },
  });
}

function removeItemsEvent(request, response) {
  return generator({
    metricTargets: {
      duration: response.duration,
      errors: response.ok ? 0 : 1,
    },
    dimensionTargets: {
      environment: "prod",
      serviceName: "shopping-cart-service",
      endpointName: "remove-items",
    },
  });
}
```