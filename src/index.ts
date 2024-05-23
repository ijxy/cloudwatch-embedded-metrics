export type EmbeddedMetricFormatEvent<
  N extends string,
  D extends string,
  M extends string,
> = DimensionTargets<D> & MetricTargets<M> & Metadata<N, D, M>;

export type DimensionTargets<D extends string> = Record<D, string>;

export type MetricTargets<M extends string> = Record<M, Array<number> | number>;

export type Metadata<N extends string, D extends string, M extends string> = {
  _aws: {
    CloudWatchMetrics: Array<MetricDirective<N, D, M>>;
    Timestamp: number;
  };
};

export type MetricDirective<N extends string, D extends string, M extends string> = {
  Namespace: N;
  Dimensions: Array<DimensionSet<D>>;
  Metrics: Array<MetricDefinition<M>>;
};

export type DimensionSet<D extends string> = Array<D>;

export type MetricDefinition<M extends string> = {
  Name: M;
  Unit: Unit | undefined;
  StorageResolution: StorageResolution | undefined;
};

export type MetricDefinitionInput<M extends string> = [
  name: M,
  unit?: Unit,
  storageResolution?: StorageResolution,
];

export enum Unit {
  Bits = "Bits",
  BitsPerSecond = "Bits/Second",
  Bytes = "Bytes",
  BytesPerSecond = "Bytes/Second",
  Count = "Count",
  CountPerSecond = "Count/Second",
  Gigabits = "Gigabits",
  GigabitsPerSecond = "Gigabits/Second",
  Gigabytes = "Gigabytes",
  GigabytesPerSecond = "Gigabytes/Second",
  Kilobits = "Kilobits",
  KilobitsPerSecond = "Kilobits/Second",
  Kilobytes = "Kilobytes",
  KilobytesPerSecond = "Kilobytes/Second",
  Megabits = "Megabits",
  MegabitsPerSecond = "Megabits/Second",
  Megabytes = "Megabytes",
  MegabytesPerSecond = "Megabytes/Second",
  Microseconds = "Microseconds",
  Milliseconds = "Milliseconds",
  None = "None",
  Percent = "Percent",
  Seconds = "Seconds",
  Terabits = "Terabits",
  TerabitsPerSecond = "Terabits/Second",
  Terabytes = "Terabytes",
  TerabytesPerSecond = "Terabytes/Second",
}

export enum StorageResolution {
  /**
   * Standard resolution, CloudWatch stores at 1-minute resolution
   */
  Standard = 60,

  /**
   * High resolution, CloudWatch stores the metric with sub-minute resolution down to one second
   */
  High = 1,
}

export type EmbeddedMetricFormatterInput<
  N extends string = string,
  D extends string = string,
  M extends string = string,
> = {
  namespaces: Array<N>;
  metrics: Record<N, Array<MetricDefinitionInput<M>>>;
  dimensions: Record<N, Array<DimensionSet<D>>>;
  metricTargets: MetricTargets<M>;
  dimensionTargets: DimensionTargets<D>;
  timestamp?: Date;
  properties?: Record<string, unknown>;
};

export function emf<N extends string, D extends string, M extends string>({
  namespaces,
  metrics,
  dimensions,
  metricTargets,
  dimensionTargets,
  timestamp,
  properties,
}: EmbeddedMetricFormatterInput<N, D, M>): EmbeddedMetricFormatEvent<N, D, M> {
  return {
    ...properties,
    ...dimensionTargets,
    ...metricTargets,
    _aws: {
      Timestamp: timestamp?.getTime() ?? Date.now(),
      CloudWatchMetrics: namespaces.map((namespace) => ({
        Namespace: namespace,
        Dimensions: dimensions[namespace],
        Metrics: metrics[namespace].map((metric) => ({
          Name: metric[0],
          Unit: metric[1],
          StorageResolution: metric[2],
        })),
      })),
    },
  };
}

export type CreateMetricGeneratorInput<N extends string, D extends string, M extends string> = Pick<
  EmbeddedMetricFormatterInput<N, D, M>,
  "namespaces" | "metrics" | "dimensions" | "properties"
>;

export type MetricGeneratorInput<N extends string, D extends string, M extends string> = Pick<
  EmbeddedMetricFormatterInput<N, D, M>,
  "metricTargets" | "dimensionTargets" | "timestamp" | "properties"
>;

export type MetricGenerator<N extends string, D extends string, M extends string> = (
  input: MetricGeneratorInput<N, D, M>,
) => EmbeddedMetricFormatEvent<N, D, M>;

export function createMetricGenerator<N extends string, D extends string, M extends string>({
  namespaces,
  metrics,
  dimensions,
  properties: defaultProperties,
}: CreateMetricGeneratorInput<N, D, M>): MetricGenerator<N, D, M> {
  return ({ dimensionTargets, metricTargets, properties, timestamp }) => {
    return emf({
      namespaces,
      metrics,
      dimensions,
      metricTargets,
      dimensionTargets,
      timestamp,
      properties: { ...defaultProperties, ...properties },
    });
  };
}
