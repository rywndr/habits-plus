import { HeaderFilter } from './header-filters'
import { WeekPicker } from './week-picker'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function WeekReferenceFilters({ value, onChange }: Props) {
  return (
    <>
      <HeaderFilter label="Minggu">
        <WeekPicker value={value} onChange={onChange} />
      </HeaderFilter>
    </>
  )
}
