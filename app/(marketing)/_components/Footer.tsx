import Link from 'next/link'

import { Container } from './Container'

const FOOTER_LINKS = [
	{ href: '#', label: 'Privacy Policy' },
	{ href: '#', label: 'Terms of Service' },
	{ href: '#', label: 'Contact Us' },
	{ href: '#', label: 'Help Center' },
] as const

export function Footer() {
	return (
		<footer className='pb-6'>
			<Container>
				<div className='flex mt-6 flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground lg:flex-row lg:text-left'>
					<p className='font-semibold tracking-tight text-foreground'>
						IELTS MASTER
					</p>

					<nav
						aria-label='Footer'
						className='flex flex-wrap items-center justify-center gap-4 lg:gap-6'
					>
						{FOOTER_LINKS.map(item => (
							<Link
								key={item.label}
								href={item.href}
								className='transition-colors hover:text-foreground'
							>
								{item.label}
							</Link>
						))}
					</nav>

					<p>&copy; 2026 IELTS Master Practice. All rights reserved.</p>
				</div>
			</Container>
		</footer>
	)
}
