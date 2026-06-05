import { activityNumberFields } from "./activityFormConstants";

const activityHasInput = (form) => {
  const hasNumericInput = activityNumberFields.some((fieldName) => {
    const value = Number(form[fieldName]);
    return Number.isFinite(value) && value > 0;
  });

  return hasNumericInput || Boolean(String(form.dailyNote || "").trim());
};

function buildActivityPayload(form, status) {
  return {
    activityDate: form.activityDate,
    activityStatus: status,
    note: form.dailyNote,
    ...Object.fromEntries(
      activityNumberFields.map((fieldName) => [
        fieldName,
        Number(form[fieldName] || 0),
      ]),
    ),
  };
}

export { activityHasInput };
export default buildActivityPayload;
