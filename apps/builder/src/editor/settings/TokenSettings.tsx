import { useMemo, useState, type ReactNode } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import {
	TOKEN_PREFIXES,
	TOKEN_TYPES,
	isThemeColorRef,
	tokenNameIssue,
	tokenValueIssue,
	type DesignToken,
	type TokenIssue,
	type TokenType,
} from '@ui-system/core'
import { hexToOklch, oklchToHex, resolveVars } from '@ui-system/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toOklchString } from '@/editor/theme/parseColor'
import { useSiteThemeVars } from '@/editor/style/useSiteThemeVars'
import { COLOR_TOKENS, normalizeHex } from '@/editor/style/values'
import { t } from '@/i18n'
import { useDocument } from '@/store/document'
import {
	addToken,
	deleteToken,
	renameToken,
	setTokenValue,
	tokenUsage,
	type TokenUsage,
} from '@/store/tokenActions'

const DEFAULTS: Record<TokenType, string> = {
	color: 'var(--color-primary)',
	spacing: '6rem',
	radius: '1rem',
	'font-size': '1.25rem',
	container: '48rem',
}

// A typical utility for each type, shown as a usage hint
const EXAMPLE_PREFIX: Record<TokenType, string> = {
	color: 'bg',
	spacing: 'py',
	radius: 'rounded',
	'font-size': 'text',
	container: 'max-w',
}

const typeLabel = (type: TokenType) => t(`tokens.types.${type}`)

const issueText = (issue: TokenIssue) => t(`tokens.issues.${issue}`)

const example = (token: Pick<DesignToken, 'type' | 'name'>) => {
	const prefix = EXAMPLE_PREFIX[token.type]
	return `${TOKEN_PREFIXES[token.type].includes(prefix) ? prefix : TOKEN_PREFIXES[token.type][0]}-${token.name}`
}

// Hex for the native picker, whatever the stored color is
const pickerHex = (value: string, themeVars: Record<string, string>) => {
	const css = resolveVars(value, themeVars)
	return (
		normalizeHex(css) ??
		(css.startsWith('oklch') ? oklchToHex(css) : '#000000')
	)
}

interface ValueProps {
	value: string
	onChange: (value: string) => void
	label: string
}

// A theme color, or any color the theme parser accepts
function ColorValue({ value, onChange, label }: ValueProps) {
	const themeVars = useSiteThemeVars()
	const [invalid, setInvalid] = useState(false)
	const ref = isThemeColorRef(value)
		? value.trim().slice('var(--color-'.length, -1)
		: ''
	const commit = (text: string) => {
		const clean = text.trim()
		if (clean === value) return setInvalid(false)
		const color = normalizeHex(clean) ?? toOklchString(clean)
		setInvalid(!color)
		if (color) onChange(color)
	}
	return (
		<div className='flex min-w-0 flex-wrap items-center gap-1.5'>
			<label
				className='border-border relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border'
				style={{ background: resolveVars(value, themeVars) }}
			>
				<input
					type='color'
					aria-label={t('tokens.pick', { name: label })}
					className='absolute inset-0 size-full cursor-pointer opacity-0'
					value={pickerHex(value, themeVars)}
					onChange={(e) => {
						setInvalid(false)
						onChange(e.target.value)
					}}
				/>
			</label>
			<select
				aria-label={t('tokens.themeColorOf', { name: label })}
				value={ref}
				className='border-input bg-background h-7 rounded-md border px-1 text-xs'
				onChange={(e) => {
					setInvalid(false)
					onChange(
						e.target.value
							? `var(--color-${e.target.value})`
							: hexToOklch(pickerHex(value, themeVars))
					)
				}}
			>
				<option value=''>{t('tokens.ownColor')}</option>
				{COLOR_TOKENS.map((name) => (
					<option key={name} value={name}>
						{name}
					</option>
				))}
			</select>
			{!ref && (
				<Input
					key={value}
					aria-label={t('tokens.valueOf', { name: label })}
					aria-invalid={invalid || undefined}
					defaultValue={value}
					className='h-7 w-44 font-mono text-xs'
					onChange={() => invalid && setInvalid(false)}
					onBlur={(e) => commit(e.target.value)}
					onKeyDown={(e) =>
						e.key === 'Enter' && commit(e.currentTarget.value)
					}
				/>
			)}
		</div>
	)
}

