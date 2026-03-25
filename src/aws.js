import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs'

export function createClient(options = {}) {
  const config = {}

  if (options.region) config.region = options.region
  if (options.profile) {
    process.env.AWS_PROFILE = options.profile
  }

  return new CloudWatchLogsClient(config)
}
