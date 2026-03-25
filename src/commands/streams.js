import { DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs'
import chalk from 'chalk'
import dayjs from 'dayjs'

export async function listStreams(client, logGroup, options = {}) {
  const limit = options.limit ? Number(options.limit) : undefined

  const params = {
    logGroupName: logGroup,
    orderBy: 'LastEventTime',
    descending: true,
  }

  if (options.prefix) {
    params.logStreamNamePrefix = options.prefix
    // cannot order by last-event-time if filtered by prefix
    params.orderBy = undefined
  }

  let stopped = false
  process.on('SIGINT', () => { stopped = true })

  let nextToken
  let count = 0

  do {
    if (nextToken) params.nextToken = nextToken

    const response = await client.send(new DescribeLogStreamsCommand(params))

    for (const stream of response.logStreams ?? []) {
      const last = stream.lastEventTimestamp
        ? dayjs(stream.lastEventTimestamp).format('YYYY-MM-DD HH:mm:ss')
        : '-'
      console.log(
        chalk.green(stream.logStreamName) +
        chalk.gray('  last event: ' + last)
      )
      count++
      if (limit && count >= limit) { stopped = true; break }
    }

    nextToken = response.nextToken
  } while (nextToken && !stopped)

  if (count === 0) {
    console.log(chalk.yellow('No streams found.'))
  }
}
