# @natesclaw/diagnostics-prometheus

Official Prometheus diagnostics exporter for Natesclaw.

This plugin exposes Natesclaw Gateway runtime metrics in Prometheus text format for Prometheus, Grafana, VictoriaMetrics, and compatible scrapers.

## Install

```bash
natesclaw plugins install @natesclaw/diagnostics-prometheus
```

Restart the Gateway after installing or updating the plugin.

## Configure

Enable the plugin and set the scrape endpoint options in `plugins.entries.diagnostics-prometheus.config`.

The full config surface, metric names, and scrape examples live in the docs:

- https://docs.natesclaw.ai/gateway/prometheus

## Package

- Plugin id: `diagnostics-prometheus`
- Package: `@natesclaw/diagnostics-prometheus`
- Minimum Natesclaw host: `2026.4.25`
