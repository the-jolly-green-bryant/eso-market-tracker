const DAY_IN_MILLISECONDS = 86_400_000
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const normalizeDay = (value: string) => {
  const day = value.slice(0, 10)
  const time = Date.parse(`${day}T00:00:00Z`)

  if (
    !DAY_PATTERN.test(day) ||
    Number.isNaN(time) ||
    new Date(time).toISOString().slice(0, 10) !== day
  ) {
    throw new Error(`Invalid market observation date: ${value}`)
  }

  return { day, time }
}

export const fillDailyHistory = <T extends { date: string }>(
  observations: T[],
): T[] => {
  if (!observations.length) return []

  const observedByDay = new Map(
    observations.map((observation) => {
      const { day } = normalizeDay(observation.date)
      return [day, { ...observation, date: day }] as const
    }),
  )
  const observedDays = [...observedByDay.keys()].sort((a, b) =>
    a.localeCompare(b),
  )
  const startTime = normalizeDay(observedDays.at(0)!).time
  const endTime = normalizeDay(observedDays.at(-1)!).time
  const result: T[] = []
  let preceding = observedByDay.get(observedDays.at(0)!)!

  for (
    let time = startTime;
    time <= endTime;
    time += DAY_IN_MILLISECONDS
  ) {
    const day = new Date(time).toISOString().slice(0, 10)
    preceding = observedByDay.get(day) ?? preceding
    result.push({ ...preceding, date: day })
  }

  return result
}
