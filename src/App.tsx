import { useEffect, useMemo, useState } from "react";
import "./App.css";

type ProfileId = "K1" | "K2" | "A1" | "A2";

type Habit = {
  id: string;
  label: string;
  detail: string;
  type: "check" | "count";
  target?: number;
  increment?: number;
  unit?: string;
  paused?: boolean;
};

type DayData = Record<string, boolean | number>;

type ProfileData = {
  label: ProfileId;
  habits: Habit[];
  completions: Record<string, DayData>;
};

type AppData = {
  activeProfileId: ProfileId;
  profiles: Record<ProfileId, ProfileData>;
};

const OLD_STORAGE_KEY = "student-athlete-daily-card-v3";
const STORAGE_KEY = "student-athlete-daily-card-v4-profiles";

const K1_HABITS: Habit[] = [
  {
    id: "water",
    label: "Water",
    detail: "1 bottle = 1 tap",
    type: "count",
    target: 3,
    increment: 1,
    unit: "bottles",
  },
  {
    id: "pushups",
    label: "Pushups",
    detail: "+10 each tap",
    type: "count",
    target: 100,
    increment: 10,
    unit: "pushups",
  },
  {
    id: "sat20",
    label: "SAT 20",
    detail: "+20 min each tap",
    type: "count",
    target: 20,
    increment: 20,
    unit: "min",
  },
  {
    id: "phoneout",
    label: "Phone Out",
    detail: "30 minutes before bed",
    type: "check",
  },
  {
    id: "sleep",
    label: "Sleep Window",
    detail: "Protect recovery",
    type: "check",
  },
  {
    id: "lift",
    label: "Lift / Mobility",
    detail: "Strength or reset",
    type: "check",
  },
  {
    id: "ballskill",
    label: "Ball Skill",
    detail: "+30 min each tap",
    type: "count",
    target: 30,
    increment: 30,
    unit: "min",
  },
  {
    id: "stretch",
    label: "Stretch",
    detail: "+20 min each tap",
    type: "count",
    target: 20,
    increment: 20,
    unit: "min",
  },
];

const K2_HABITS: Habit[] = [
  {
    id: "water",
    label: "Water",
    detail: "1 bottle = 1 tap",
    type: "count",
    target: 3,
    increment: 1,
    unit: "bottles",
  },
  {
    id: "core",
    label: "Core",
    detail: "+15 reps each tap",
    type: "count",
    target: 60,
    increment: 15,
    unit: "reps",
  },
  {
    id: "run_swim",
    label: "Run / Swim",
    detail: "Tap after workout",
    type: "check",
  },
  {
    id: "mobility",
    label: "Mobility",
    detail: "+10 min each tap",
    type: "count",
    target: 20,
    increment: 10,
    unit: "min",
  },
  {
    id: "phoneout",
    label: "Phone Out",
    detail: "30 minutes before bed",
    type: "check",
  },
  {
    id: "sleep",
    label: "Sleep Window",
    detail: "Protect recovery",
    type: "check",
  },
  {
    id: "stretch",
    label: "Stretch",
    detail: "+10 min each tap",
    type: "count",
    target: 20,
    increment: 10,
    unit: "min",
  },
  {
    id: "recovery",
    label: "Recovery",
    detail: "Easy reset",
    type: "check",
  },
];

const ADULT_HABITS: Habit[] = [
  {
    id: "water",
    label: "Water",
    detail: "1 bottle = 1 tap",
    type: "count",
    target: 3,
    increment: 1,
    unit: "bottles",
  },
  {
    id: "move",
    label: "Move",
    detail: "+10 min each tap",
    type: "count",
    target: 30,
    increment: 10,
    unit: "min",
  },
  {
    id: "strength",
    label: "Strength",
    detail: "Tap when done",
    type: "check",
  },
  {
    id: "sleep",
    label: "Sleep",
    detail: "Protect recovery",
    type: "check",
  },
  {
    id: "phoneout",
    label: "Phone Out",
    detail: "30 minutes before bed",
    type: "check",
  },
  {
    id: "focus",
    label: "Focus Block",
    detail: "+25 min each tap",
    type: "count",
    target: 25,
    increment: 25,
    unit: "min",
  },
  {
    id: "mobility",
    label: "Mobility",
    detail: "+10 min each tap",
    type: "count",
    target: 20,
    increment: 10,
    unit: "min",
  },
  {
    id: "reset",
    label: "Reset",
    detail: "Tap when done",
    type: "check",
  },
];

