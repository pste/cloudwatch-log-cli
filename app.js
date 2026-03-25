#!/usr/bin/env node
import { Command } from 'commander'
import { createClient } from './src/libs/aws.js'
import { listGroups } from './src/commands/groups.js'
import { listStreams } from './src/commands/streams.js'
import { filterLogs, tailLogs } from './src/commands/logs.js'
import pkg from './package.json' with { type: 'json' }

const program = new Command()

// help
program
  .name('cwlogs')
  .description('AWS CloudWatch Logs CLI')
  .version(pkg.version)
  .helpOption(false)
  .option('--region <region>', 'AWS region')
  .option('--profile <profile>', 'AWS credentials profile')
  .option('--cacerts <path to ca cert>', 'Optional CA to pass to the client')

// cwlogs groups [--prefix /aws/lambda]
program
  .command('groups')
  .description('List log groups')
  .option('--prefix <prefix>', 'Filter by name prefix')
  .action(async (opts) => {
    const client = createClient(program.opts())
    await listGroups(client, opts).catch(exit)
  })

// cwlogs streams <logGroup> [--prefix foo] [--limit 20]
program
  .command('streams <logGroup>')
  .description('List log streams in a group')
  .option('--prefix <prefix>', 'Filter by stream name prefix')
  .option('--limit <n>', 'Max streams to show')
  .action(async (logGroup, opts) => {
    const client = createClient(program.opts())
    await listStreams(client, logGroup, opts).catch(exit)
  })

// cwlogs logs <logGroup> [--filter "ERROR"] [--start 2024-01-01] [--end ...] [--streams s1,s2] [--limit 100]
program
  .command('logs <logGroup>')
  .description('Filter log events')
  .option('--filter <pattern>', 'CloudWatch filter pattern')
  .option('--start <time>', 'Start time (ISO date or epoch ms)')
  .option('--end <time>', 'End time (ISO date or epoch ms)')
  .option('--streams <names>', 'Comma-separated stream names')
  .option('--limit <n>', 'Max events to fetch')
  .option('--usefield <name>', 'Print only the given JSON field (i.e. --usefield log)')
  .option('--showstream true/false', 'Shows the stream name', false)
  .action(async (logGroup, opts) => {
    const client = createClient(program.opts())
    if (opts.streams) opts.streams = opts.streams.split(',')
    await filterLogs(client, logGroup, opts).catch(exit)
  })

// cwlogs tail <logGroup> <stream> [--interval 3000]
program
  .command('tail <logGroup> <stream>')
  .description('Tail a log stream in real time')
  .option('--interval <ms>', 'Polling interval in ms', 3000)
  .action(async (logGroup, stream, opts) => {
    const client = createClient(program.opts())
    opts.interval = Number(opts.interval)
    await tailLogs(client, logGroup, stream, opts).catch(exit)
  })

program.parse()

function exit(err) {
  console.error('\x1b[31mError:\x1b[0m', err.message ?? err)
  process.exit(1)
}
