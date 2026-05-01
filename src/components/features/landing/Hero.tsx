import { Container } from '@/components/ui/Container'
import { HeroEyebrow } from './HeroEyebrow'
import { HeroSubtitle } from './HeroSubtitle'
import { HeroTitle } from './HeroTitle'
import { ScrollCue } from './ScrollCue'

export function Hero() {
  return (
    <section
      aria-label="hero"
      className="relative flex min-h-[calc(100vh-64px)] items-center justify-center"
    >
      <Container className="flex flex-col items-center">
        <HeroEyebrow />
        <div className="mt-10">
          <HeroTitle />
        </div>
        <HeroSubtitle />
      </Container>
      <ScrollCue />
    </section>
  )
}