function makeDefaultData(): AppData {
  return {
    activeProfileId: "K1",
    profiles: {
      K1: {
        label: "K1",
        habits: K1_HABITS,
        completions: {},
      },
      K2: {
        label: "K2",
        habits: K2_HABITS,
        completions: {},
      },
      A1: {
        label: "A1",
        habits: ADULT_HABITS,
        completions: {},
      },
      A2: {
        label: "A2",
        habits: ADULT_HABITS,
        completions: {},
      },
    },
  };
}

function loadInitialData(): AppData {
  const savedNew = localStorage.getItem(STORAGE_KEY);

  if (savedNew) {
    try {
      return JSON.parse(savedNew);
    } catch {
      return makeDefaultData();
    }
  }

  const savedOld = localStorage.getItem(OLD_STORAGE_KEY);

  if (savedOld) {
    try {
      const oldData = JSON.parse(savedOld);
      const migrated = makeDefaultData();

      migrated.profiles.K1 = {
        label: "K1",
        habits: oldData.habits || K1_HABITS,
        completions: oldData.completions || {},
      };

      return migrated;
    } catch {
      return makeDefaultData();
    }
  }

  return makeDefaultData();
}

function getLocalDateParts(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return { year, month, day };
}

function todayKey() {
  const { year, month, day } = getLocalDateParts();
  return `${year}-${month}-${day}`;
}

function monthKey() {
  const { year, month } = getLocalDateParts();
  return `${year}-${month}`;
}

function daysInThisMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getDateForDay(thisMonth: string, day: number) {
  return `${thisMonth}-${String(day).padStart(2, "0")}`;
}

function getHabitTarget(habit: Habit) {
  return habit.target && habit.target > 0 ? habit.target : 1;
}

function getHabitIncrement(habit: Habit) {
  return habit.increment && habit.increment > 0 ? habit.increment : 1;
}

function getHabitUnit(habit: Habit) {
  return habit.unit || "units";
}

function getHabitValue(dayData: DayData, habit: Habit) {
  const value = dayData[habit.id];

  if (habit.type === "check") {
    return Boolean(value);
  }

  return typeof value === "number" ? value : 0;
}

function getHabitPercent(dayData: DayData, habit: Habit) {
  if (habit.type === "check") {
    return getHabitValue(dayData, habit) ? 100 : 0;
  }

  const value = getHabitValue(dayData, habit) as number;
  return Math.round((value / getHabitTarget(habit)) * 100);
}

function getHabitTier(dayData: DayData, habit: Habit) {
  const percent = getHabitPercent(dayData, habit);

  if (percent === 0) return "empty";
  if (percent < 100) return "partial";
  if (percent === 100) return "complete";
  if (percent <= 200) return "extra";
  if (percent <= 300) return "super";
  return "max";
}

