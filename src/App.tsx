import { useEffect, useMemo, useState } from 'react';
import './App.css';

type CheckHabit = {
  id: string;
  label: string;
  detail: string;
  type: 'check';
  paused?: boolean;
};

type CountHabit = {
  id: string;
  label: string;
  detail: string;
  type: 'count';
  target: number;
  increment: number;
  unit: string;
  paused?: boolean;
};

type Habit = CheckHabit | CountHabit;

type DayData = Record<string, boolean | number>;

type AppData = {
  habits: Habit[];
  completions: Record<string, DayData>;
};

const DEFAULT_HABITS: Habit[] = [
  {
    id: 'water',
    label: 'Water',
    detail: '1 bottle = 1 tap',
    type: 'count',
    target: 3,
    increment: 1,
    unit: 'bottles',
  },
  {
    id: 'pushups',
    label: 'Pushups',
    detail: '+10 each tap',
    type: 'count',
    target: 100,
    increment: 10,
    unit: 'pushups',
  },
  {
    id: 'sat20',
    label: 'SAT 20',
    detail: '+20 min each tap',
    type: 'count',
    target: 20,
    increment: 20,
    unit: 'min',
  },
  {
    id: 'phoneout',
    label: 'Phone Out',
    detail: '30 minutes before bed',
    type: 'check',
  },
  {
    id: 'sleep',
    label: 'Sleep Window',
    detail: 'Protect recovery',
    type: 'check',
  },
  {
    id: 'lift',
    label: 'Lift / Mobility',
    detail: 'Strength or reset',
    type: 'check',
  },
  {
    id: 'ballskill',
    label: 'Ball Skill',
    detail: '+30 min each tap',
    type: 'count',
    target: 30,
    increment: 30,
    unit: 'min',
  },
  {
    id: 'stretch',
    label: 'Stretch',
    detail: '+20 min each tap',
    type: 'count',
    target: 20,
    increment: 20,
    unit: 'min',
  },
];

const STORAGE_KEY = 'student-athlete-daily-card-v3';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function daysInThisMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getDateForDay(thisMonth: string, day: number) {
  return `${thisMonth}-${String(day).padStart(2, '0')}`;
}

function getHabitValue(dayData: DayData, habit: Habit) {
  const value = dayData[habit.id];

  if (habit.type === 'check') {
    return Boolean(value);
  }

  return typeof value === 'number' ? value : 0;
}

function getHabitPercent(dayData: DayData, habit: Habit) {
  if (habit.type === 'check') {
    return getHabitValue(dayData, habit) ? 100 : 0;
  }

  const value = getHabitValue(dayData, habit) as number;
  return Math.round((value / habit.target) * 100);
}

function getHabitTier(dayData: DayData, habit: Habit) {
  const percent = getHabitPercent(dayData, habit);

  if (percent === 0) return 'empty';
  if (percent < 100) return 'partial';
  if (percent === 100) return 'complete';
  if (percent <= 200) return 'extra';
  if (percent <= 300) return 'super';
  return 'max';
}

