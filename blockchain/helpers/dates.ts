function addDays(date: Date, days: number): Date {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addSeconds(date: Date, seconds: number): Date {
  var result = new Date(date);
  result.setSeconds(result.getSeconds() + seconds);
  return result;
}

function toSeconds(date: Date): number {
  return date.getTime() * 1000;
}


export {
  addDays,
  addSeconds,
  toSeconds
}