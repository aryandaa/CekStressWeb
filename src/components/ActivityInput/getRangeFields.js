function getRangeFields(t) {
  return [
    {
      name: "assignmentLoad",
      type: "range",
      min: "0",
      max: "10",
      step: "1",
      label: t.ActivityAssignmentLoadTitle,
      description: t.ActivityAssignmentDescription,
      minLabel: t.ActivityLowLabel,
      maxLabel: t.ActivityExtremeLabel,
    },
    {
      name: "deadlinePressure",
      type: "range",
      min: "0",
      max: "10",
      step: "1",
      label: t.DeadlinePressureTitle,
      description: t.ActivityDeadlineDescription,
      minLabel: t.ActivityRelaxedLabel,
      maxLabel: t.ActivityUrgentLabel,
    },
    {
      name: "fatigueLevel",
      type: "range",
      min: "0",
      max: "10",
      step: "1",
      label: t.FatigueLevelTitle,
      description: t.ActivityFatigueDescription,
      minLabel: t.ActivityFreshLabel,
      maxLabel: t.ActivityExhaustedLabel,
    },
    {
      name: "moodScore",
      type: "range",
      min: "0",
      max: "10",
      step: "1",
      label: t.MoodScoreTitle,
      description: t.ActivityMoodDescription,
      minLabel: t.ActivityBadLabel,
      maxLabel: t.ActivityVeryGoodLabel,
    },
  ];
}

export default getRangeFields;
