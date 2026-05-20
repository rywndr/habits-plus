import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

type SortState<TSortKey extends string> = {
  key: TSortKey
  direction: SortDirection
}

type Sorters<TItem, TSortKey extends string> = Record<
  TSortKey,
  (left: TItem, right: TItem) => number
>

export function useSortableData<TItem, TSortKey extends string>(
  items: Array<TItem>,
  sorters: Sorters<TItem, TSortKey>,
  initialSort?: SortState<TSortKey>,
) {
  const [sort, setSort] = useState<SortState<TSortKey> | undefined>(
    initialSort,
  )

  const sortedItems = useMemo(() => {
    if (!sort) return items

    return items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const result = sorters[sort.key](left.item, right.item)
        const stableResult = result || left.index - right.index
        return sort.direction === 'asc' ? stableResult : -stableResult
      })
      .map(({ item }) => item)
  }, [items, sort, sorters])

  function toggleSort(key: TSortKey) {
    setSort((current) => ({
      key,
      direction:
        current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function getDirection(key: TSortKey) {
    return sort?.key === key ? sort.direction : undefined
  }

  return { getDirection, sort, sortedItems, toggleSort }
}
