# cwlogs

A lightweight CLI to query and tail AWS CloudWatch Logs from your terminal.

## Requirements

- Node.js 24+
- AWS credentials configured (env vars, `~/.aws/credentials`, or IAM role)

## Installation

```bash
npm install
npm link   # optional, makes `cwlogs` available globally
```

Or, without install:  
```bash
node app.js --help
```

## Usage

All commands accept global options:

| Option | Description |
|---|---|
| `--region <region>` | AWS region (defaults to `AWS_DEFAULT_REGION`) |
| `--profile <profile>` | AWS credentials profile |
| `--cacerts <path to ca cert>` | Optional CA to pass to the client |

---

If installed you can run `cwlogs <params>` as a binary file.  
Otherwise you can use standard node CLI as in:  
`npm run cli -- --region eu-west-1 groups`
Or, for a more exhaustive (and realistic) example:  
```bash
alias cwlogs='node app.js --profile default --cacerts private/company-ca-cert.crt'
cwlogs groups | grep eks
```

### `groups` — List log groups

```bash
cwlogs groups [--prefix <prefix>]
```

| Option | Description |
|---|---|
| `--prefix` | Filter groups by name prefix |

```bash
cwlogs groups
cwlogs groups --prefix /aws/lambda
```

---

### `streams` — List log streams

```bash
cwlogs streams <logGroup> [--prefix <prefix>] [--limit <n>]
```

Streams are sorted by last event time, most recent first.

```bash
cwlogs streams /aws/lambda/my-function
cwlogs streams /aws/lambda/my-function --limit 10
```

---

### `logs` — Filter log events

```bash
cwlogs logs <logGroup> [options]
```

| Option | Description |
|---|---|
| `--filter <pattern>` | [CloudWatch filter pattern](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html) |
| `--start <time>` | Start time — ISO date (`2026-03-24`) or epoch ms |
| `--end <time>` | End time — ISO date or epoch ms |
| `--streams <names>` | Comma-separated stream names to search in |
| `--limit <n>` | Maximum number of events to fetch |

```bash
cwlogs logs /aws/lambda/my-function --filter "ERROR"
cwlogs logs /aws/lambda/my-function --start 2026-03-24 --end 2026-03-25 --limit 500
cwlogs logs /aws/lambda/my-function --streams stream1,stream2 --filter "timeout" --short
```

---

### `tail` — Tail a stream in real time

```bash
cwlogs tail <logGroup> <stream> [--interval <ms>]
```

Polls the stream and prints new events as they arrive. Press `Ctrl+C` to stop.

| Option | Description |
|---|---|
| `--interval <ms>` | Polling interval in milliseconds (default: `3000`) |

```bash
cwlogs tail /aws/lambda/my-function '2026/03/25/[$LATEST]abc123'
cwlogs tail /aws/lambda/my-function '2026/03/25/[$LATEST]abc123' --interval 1000
```

---

## Examples

```bash
# Use a specific profile and region
cwlogs --profile staging --region eu-west-1 groups

# Find all ERROR logs in the last day
cwlogs logs /aws/lambda/my-function --filter "ERROR" --start 2026-03-24

# Watch a stream update live every 2 seconds
cwlogs tail /aws/lambda/my-function 'my-stream' --interval 2000
```
