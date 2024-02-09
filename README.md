[npm]: https://www.npmjs.com/package/cloudwatch-embedded-metrics

[![npm verison](https://img.shields.io/npm/v/cloudwatch-embedded-metrics)][npm]
[![npm bundle size](https://img.shields.io/bundlephobia/min/cloudwatch-embedded-metrics)][npm]
[![npm downloads](https://img.shields.io/npm/dm/cloudwatch-embedded-metrics)][npm]

# CloudWatch Embedded Metrics

CloudWatch embedded metric format (EMF) is an opinionated logging format used CloudWatch to enable automatic creation of CloudWatch Metrics from log events.
This library provides a utility funcion `emf` to create EMF-compliant objects.

For more information about EMF see the [specification](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html).


## Usage

The `emf` utility can be used to create EMF-compliant objects for structured logging.
Note that `emf` is **only** a formatting tool and does not send events to AWS.


### Example: report metrics when adding an item to a shopping cart

Metrics can be published to multiple namespaces and across multiple dimensions.

Additional data can be attached to the EMF event via the `properties` parameter.
This provides a simple way to collocate high-cardinality data with metric data in log events.

```ts
import { emf, Unit } from "cloudwatch-embedded-metrics";

const requestParams = {
  userId: "user-abc123",
  cartId: "cart-012345",
  items: [{ itemId: "item-000123", quanitity: 1 }],
};

const response = {
  duration: 123,
  success: true,
}

const event = emf({
  namespaces: ["ns-perf", "ns-err"],
  dimensions: {
    "ns-perf": [["serviceName", "endpointName"]],
    "ns-err": [["serviceName"], ["serviceName", "endpointName"]],
  },
  dimensionTargets: {
    serviceName: "shopping-cart-service",
    endpointName: "add-items",
  },
  metrics: {
    "ns-perf": [["duration", Unit.Milliseconds]],
    "ns-err": [["errors", Unit.Count]],
  },
  metricTargets: {
    duration: response.duration,
    errors: response.success ? 0 : 1,
  },
  properties: {
    userId: requestParams.userId,
    cartId: requestParams.cartId,
    itemIds: requestParams.items.map(({itemId}) => itemId),
  },
});

console.log(event);
```

In this example:
- a `duration` metric is added to the `ns-perf` namespace and by association to the `["serviceName", "endpointName"]` dimension set
- an `errors` metric is added to the `ns-err` namespace and by association to both the `["serviceName"]` and `["serviceName", "endpointName"]` dimension sets

This event would therefore lead to the creation of 3 new metrics in CloudWatch.

In general, the number of metrics added to a namespace $n$ is given by the number of metrics associated with that namespace $n_M$ multiplied by the number of dimension sets associated with that namespace $n_D$.

The total number of metrics $N$ is the sum over all namespaces.

$$N = \sum_i n_i = \sum_i (n_M)_i (n_D)_i$$


### Example: creating metric generators

You can also create metric generators using the `createMetricGenerator` function. Generators can be constructed once and imported across your application, providing a standard set of utilities to generate metrics with the correct dimensions and namespaces.

```ts
// metric-generator.ts

import { createMetricGenerator, Unit } from "cloudwatch-embedded-metrics";

export const generator = createMetricGenerator({
  namespaces: ["ns"],
  dimensions: { ns: [["dim"]] },
  metrics: { ns: [["met", Unit.Bits]] },
});


// some-other-file.ts

import { generator } from "./path/to/metric-generator";

const event = generator({
  dimensionTargets: { dim: "hello" },
  metricTargets: { met: 10 },
});

console.log(event);
```