function App() {
  const [currentDateKey, setCurrentDateKey] = useState(todayKey());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateKey(todayKey());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const today = currentDateKey;
  const thisMonth = monthKey();

  const [showGoals, setShowGoals] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMonthView, setSelectedMonthView] = useState<string>("all");

  const [appData, setAppData] = useState<AppData>(() => loadInitialData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  }, [appData]);

  const activeProfileId = appData.activeProfileId;
  const profile = appData.profiles[activeProfileId];

  const activeHabits = profile.habits.filter((habit) => !habit.paused);
  const selectedHabit = activeHabits.find(
    (habit) => habit.id === selectedMonthView
  );

  const todayCompletions = profile.completions[today] || {};

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
      const row = profile.completions[date] || {};

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
  }, [profile.completions, profile.habits, thisMonth, activeHabits.length]);

  const monthPercent = useMemo(() => {
    let completed = 0;
    let possible = 0;

    monthDays.forEach((day) => {
      completed += day.completed;
      possible += activeHabits.length;
    });

    return possible === 0 ? 0 : Math.round((completed / possible) * 100);
  }, [monthDays, activeHabits.length]);

  function updateCurrentProfile(
    updater: (profile: ProfileData) => ProfileData
  ) {
    setAppData((previous) => ({
      ...previous,
      profiles: {
        ...previous.profiles,
        [previous.activeProfileId]: updater(
          previous.profiles[previous.activeProfileId]
        ),
      },
    }));
  }

  function switchProfile(profileId: ProfileId) {
    setAppData((previous) => ({
      ...previous,
      activeProfileId: profileId,
    }));

    setSelectedMonthView("all");
    setShowGoals(false);
    setShowDetails(false);
  }

  function getDayBrickClass(day: {
    percent: number;
    highestPercent: number;
  }) {
    if (day.highestPercent > 300) return "brick max";
    if (day.highestPercent > 200) return "brick super";
    if (day.highestPercent > 100) return "brick extra";
    if (day.percent === 1) return "brick full";
    if (day.percent >= 0.5) return "brick half";
    if (day.percent > 0) return "brick low";
    return "brick empty";
  }

  function getHabitMonthlyPercent(habit: Habit) {
    let completedDays = 0;

    monthDays.forEach((day) => {
      const row = profile.completions[day.date] || {};
      if (getHabitPercent(row, habit) >= 100) {
        completedDays += 1;
      }
    });

    return Math.round((completedDays / monthDays.length) * 100);
  }

  function getHabitMonthlyAverage(habit: Habit) {
    if (habit.type === "check") {
      return "";
    }

    let total = 0;

    monthDays.forEach((day) => {
      const row = profile.completions[day.date] || {};
      total += getHabitValue(row, habit) as number;
    });

    return Math.round(total / monthDays.length);
  }

  function tapHabit(habit: Habit) {
    updateCurrentProfile((currentProfile) => {
      const currentDay = currentProfile.completions[today] || {};
      const currentValue = currentDay[habit.id];

      let nextValue: boolean | number;

      if (habit.type === "check") {
        nextValue = !Boolean(currentValue);
      } else {
        const currentNumber =
          typeof currentValue === "number" ? currentValue : 0;
        nextValue = currentNumber + getHabitIncrement(habit);
      }

      return {
        ...currentProfile,
        completions: {
          ...currentProfile.completions,
          [today]: {
            ...currentDay,
            [habit.id]: nextValue,
          },
        },
      };
    });
  }

  function subtractHabit(habit: Habit) {
    if (habit.type !== "count") return;

    updateCurrentProfile((currentProfile) => {
      const currentDay = currentProfile.completions[today] || {};
      const currentValue = currentDay[habit.id];
      const currentNumber =
        typeof currentValue === "number" ? currentValue : 0;

      return {
        ...currentProfile,
        completions: {
          ...currentProfile.completions,
          [today]: {
            ...currentDay,
            [habit.id]: Math.max(0, currentNumber - getHabitIncrement(habit)),
          },
        },
      };
    });
  }

  function updateHabit(
    habitId: string,
    field: keyof Habit,
    value: string | number | boolean
  ) {
    updateCurrentProfile((currentProfile) => ({
      ...currentProfile,
      habits: currentProfile.habits.map((habit) => {
        if (habit.id !== habitId) return habit;

        if (field === "type" && value === "count") {
          return {
            ...habit,
            type: "count",
            target: habit.target || 1,
            increment: habit.increment || 1,
            unit: habit.unit || "units",
          };
        }

        if (field === "type" && value === "check") {
          return {
            ...habit,
            type: "check",
          };
        }

        return {
          ...habit,
          [field]: value,
        };
      }),
    }));
  }

  function addGoal() {
    const id = `goal_${Date.now()}`;

    updateCurrentProfile((currentProfile) => ({
      ...currentProfile,
      habits: [
        ...currentProfile.habits,
        {
          id,
          label: "New Goal",
          detail: "Tap when done",
          type: "check",
        },
      ],
    }));
  }

  function deleteGoal(habitId: string) {
    updateCurrentProfile((currentProfile) => {
      const nextCompletions: Record<string, DayData> = {};

      Object.entries(currentProfile.completions).forEach(([date, row]) => {
        const nextRow = { ...row };
        delete nextRow[habitId];
        nextCompletions[date] = nextRow;
      });

      return {
        ...currentProfile,
        habits: currentProfile.habits.filter((habit) => habit.id !== habitId),
        completions: nextCompletions,
      };
    });

    if (selectedMonthView === habitId) {
      setSelectedMonthView("all");
    }
  }

  function resetToday() {
    updateCurrentProfile((currentProfile) => ({
      ...currentProfile,
      completions: {
        ...currentProfile.completions,
        [today]: {},
      },
    }));
  }

  function ProfileSelector() {
    return (
      <div className="profile-picker">
        <span>Profile</span>
        <select
          value={activeProfileId}
          onChange={(event) => switchProfile(event.target.value as ProfileId)}
        >
          <option value="K1">K1</option>
          <option value="K2">K2</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
        </select>
      </div>
    );
  }

  if (showDetails) {
    return (
      <main className="app">
        <section className="phone-card">
          <header className="header">
            <div>
              <p className="eyebrow">Month Review</p>
              <h1>{activeProfileId} Details</h1>
              <p className="subhead">Use this page to find weak spots.</p>
              <ProfileSelector />
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
                className={selectedMonthView === "all" ? "tab active" : "tab"}
                onClick={() => setSelectedMonthView("all")}
              >
                All
              </button>

              {activeHabits.map((habit) => (
                <button
                  key={habit.id}
                  className={
                    selectedMonthView === habit.id ? "tab active" : "tab"
                  }
                  onClick={() => setSelectedMonthView(habit.id)}
                >
                  {habit.label}
                </button>
              ))}
            </div>

            {selectedMonthView === "all" && (
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
                        const row = profile.completions[day.date] || {};
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
                    {selectedHabit.type === "count" && (
                      <span>
                        Avg {getHabitMonthlyAverage(selectedHabit)}{" "}
                        {getHabitUnit(selectedHabit)}/day
                      </span>
                    )}
                  </div>
                </div>

                <div className="single-day-grid">
                  {monthDays.map((day) => {
                    const row = profile.completions[day.date] || {};
                    const tier = getHabitTier(row, selectedHabit);
                    const percent = getHabitPercent(row, selectedHabit);
                    const value = getHabitValue(row, selectedHabit);

                    return (
                      <div key={day.date} className={`single-day ${tier}`}>
                        <span>{day.day}</span>

                        {selectedHabit.type === "check" ? (
                          <strong>{percent >= 100 ? "✓" : "—"}</strong>
                        ) : (
                          <strong>
                            {value as number}/{getHabitTarget(selectedHabit)}
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
            <p className="eyebrow">Small Habits. Big Results.</p>
            <h1>{activeProfileId} Daily Card</h1>
            <p className="subhead">
              Tap once. Count habits can be tapped all day.
            </p>
            <ProfileSelector />
          </div>

          <button
            className="small-button"
            onClick={() => setShowGoals(!showGoals)}
          >
            {showGoals ? "Done" : "Goals"}
          </button>
        </header>

        {!showGoals && (
          <>
            <section className="score-card">
              <div>
                <p className="label">Today</p>
                <h2>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
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

                    {habit.type === "check" ? (
                      <span className="habit-status">
                        {percent >= 100 ? "Done" : "Tap when done"}
                      </span>
                    ) : (
                      <span className="habit-status">
                        {value as number}/{getHabitTarget(habit)}{" "}
                        {getHabitUnit(habit)}
                        {percent > 100 ? ` · ${percent}%` : ""}
                      </span>
                    )}

                    <span className="check">{percent >= 100 ? "✓" : ""}</span>

                    {habit.type === "count" && (value as number) > 0 && (
                      <span
                        className="minus"
                        onClick={(event) => {
                          event.stopPropagation();
                          subtractHabit(habit);
                        }}
                      >
                        −{getHabitIncrement(habit)}
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
              <p>4:30 PM — Focus goal, lift, or mobility</p>
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
            <h2>{activeProfileId} Monthly Goals</h2>
            <p className="subhead">
              Each profile can set its own goals. Daily use stays tap-only.
            </p>

            {profile.habits.map((habit) => (
              <div className="goal-row" key={habit.id}>
                <input
                  value={habit.label}
                  onChange={(event) =>
                    updateHabit(habit.id, "label", event.target.value)
                  }
                  placeholder="Goal name"
                />

                <input
                  value={habit.detail}
                  onChange={(event) =>
                    updateHabit(habit.id, "detail", event.target.value)
                  }
                  placeholder="Short instruction"
                />

                <div className="goal-controls">
                  <label>
                    Type
                    <select
                      value={habit.type}
                      onChange={(event) =>
                        updateHabit(
                          habit.id,
                          "type",
                          event.target.value as "check" | "count"
                        )
                      }
                    >
                      <option value="check">Check</option>
                      <option value="count">Count</option>
                    </select>
                  </label>

                  {habit.type === "count" && (
                    <>
                      <label>
                        Target
                        <input
                          type="number"
                          min="1"
                          value={getHabitTarget(habit)}
                          onChange={(event) =>
                            updateHabit(
                              habit.id,
                              "target",
                              Number(event.target.value)
                            )
                          }
                        />
                      </label>

                      <label>
                        Tap adds
                        <input
                          type="number"
                          min="1"
                          value={getHabitIncrement(habit)}
                          onChange={(event) =>
                            updateHabit(
                              habit.id,
                              "increment",
                              Number(event.target.value)
                            )
                          }
                        />
                      </label>

                      <label>
                        Unit
                        <input
                          value={getHabitUnit(habit)}
                          onChange={(event) =>
                            updateHabit(habit.id, "unit", event.target.value)
                          }
                        />
                      </label>
                    </>
                  )}
                </div>

                <label className="pause-line">
                  <input
                    type="checkbox"
                    checked={Boolean(habit.paused)}
                    onChange={(event) =>
                      updateHabit(habit.id, "paused", event.target.checked)
                    }
                  />
                  Pause this goal
                </label>

                <button
                  className="delete-goal-button"
                  onClick={() => deleteGoal(habit.id)}
                >
                  Delete Goal
                </button>
              </div>
            ))}

            <button className="add-goal-button" onClick={addGoal}>
              Add Goal
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;