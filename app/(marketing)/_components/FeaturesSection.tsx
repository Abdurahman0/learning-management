import { BookOpenText, HeartHandshake, Sparkles, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

import { Container } from './Container'

const features = [
	{
		title: 'Authentic Interface',
		description:
			'Mirror the real IELTS computer-delivered exam layout under strict timing to reduce surprise on the exam day.',
		icon: BookOpenText,
	},
	{
		title: 'Personal instructor',
		description:
			'Get AI-powered insights, targeted exercises, and curated learning materials designed to improve YOUR specific performance gaps.',
		icon: Target,
	},
	{
		title: 'Immediate results',
		description:
			'Receive fast, structured feedback with full explanations right after completion for faster improvement.',
		icon: Sparkles,
	},
	{
		title: '1-to-1 Expert Support',
		description:
			'Schedule one-to-one lessons with a real IELTS expert. Receive clear explanations, targeted advice, and help focused on your weak areas.',
		icon: HeartHandshake,
	},
] as const

export function FeaturesSection() {
	return (
		<section id='features' className='scroll-mt-24 bg-muted/30 py-16 sm:py-20'>
			<Container>
				<div className='mx-auto max-w-3xl text-center'>
					<Badge
						variant='secondary'
						className='mb-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700'
					>
						Platform Features
					</Badge>
					<h2 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
						Features
					</h2>
					<p className='mt-3 text-muted-foreground sm:text-lg'>
						Built for authentic IELTS Reading and Listening preparation with
						exam-focused workflows.
					</p>
				</div>

				<div className='mt-10 grid gap-6 md:grid-cols-2'>
					{features.map(feature => (
						<Card
							key={feature.title}
							className='border-border bg-card py-0 shadow-sm hover:scale-105 transition duration-300'
						>
							<CardContent className='p-6 sm:p-7'>
								<div className='mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700'>
									<feature.icon className='size-5' aria-hidden='true' />
								</div>
								<h3 className='text-xl font-semibold text-foreground'>
									{feature.title}
								</h3>
								<p className='mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base'>
									{feature.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>

				<Card className='mt-6 border-dashed border-border bg-muted/30 py-0 shadow-sm'>
					<CardContent className='flex flex-col items-start gap-2 p-5 sm:flex-row sm:items-center sm:justify-between'>
						<p className='text-sm text-muted-foreground sm:text-base'>
							Writing and Speaking modules are planned next to complete full
							IELTS coverage.
						</p>
						<Badge
							variant='outline'
							className='rounded-full border-border bg-muted text-muted-foreground'
						>
							Coming soon
						</Badge>
					</CardContent>
				</Card>
			</Container>
		</section>
	)
}
