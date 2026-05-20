/** Hook that manages a boolean toggle state with a convenience toggle function. */
import { useState } from "react";

/**
 * @param initialValue - Starting boolean value (default: false).
 * @returns An object with current value, setValue, and toggle function.
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = () => setValue(!value);

  return { value, setValue, toggle };
}
