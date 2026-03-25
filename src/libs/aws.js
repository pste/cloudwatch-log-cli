import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { Agent } from 'https'
import { readFileSync } from 'fs'

export function createClient(options = {}) {
  const config = {}

  if (options.region) {
    config.region = options.region
  }

  if (options.profile) {
    process.env.AWS_PROFILE = options.profile
  }

  if (options.cacerts) {
    const certs = [readFileSync(options.cacerts)]
    const agent = new Agent({
      rejectUnauthorized: true,
      ca: certs,
    })

    config.requestHandler = new NodeHttpHandler({
      httpAgent: agent,
      httpsAgent: agent,
    })
  }

  return new CloudWatchLogsClient(config)
}
