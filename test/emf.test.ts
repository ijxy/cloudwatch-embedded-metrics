import assert from "node:assert";
import test from "node:test";

import Ajv from "ajv";

import { StorageResolution, Unit, createMetricGenerator, emf } from "../src";

import { schema } from "./fixtures/emf-json-schema";

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
  ajv.compile(schema);
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
    timestamp: now,
    metricTargets: {
      met: 10,
    },
    dimensionTargets: {
      dim1: "foo",
      dim2: "bar",
    },
  });

  assert.deepStrictEqual(event, generated);
});
