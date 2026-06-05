const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPastActivityDateOptions = (date = new Date(), dayCount = 4) =>
  Array.from({ length: dayCount }, (_, index) => {
    const optionDate = new Date(date);
    optionDate.setDate(optionDate.getDate() - (index + 1));

    return {
      value: getLocalDateString(optionDate),
      date: optionDate,
    };
  });

const createInitialActivityForm = () => ({
  activityDate: "",
  sleepHours: "",
  studyHours: "",
  screenTimeHours: "",
  socialMediaHours: "",
  physicalActivityMinutes: "",
  dailyNote: "",
  moodScore: "0",
  fatigueLevel: "0",
  assignmentLoad: "0",
  deadlinePressure: "0",
});

const initialActivityForm = createInitialActivityForm();

const activityNumberFields = [
  "sleepHours",
  "studyHours",
  "screenTimeHours",
  "socialMediaHours",
  "physicalActivityMinutes",
  "moodScore",
  "fatigueLevel",
  "assignmentLoad",
  "deadlinePressure",
];

export {
  activityNumberFields,
  createInitialActivityForm,
  getLocalDateString,
  getPastActivityDateOptions,
  initialActivityForm,
};
