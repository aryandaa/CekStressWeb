import { useState } from "react";

function useInput(defaultValue = "") {
  const [value, setValue] = useState(defaultValue);

  function onValueChange(event) {
    setValue(event.target.value);
  }

  return [value, onValueChange];
}

export default useInput;