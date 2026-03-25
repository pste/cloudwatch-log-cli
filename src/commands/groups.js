import { DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs'
import chalk from 'chalk'

export async function listGroups(client, options = {}) {
  const params = {}
  if (options.prefix) params.logGroupNamePrefix = options.prefix

  let nextToken
  let count = 0

  do {
    if (nextToken) params.nextToken = nextToken

    const response = await client.send(new DescribeLogGroupsCommand(params))

    for (const group of response.logGroups ?? []) {
      const sizeGB = group.storedBytes
        ? (group.storedBytes / 1e9).toFixed(2) + ' GB'
        : '-'
      console.log(
        chalk.cyan(group.logGroupName) +
        chalk.gray('  ' + sizeGB)
      )
      count++
    }

    nextToken = response.nextToken
  } while (nextToken)

  console.log(chalk.gray(`\n${count} log group(s)`))
}
