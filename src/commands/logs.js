import {
  FilterLogEventsCommand,
  GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs'
import chalk from 'chalk'
import dayjs from 'dayjs'

function parseTime(value) {
  if (!value) return undefined
  if (/^\d+$/.test(value)) return Number(value)
  const parsed = dayjs(value)
  if (!parsed.isValid()) throw new Error(`Invalid time format: ${value}`)
  return parsed.valueOf()
}

function formatEvent(event, options) {
  const ts = dayjs(event.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
  const stream = options.showStream && event.logStreamName
    ? chalk.gray('[' + event.logStreamName + '] ')
    : ''
  let message = event.message?.trimEnd() ?? ''
  if (options.usefield) {
    try {
      const jsonmsg = JSON.parse(message)
      if (options.usefield in jsonmsg) {
        message = jsonmsg[options.usefield]
      }
    }
    catch (err) {
      // log error ?
    }
  }

  return chalk.gray(ts) + '  ' + stream + message
}

export async function filterLogs(client, logGroup, options = {}) {
  const params = {
    logGroupName: logGroup,
    interleaved: true,
  }

  if (options.streams?.length) params.logStreamNames = options.streams
  if (options.filter) params.filterPattern = options.filter
  if (options.start) params.startTime = parseTime(options.start)
  if (options.end) params.endTime = parseTime(options.end)
  if (options.limit) params.limit = Number(options.limit)

  let nextToken
  let count = 0

  do {
    if (nextToken) params.nextToken = nextToken

    const response = await client.send(new FilterLogEventsCommand(params))

    for (const event of response.events ?? []) {
      console.log(formatEvent(event, { showStream: options.showstream, usefield: options.usefield }))
      count++
    }

    nextToken = response.nextToken

    // stop after limit if set
    if (options.limit && count >= Number(options.limit)) break
  } while (nextToken)

  if (count === 0) {
    console.log(chalk.yellow('No events found.'))
  }
}

export async function tailLogs(client, logGroup, stream, options = {}) {
  const params = {
    logGroupName: logGroup,
    logStreamName: stream,
    startFromHead: false,
    limit: 20,
  }

  if (options.start) params.startTime = parseTime(options.start)

  console.log(chalk.gray(`Tailing ${logGroup} / ${stream} — Ctrl+C to stop\n`))

  let lastToken
  let lastTs = Date.now() - 60_000

  const poll = async () => {
    params.nextToken = lastToken
    if (!lastToken) params.startTime = lastTs

    const response = await client.send(new GetLogEventsCommand(params))

    for (const event of response.events ?? []) {
      console.log(formatEvent(event, {}))
      lastTs = event.timestamp + 1
    }

    lastToken = response.nextForwardToken
  }

  await poll()
  const interval = setInterval(poll, options.interval ?? 3000)

  process.on('SIGINT', () => {
    clearInterval(interval)
    console.log(chalk.gray('\nStopped.'))
    process.exit(0)
  })
}