function App() {
  const today = todayKey();
  const thisMonth = monthKey();

  const [showGoals, setShowGoals] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMonthView, setSelectedMonthView] = useState<string>('all');

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          habits: DEFAULT_HABITS,
          completions: {},
        };
      }
    }

    return {
      habits: DEFAULT_HABITS,
      completions: {},
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const activeHabits = data.habits.filter((habit) => !habit.paused);
  const selectedHabit = activeHabits.find(
    (habit) => habit.id === selectedMonthView
  );

  const todayCompletions = data.completions[today] || {};

  const completedToday = activeHabits.filter(
    (habit) => getHabitPercent(todayCompletions, habit) >= 100
  ).length;

  const todayPercent =
    activeHabits.length === 0
      ? 0
      : Math.round((completedToday / activeHabits.length) * 100);

  const extraCreditToday = activeHabits.reduce((total, habit) => {
    const percent = getHabitPercent(todayCompletions, habit);
    return total + Math.max(0, percent - 100);
  }, 0);

  const monthDays = useMemo(() => {
    const totalDays = daysInThisMonth();

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const date = getDateForDay(thisMonth, day);
      const row = data.completions[date] || {};

      const completed = activeHabits.filter(
        (habit) => getHabitPercent(row, habit) >= 100
      ).length;

      const highestPercent = activeHabits.reduce((best, habit) => {
        const percent = getHabitPercent(row, habit);
        return Math.max(best, percent);
      }, 0);

      const percent =
        activeHabits.length === 0 ? 0 : completed / activeHabits.length;

      return {
        day,
        date,
        completed,
        percent,
        highestPercent,
      };
    });
  }, [data.completions, data.habits, thisMonth]);

  const monthPercent = useMemo(() => {
    let completed = 0;
    let possible = 0;

    monthDays.forEach((day) => {
      completed += day.completed;
      possible += activeHabits.length;
    });

    return possible === 0 ? 0 : Math.round((completed / possible) * 100);
  }, [monthDays, activeHabits.length]);

  function getDayBrickClass(day: { percent: number; highestPercent: number }) {
    if (day.highestPercent > 300) return 'brick max';
    if (day.highestPercent > 200) return 'brick super';
    if (day.highestPercent > 100) return 'brick extra';
    if (day.percent === 1) return 'brick full';
    if (day.percent >= 0.5) return 'brick half';
    if (day.percent > 0) return 'brick low';
    return 'brick empty';
  }

  function getHabitMonthlyPercent(habit: Habit) {
    let completedDays = 0;

    monthDays.forEach((day) => {
      const row = data.completions[day.date] || {};
      if (getHabitPercent(row, habit) >= 100) {
        completedDays += 1;
      }
    });

    return Math.round((completedDays / monthDays.length) * 100);
  }

  function getHabitMonthlyAverage(habit: Habit) {
    if (habit.type === 'check') {
      return '';
    }

    let total = 0;

    monthDays.forEach((day) => {
      const row = data.completions[day.date] || {};
      total += getHabitValue(row, habit) as number;
    });

    return Math.round(total / monthDays.length);
  }

  function tapHabit(habit: Habit) {
    setData((previous) => {
      const currentDay = previous.completions[today] || {};
      const currentValue = currentDay[habit.id];

      let nextValue: boolean | number;

      if (habit.type === 'check') {
        nextValue = !Boolean(currentValue);
      } else {
        const currentNumber =
          typeof currentValue === 'number' ? currentValue : 0;
        nextValue = currentNumber + habit.increment;
      }

      return {
        ...previous,
        completions: {
          ...previous.completions,
          [today]: {
            ...currentDay,
            [habit.id]: nextValue,
          },
        },
      };
    });
  }

  function subtractHabit(habit: Habit) {
    if (habit.type !== 'count') return;

    setData((previous) => {
      const currentDay = previous.completions[today] || {};
      const currentValue = currentDay[habit.id];
      const currentNumber = typeof currentValue === 'number' ? currentValue : 0;

      return {
        ...previous,
        completions: {
          ...previous.completions,
          [today]: {
            ...currentDay,
            [habit.id]: Math.max(0, currentNumber - habit.increment),
          },
        },
      };
    });
  }

  function updateHabit(
    habitId: string,
    field: 'label' | 'detail' | 'paused',
    value: string | boolean
  ) {
    setData((previous) => ({
      ...previous,
      habits: previous.habits.map((habit) =>
        habit.id === habitId ? { ...habit, [field]: value } : habit
      ),
    }));
  }

  function resetToday() {
    setData((previous) => ({
      ...previous,
      completions: {
        ...previous.completions,
        [today]: {},
      },
    }));
  }

  if (showDetails) {
    return (
      <main className="app">
        <section className="phone-card">
          <header className="header">
            <div>
              <p className="eyebrow">Month Review</p>
              <h1>Details</h1>
              <p className="subhead">Use this page to find weak spots.</p>
            </div>

            <button
              className="small-button"
              onClick={() => setShowDetails(false)}
            >
              Back
            </button>
          </header>

          <section className="month-card">
            <div className="month-header">
              <div>
                <strong>This Month</strong>
                <p>All goals or one goal at a time.</p>
              </div>
              <span>{monthPercent}%</span>
            </div>

            <div className="month-tabs">
              <button
                className={selectedMonthView === 'all' ? 'tab active' : 'tab'}
                onClick={() => setSelectedMonthView('all')}
              >
                All
              </button>

              {activeHabits.map((habit) => (
                <button
                  key={habit.id}
                  className={
                    selectedMonthView === habit.id ? 'tab active' : 'tab'
                  }
                  onClick={() => setSelectedMonthView(habit.id)}
                >
                  {habit.label}
                </button>
              ))}
            </div>

            {selectedMonthView === 'all' && (
              <div className="review-scroll">
                <div className="review-grid all-goals">
                  <div className="review-corner">Goal</div>

                  {monthDays.map((day) => (
                    <div key={day.date} className="review-day">
                      {day.day}
                    </div>
                  ))}

                  {activeHabits.map((habit) => (
                    <div className="review-row" key={habit.id}>
                      <div className="review-label">
                        <strong>{habit.label}</strong>
                        <span>{getHabitMonthlyPercent(habit)}%</span>
                      </div>

                      {monthDays.map((day) => {
                        const row = data.completions[day.date] || {};
                        const tier = getHabitTier(row, habit);
                        const percent = getHabitPercent(row, habit);

                        return (
                          <div
                            key={`${habit.id}-${day.date}`}
                            className={`review-cell ${tier}`}
                            title={`${habit.label}: ${percent}%`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedHabit && (
              <div className="single-goal-view">
                <div className="single-goal-summary">
                  <div>
                    <p className="label">Selected Goal</p>
                    <h2>{selectedHabit.label}</h2>
                  </div>

                  <div className="single-score">
                    <strong>{getHabitMonthlyPercent(selectedHabit)}%</strong>
                    {selectedHabit.type === 'count' && (
                      <span>
                        Avg {getHabitMonthlyAverage(selectedHabit)}{' '}
                        {selectedHabit.unit}/day
                      </span>
                    )}
                  </div>
                </div>

                <div className="single-day-grid">
                  {monthDays.map((day) => {
                    const row = data.completions[day.date] || {};
                    const tier = getHabitTier(row, selectedHabit);
                    const percent = getHabitPercent(row, selectedHabit);
                    const value = getHabitValue(row, selectedHabit);

                    return (
                      <div key={day.date} className={`single-day ${tier}`}>
                        <span>{day.day}</span>

                        {selectedHabit.type === 'check' ? (
                          <strong>{percent >= 100 ? '✓' : '—'}</strong>
                        ) : (
                          <strong>
                            {value as number}/{selectedHabit.target}
                          </strong>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="legend">
              <span>
                <i className="dot empty-dot" /> none
              </span>
              <span>
                <i className="dot partial-dot" /> partial
              </span>
              <span>
                <i className="dot complete-dot" /> goal
              </span>
              <span>
                <i className="dot extra-dot" /> EC
              </span>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className="phone-card">
        <header className="header">
          <div>
            <p className="eyebrow">Student Athlete</p>
            <h1>Daily Card</h1>
            <p className="subhead">
              Tap once. Count habits can be tapped all day.
            </p>
          </div>

          <button
            className="small-button"
            onClick={() => setShowGoals(!showGoals)}
          >
            {showGoals ? 'Done' : 'Goals'}
          </button>
        </header>

        {!showGoals && (
          <>
            <section className="score-card">
              <div>
                <p className="label">Today</p>
                <h2>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h2>
              </div>

              <div className="score">
                <strong>{todayPercent}%</strong>
                <span>
                  {completedToday}/{activeHabits.length} goals
                </span>
                {extraCreditToday > 0 && (
                  <span className="ec">+{extraCreditToday}% EC</span>
                )}
              </div>
            </section>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${todayPercent}%` }}
              />
            </div>

            <section className="habit-grid">
              {activeHabits.map((habit) => {
                const tier = getHabitTier(todayCompletions, habit);
                const percent = getHabitPercent(todayCompletions, habit);
                const value = getHabitValue(todayCompletions, habit);

                return (
                  <button
                    key={habit.id}
                    className={`habit ${tier}`}
                    onClick={() => tapHabit(habit)}
                  >
                    <span className="habit-title">{habit.label}</span>
                    <span className="habit-detail">{habit.detail}</span>

                    {habit.type === 'check' ? (
                      <span className="habit-status">
                        {percent >= 100 ? 'Done' : 'Tap when done'}
                      </span>
                    ) : (
                      <span className="habit-status">
                        {value as number}/{habit.target} {habit.unit}
                        {percent > 100 ? ` · ${percent}%` : ''}
                      </span>
                    )}

                    <span className="check">{percent >= 100 ? '✓' : ''}</span>

                    {habit.type === 'count' && (value as number) > 0 && (
                      <span
                        className="minus"
                        onClick={(event) => {
                          event.stopPropagation();
                          subtractHabit(habit);
                        }}
                      >
                        −{habit.increment}
                      </span>
                    )}
                  </button>
                );
              })}
            </section>

            <section className="month-card">
              <div className="month-header">
                <div>
                  <strong>This Month</strong>
                  <p>Compact calendar</p>
                </div>
                <span>{monthPercent}%</span>
              </div>

              <div className="brick-grid">
                {monthDays.map((day) => (
                  <div key={day.date} className={getDayBrickClass(day)}>
                    {day.day}
                  </div>
                ))}
              </div>

              <button
                className="details-button"
                onClick={() => setShowDetails(true)}
              >
                Details
              </button>
            </section>

            <section className="reminders">
              <strong>Reminder Plan</strong>
              <p>7:30 AM — Water bottle 1</p>
              <p>4:30 PM — SAT 20 or lift/mobility</p>
              <p>9:30 PM — Phone out</p>
              <p>10:00 PM — Sleep window</p>
            </section>

            <button className="reset-button" onClick={resetToday}>
              Reset Today
            </button>
          </>
        )}

        {showGoals && (
          <section className="goals">
            <h2>Monthly Goals</h2>
            <p className="subhead">
              Edit names/details once per month. Keep the daily card stable.
            </p>

            {data.habits.map((habit) => (
              <div className="goal-row" key={habit.id}>
                <input
                  value={habit.label}
                  onChange={(event) =>
                    updateHabit(habit.id, 'label', event.target.value)
                  }
                />

                <input
                  value={habit.detail}
                  onChange={(event) =>
                    updateHabit(habit.id, 'detail', event.target.value)
                  }
                />

                <p className="goal-type">
                  {habit.type === 'count'
                    ? `Count habit: +${habit.increment} per tap, goal ${habit.target} ${habit.unit}`
                    : 'Check habit: tap once when done'}
                </p>

                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(habit.paused)}
                    onChange={(event) =>
                      updateHabit(habit.id, 'paused', event.target.checked)
                    }
                  />
                  Pause this habit
                </label>
              </div>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