// Small preview of a length token
function Sample({ type, value }: { type: TokenType; value: string }) {
	if (type === 'font-size') {
		return (
			<span
				className='truncate leading-none'
				style={{ fontSize: `min(${value}, 2.5rem)` }}
			>
				Aa
			</span>
		)
	}
	if (type === 'radius') {
		return (
			<span
				className='size-7 shrink-0 border-2 border-primary bg-primary/10'
				style={{ borderRadius: value }}
			/>
		)
	}
	return (
		<span className='bg-muted flex h-3 w-24 shrink-0 overflow-hidden rounded-sm'>
			<span
				className='h-full bg-primary'
				style={{ width: `min(${value}, 100%)` }}
			/>
		</span>
	)
}

function LengthValue({
	type,
	value,
	onChange,
	label,
}: ValueProps & { type: TokenType }) {
	const [invalid, setInvalid] = useState(false)
	const commit = (text: string) => {
		const clean = text.trim()
		if (clean === value) return setInvalid(false)
		const bad = tokenValueIssue(type, clean)
		setInvalid(bad !== null)
		if (!bad) onChange(clean)
	}
	return (
		<div className='flex min-w-0 items-center gap-2'>
			<Input
				key={value}
				aria-label={t('tokens.valueOf', { name: label })}
				aria-invalid={invalid || undefined}
				defaultValue={value}
				className='h-7 w-28 font-mono text-xs'
				onChange={() => invalid && setInvalid(false)}
				onBlur={(e) => commit(e.target.value)}
				onKeyDown={(e) =>
					e.key === 'Enter' && commit(e.currentTarget.value)
				}
			/>
			<Sample type={type} value={value} />
		</div>
	)
}

function ValueEditor({ type, ...props }: ValueProps & { type: TokenType }) {
	return type === 'color' ? (
		<ColorValue {...props} />
	) : (
		<LengthValue type={type} {...props} />
	)
}

function usageText(usage: TokenUsage) {
	return [
		...usage.pages.map((p) => t('tokens.inPage', { name: p.name })),
		...usage.partials.map((name) => t(`tokens.in.${name}`)),
		...usage.components.map((c) =>
			t('tokens.inComponent', { name: c.name })
		),
	].join('\n')
}

function TokenRow({ token, usage }: { token: DesignToken; usage: TokenUsage }) {
	const [error, setError] = useState<TokenIssue | null>(null)
	const rename = (name: string) => {
		const clean = name.trim()
		if (clean === token.name) return setError(null)
		setError(renameToken(token.name, clean))
	}
	const remove = () => {
		if (usage.total > 0) {
			const message = t('tokens.confirmDelete', {
				name: token.name,
				count: usage.total,
				places: usageText(usage),
			})
			if (!window.confirm(message)) return
		}
		deleteToken(token.name)
	}
	return (
		<li
			data-token={token.name}
			className='border-border flex flex-col gap-1 rounded-lg border p-2'
		>
			<div className='flex flex-wrap items-center gap-2'>
				<span className='text-muted-foreground w-24 shrink-0 text-xs'>
					{typeLabel(token.type)}
				</span>
				<Input
					key={token.name}
					aria-label={t('tokens.nameOf', { name: token.name })}
					aria-invalid={error ? true : undefined}
					defaultValue={token.name}
					className='h-7 w-36 font-mono text-xs'
					onChange={() => error && setError(null)}
					onBlur={(e) => rename(e.target.value)}
					onKeyDown={(e) =>
						e.key === 'Enter' && rename(e.currentTarget.value)
					}
				/>
				<ValueEditor
					type={token.type}
					value={token.value}
					label={token.name}
					onChange={(value) => setTokenValue(token.name, value)}
				/>
				<Button
					variant='ghost'
					size='icon-sm'
					className='ms-auto'
					aria-label={t('tokens.delete', { name: token.name })}
					onClick={remove}
				>
					<Trash2Icon />
				</Button>
			</div>
			<div className='text-muted-foreground flex flex-wrap gap-x-3 text-[11px]'>
				<code className='font-mono'>{example(token)}</code>
				<span>
					{usage.total > 0
						? t('tokens.used', { count: usage.total })
						: t('tokens.unused')}
				</span>
				{error && (
					<span role='alert' className='text-destructive'>
						{issueText(error)}
					</span>
				)}
			</div>
		</li>
	)
}

