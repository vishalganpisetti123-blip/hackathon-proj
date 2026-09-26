# API

## `GET /health`

Returns service status and the active `deterministic-baseline` engine.

## `GET /api/v1/examples`

Returns the five reviewed demo inputs.

## `POST /api/v1/analyze`

Request fields:

- `text`: required visible string, 1–1000 characters
- `include_response`: optional boolean, default `false`

Responses:

- `200`: `AnalysisResponse` schema documented in the generated `/docs`
- `422`: validation failed
- `500`: safe pipeline failure message

The schema is versioned with `schema_version: "1.0"`.
