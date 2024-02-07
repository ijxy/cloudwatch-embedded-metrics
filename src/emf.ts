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

export type MetricDirective<
  N extends string,
  D extends string,
  M extends string,
> = {
  Namespace: N;
  Dimensions: Array<DimensionSet<D>>;
  Metrics: Array<MetricDefinition<M>>;
};

export type DimensionSet<D extends string> = Array<D>;

export type MetricDefinition<M extends string> = {
  Name: M;
  Unit?: Unit;
  StorageResolution?: StorageResolution;
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
  /**
   * Namespaces to create metrics in
   */
  namespaces: Array<N>;

  /**
   * Defines the dimension-sets for each namespace
   */
  dimensions: Record<N, Array<DimensionSet<D>>>;

  /**
   * The values for all dimensions
   */
  dimensionTargets: DimensionTargets<D>;

  /**
   * The metrics to added to the dimension-sets for each namespace
   */
  metrics: Record<N, Array<MetricDefinitionInput<M>>>;

  /**
   * The values for all metrics
   */
  metricTargets: MetricTargets<M>;

  /**
   * Additional properties to add to the event
   */
  properties?: Record<string, unknown>;

  /**
   * An optional override for the timestamp
   */
  timestamp?: Date;
};

export function emf<N extends string, D extends string, M extends string>({
  namespaces,
  dimensions,
  dimensionTargets,
  metrics,
  metricTargets,
  properties,
  timestamp,
}: EmbeddedMetricFormatterInput<N, D, M>): EmbeddedMetricFormatEvent<N, D, M> {
  return {
    ...properties,
    ...dimensionTargets,
    ...metricTargets,
    _aws: {
      Timestamp: timestamp?.getTime() ?? Date.now(),
      CloudWatchMetrics: namespaces.map<MetricDirective<N, D, M>>((ns) => ({
        Namespace: ns,
        Dimensions: dimensions[ns],
        Metrics: metrics[ns].map<MetricDefinition<M>>(([n, u, s]) => ({
          Name: n,
          Unit: u,
          StorageResolution: s,
        })),
      })),
    },
  };
}

export type CreateMetricGeneratorInput<
  N extends string,
  D extends string,
  M extends string,
> = Pick<
  EmbeddedMetricFormatterInput<N, D, M>,
  "namespaces" | "dimensions" | "metrics" | "properties"
>;

export type MetricGeneratorInput<
  N extends string,
  D extends string,
  M extends string,
> = Pick<
  EmbeddedMetricFormatterInput<N, D, M>,
  "dimensionTargets" | "metricTargets" | "properties" | "timestamp"
>;

export type MetricGenerator<
  N extends string,
  D extends string,
  M extends string,
> = (
  input: MetricGeneratorInput<N, D, M>,
) => EmbeddedMetricFormatEvent<N, D, M>;

export function createMetricGenerator<
  N extends string,
  D extends string,
  M extends string,
>({
  namespaces,
  dimensions,
  metrics,
  properties: defaultProperties,
}: CreateMetricGeneratorInput<N, D, M>): MetricGenerator<N, D, M> {
  return ({ dimensionTargets, metricTargets, properties, timestamp }) => {
    return emf({
      namespaces,
      dimensions,
      metrics,
      dimensionTargets,
      metricTargets,
      properties: { ...defaultProperties, ...properties },
      timestamp,
    });
  };
}