function AddToken({ tokens }: { tokens: DesignToken[] }) {
	const [type, setType] = useState<TokenType>('color')
	const [name, setName] = useState('')
	const [value, setValue] = useState(DEFAULTS.color)
	const issue: TokenIssue | null = name
		? (tokenNameIssue(name) ??
			(tokens.some((x) => x.name === name) ? 'duplicate' : null))
		: null
	const add = () => {
		if (!name || issue) return
		if (addToken({ name, type, value }) === null) setName('')
	}
	return (
		<div className='flex flex-col gap-1'>
			<div className='flex flex-wrap items-center gap-2'>
				<select
					aria-label={t('tokens.type')}
					value={type}
					className='border-input bg-background h-7 w-24 rounded-md border px-1 text-xs'
					onChange={(e) => {
						const next = e.target.value as TokenType
						setType(next)
						setValue(DEFAULTS[next])
					}}
				>
					{TOKEN_TYPES.map((x) => (
						<option key={x} value={x}>
							{typeLabel(x)}
						</option>
					))}
				</select>
				<Input
					aria-label={t('tokens.name')}
					aria-invalid={issue ? true : undefined}
					placeholder={t('tokens.namePlaceholder')}
					value={name}
					className='h-7 w-36 font-mono text-xs'
					onChange={(e) => setName(e.target.value.trim())}
					onKeyDown={(e) => e.key === 'Enter' && add()}
				/>
				<ValueEditor
					type={type}
					value={value}
					label={name || t('tokens.new')}
					onChange={setValue}
				/>
				<Button size='sm' disabled={!name || !!issue} onClick={add}>
					<PlusIcon /> {t('common.add')}
				</Button>
			</div>
			{issue && (
				<span role='alert' className='text-destructive text-[11px]'>
					{issueText(issue)}
				</span>
			)}
		</div>
	)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className='flex flex-col gap-3'>
			<h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
				{title}
			</h3>
			{children}
		</section>
	)
}

export function TokenSettings() {
	const doc = useDocument((s) => s.doc)
	const tokens = doc?.site.tokens
	const usages = useMemo(
		() =>
			new Map(
				doc
					? (tokens ?? []).map((x) => [x.name, tokenUsage(doc, x)])
					: []
			),
		[doc, tokens]
	)
	if (!doc) return null
	const list = tokens ?? []
	return (
		<div className='flex flex-col gap-6 p-1 pe-3'>
			<p className='text-muted-foreground text-sm'>{t('tokens.hint')}</p>
			<Section title={t('tokens.add')}>
				<AddToken tokens={list} />
			</Section>
			<Section title={t('tokens.list')}>
				{list.length === 0 ? (
					<p className='text-muted-foreground text-sm'>
						{t('tokens.empty')}
					</p>
				) : (
					<ul className='flex flex-col gap-2'>
						{list.map((token) => (
							<TokenRow
								key={token.name}
								token={token}
								usage={usages.get(token.name)!}
							/>
						))}
					</ul>
				)}
			</Section>
		</div>
	)
}
