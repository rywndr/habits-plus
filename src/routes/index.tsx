import { Button } from '#/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <p>Button so pog</p>
      <Button>I am so pog</Button>
    </div>
  )
}
