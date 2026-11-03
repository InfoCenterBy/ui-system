// Dev launcher: pick an app, run its processes without cmd.exe wrappers so one Ctrl+C stops everything
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Entry file of a package binary as installed for an app
const bin = (app, pkg, name = pkg) => {
	const require = createRequire(join(root, 'apps', app, 'package.json'))
	const manifest = require.resolve(`${pkg}/package.json`)
	const field = require(manifest).bin
	return join(
		dirname(manifest),
		typeof field === 'string' ? field : field[name]
	)
}

const APPS = {
	catalog: {
		title: 'UI kit (catalog)',
		processes: () => [
			{
				name: 'catalog',
				cwd: 'apps/catalog',
				args: [bin('catalog', 'vite')],
			},
		],
	},
	builder: {
		title: 'Site builder',
		processes: () => [
			{ name: 'ui', cwd: 'apps/builder', args: [bin('builder', 'vite')] },
			{
				name: 'api',
				cwd: 'apps/builder',
				args: [bin('builder', 'tsx'), 'watch', 'server/index.ts'],
			},
		],
	},
}

const COLORS = [36, 35, 33, 32]
const paint = (code, text) =>
	process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text

const choose = () =>
	new Promise((resolve) => {
		const keys = Object.keys(APPS)
		let index = 0
		const lines = keys.length + 3
		const draw = (first) => {
			if (!first) process.stdout.write(`\x1b[${lines}A`)
			process.stdout.write('\x1b[J')
			console.log(paint(1, 'What to run?'))
			keys.forEach((key, i) => {
				const label = `${i + 1}. ${APPS[key].title}`
				console.log(
					i === index ? paint(36, `› ${label}`) : `  ${label}`
				)
			})
			console.log('')
			console.log(
				paint(2, '↑/↓ or number, Enter to start, Ctrl+C to quit')
			)
		}
		const finish = (key) => {
			process.stdin.setRawMode(false)
			process.stdin.pause()
			process.stdin.off('keypress', onKey)
			resolve(key)
		}
		const onKey = (text, key = {}) => {
			if (key.ctrl && key.name === 'c') return finish(null)
			if (key.name === 'escape' || key.name === 'q') return finish(null)
			if (key.name === 'up')
				index = (index + keys.length - 1) % keys.length
			else if (key.name === 'down') index = (index + 1) % keys.length
			else if (key.name === 'return') return finish(keys[index])
			else if (/^[1-9]$/.test(text ?? '') && keys[Number(text) - 1])
				return finish(keys[Number(text) - 1])
			else return
			draw(false)
		}
		readline.emitKeypressEvents(process.stdin)
		process.stdin.setRawMode(true)
		process.stdin.resume()
		process.stdin.on('keypress', onKey)
		draw(true)
	})

// Every output line gets the process name when several run side by side
const pipeLines = (stream, target, prefix) => {
	readline
		.createInterface({ input: stream })
		.on('line', (line) => target.write(`${prefix}${line}\n`))
}

const killTree = (child) => {
	if (child.exitCode !== null || child.signalCode !== null) return
	if (process.platform === 'win32')
		spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
			stdio: 'ignore',
		})
	else child.kill('SIGTERM')
}

const run = (key) => {
	const list = APPS[key].processes()
	const single = list.length === 1
	const children = list.map((p, i) => {
		const child = spawn(process.execPath, p.args, {
			cwd: join(root, p.cwd),
			env:
				process.env.NO_COLOR || process.env.FORCE_COLOR
					? process.env
					: { ...process.env, FORCE_COLOR: '1' },
			// A lone process keeps the terminal, so Vite shortcuts still work
			stdio: single ? 'inherit' : ['ignore', 'pipe', 'pipe'],
		})
		if (!single) {
			const prefix = paint(COLORS[i % COLORS.length], `[${p.name}] `)
			pipeLines(child.stdout, process.stdout, prefix)
			pipeLines(child.stderr, process.stderr, prefix)
		}
		return child
	})

	let stopping = false
	let code = 0
	const stop = (exitCode = 0) => {
		if (stopping) return
		stopping = true
		code = exitCode
		// The console already sent Ctrl+C to every child, give them a moment to close
		const timer = setTimeout(() => children.forEach(killTree), 2000)
		timer.unref()
	}
	process.on('SIGINT', () => stop(0))
	process.on('SIGTERM', () => stop(0))
	process.on('SIGHUP', () => stop(0))

	let left = children.length
	for (const child of children) {
		child.on('exit', (exitCode) => {
			left--
			// One process failing takes the others down
			if (!stopping) {
				stop(exitCode ?? 1)
				children.forEach(killTree)
			}
			if (left === 0) process.exit(code)
		})
	}
}

const arg = process.argv[2]
if (arg && !APPS[arg]) {
	console.error(
		`Unknown app "${arg}", use one of: ${Object.keys(APPS).join(', ')}`
	)
	process.exit(1)
}
const key = arg ?? (process.stdin.isTTY ? await choose() : 'catalog')
if (key) run(key)
