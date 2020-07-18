/** Whether an array has actually changed */
export const hasArrayChanged = (newVals: any[], oldVals: any[] = []) =>
  !oldVals
  || oldVals.length != newVals.length
  || !oldVals.every((card, index) => card == newVals[index])
