import getNumericValue from "./getNumericValue";

function getRangeStatus(value, t) {
  const score = getNumericValue(value);

  if (score >= 8) {
    return { label: t.Hightext, color: "text-red-400" };
  }

  if (score >= 6) {
    return { label: t.ActivityQuiteHighStatus, color: "text-blue-300" };
  }

  return { label: t.MediumText, color: "text-emerald-400" };
}

export default getRangeStatus;
