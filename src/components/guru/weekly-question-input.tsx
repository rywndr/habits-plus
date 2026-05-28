import { Textarea } from '#/components/ui/textarea'

type Props = {
  index: number
  question: string
  code: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function WeeklyQuestionInput({
  index,
  question,
  code,
  value,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-heading text-sm font-medium text-foreground">
        {index}. {question} <span className="font-bold">({code})</span>
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        disabled={disabled}
        className="rounded-2xl bg-card"
      />
    </div>
  )
}
