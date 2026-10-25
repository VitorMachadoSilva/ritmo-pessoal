function isDone(habit, day) {
  const value = habit.kind === "water"
    ? day.water
    : habit.kind === "sleep"
      ? (day.sleep ?? 0)
      : (day.entries[habit.id] ?? 0);
  return value >= habit.target;
}

/** Return only incomplete-to-complete transitions between confirmed snapshots. */
export function newlyCompletedHabits(previous, next) {
  const completed = [];
  for (const [date, day] of Object.entries(next.days)) {
    const beforeDay = previous.days[date];
    for (const habit of day.habits) {
      const wasDone = beforeDay?.habits.some((previousHabit) =>
        previousHabit.id === habit.id && isDone(previousHabit, beforeDay),
      ) ?? false;
      if (!wasDone && isDone(habit, day)) completed.push({ date, habitId: habit.id });
    }
  }
  return completed;
}
