import { DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs'
import chalk from 'chalk'
import dayjs from 'dayjs'

export async function listStreams(client, logGroup, options = {}) {
  const params = {
    logGroupName: logGroup,
    orderBy: 'LastEventTime',
    descending: true,
    limit: options.limit,
  }

  if (options.prefix) {
    params.logStreamNamePrefix = options.prefix
    // cannot order by last-event-time if filtered by prefix
    params.orderBy = undefined
  }

  const response = await client.send(new DescribeLogStreamsCommand(params))

  for (const stream of response.logStreams ?? []) {
    const last = stream.lastEventTimestamp
      ? dayjs(stream.lastEventTimestamp).format('YYYY-MM-DD HH:mm:ss')
      : '-'
    console.log(
      chalk.green(stream.logStreamName) +
      chalk.gray('  last event: ' + last)
    )
  }

  if (!response.logStreams?.length) {
    console.log(chalk.yellow('No streams found.'))
  }
}
