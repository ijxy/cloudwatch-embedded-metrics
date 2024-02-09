import assert from "node:assert";
import test from "node:test";

import Ajv from "ajv";

import { StorageResolution, Unit, createMetricGenerator, emf } from "../src";

/**
 * CloudWatch EMF JSON Schema (as of 2024-06-02)
 * https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
 */
const schema = {
  type: "object",
  title: "Root Node",
  required: ["_aws"],
  properties: {
    _aws: {
      $id: "#/properties/_aws",
      type: "object",
      title: "Metadata",
      required: ["Timestamp", "CloudWatchMetrics"],
      properties: {
        Timestamp: {
          $id: "#/properties/_aws/properties/Timestamp",
          type: "integer",
          title: "The Timestamp Schema",
          examples: [1565375354953],
        },
        CloudWatchMetrics: {
          $id: "#/properties/_aws/properties/CloudWatchMetrics",
          type: "array",
          title: "MetricDirectives",
          items: {
            $id: "#/properties/_aws/properties/CloudWatchMetrics/items",
            type: "object",
            title: "MetricDirective",
            required: ["Namespace", "Dimensions", "Metrics"],
            properties: {
              Namespace: {
                $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Namespace",
                type: "string",
                title: "CloudWatch Metrics Namespace",
                examples: ["MyApp"],
                pattern: "^(.*)$",
                minLength: 1,
                maxLength: 1024,
              },
              Dimensions: {
                $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Dimensions",
                type: "array",
                title: "The Dimensions Schema",
                minItems: 1,
                items: {
                  $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Dimensions/items",
                  type: "array",
                  title: "DimensionSet",
                  minItems: 0,
                  maxItems: 30,
                  items: {
                    $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Dimensions/items/items",
                    type: "string",
                    title: "DimensionReference",
                    examples: ["Operation"],
                    pattern: "^(.*)$",
                    minLength: 1,
                    maxLength: 250,
                  },
                },
              },
              Metrics: {
                $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Metrics",
                type: "array",
                title: "MetricDefinitions",
                items: {
                  $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Metrics/items",
                  type: "object",
                  title: "MetricDefinition",
                  required: ["Name"],
                  properties: {
                    Name: {
                      $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Metrics/items/properties/Name",
                      type: "string",
                      title: "MetricName",
                      examples: ["ProcessingLatency"],
                      pattern: "^(.*)$",
                      minLength: 1,
                      maxLength: 1024,
                    },
                    Unit: {
                      $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Metrics/items/properties/Unit",
                      type: "string",
                      title: "MetricUnit",
                      examples: ["Milliseconds"],
                      pattern:
                        "^(Seconds|Microseconds|Milliseconds|Bytes|Kilobytes|Megabytes|Gigabytes|Terabytes|Bits|Kilobits|Megabits|Gigabits|Terabits|Percent|Count|Bytes\\/Second|Kilobytes\\/Second|Megabytes\\/Second|Gigabytes\\/Second|Terabytes\\/Second|Bits\\/Second|Kilobits\\/Second|Megabits\\/Second|Gigabits\\/Second|Terabits\\/Second|Count\\/Second|None)$",
                    },
                    StorageResolution: {
                      $id: "#/properties/_aws/properties/CloudWatchMetrics/items/properties/Metrics/items/properties/StorageResolution",
                      type: "integer",
                      title: "StorageResolution",
                      examples: [60],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

test("emf", () => {
  const event = emf({
    namespaces: ["ns1", "ns2", "ns3"],
    metrics: {
      ns1: [["met1"]],
      ns2: [["met2"]],
      ns3: [["met1", Unit.Count, StorageResolution.High], ["met3"]],
    },
    dimensions: {
      ns1: [["dim1"]],
      ns2: [["dim1", "dim2"]],
      ns3: [
        ["dim1", "dim2"],
        ["dim2", "dim3"],
        ["dim1", "dim3"],
      ],
    },
    metricTargets: {
      met1: 10,
      met2: 1,
      met3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    dimensionTargets: {
      dim1: "FOO",
      dim2: "BAR",
      dim3: "BAZ",
    },
    properties: {
      foo: "bar",
    },
  });

  const ajv = new Ajv();
  const valid = ajv.validate(schema, event);
  assert(valid, ajv.errorsText(ajv.errors));
});

test("createMetricGenerator", () => {
  const now = new Date();

  const event = emf({
    namespaces: ["ns"],
    metrics: { ns: [["met", Unit.Bits]] },
    dimensions: { ns: [["dim1", "dim2"]] },
    metricTargets: { met: 10 },
    dimensionTargets: { dim1: "foo", dim2: "bar" },
    timestamp: now,
  });

  const generator = createMetricGenerator({
    namespaces: ["ns"],
    metrics: { ns: [["met", Unit.Bits]] },
    dimensions: { ns: [["dim1", "dim2"]] },
  });

  const generated = generator({
    metricTargets: {
      met: 10,
    },
    dimensionTargets: {
      dim1: "foo",
      dim2: "bar",
    },
    timestamp: now,
  });

  assert.deepStrictEqual(event, generated);
});
