export function exportToQuizlet(obj: Record<string, string>): string {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (acc.length > 0) {
      acc += ";";
    }
    key = key.replace(/[\t;]/g, '');
    value = value.replace(/[\t;]/g, '');
    acc += `${key}\t${value}`;
    return acc;
  }, "");
}