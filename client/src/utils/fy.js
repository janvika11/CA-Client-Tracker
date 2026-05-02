/**
 * Indian FY from a date (April–March). Matches server `getFY` in `server/utils/fyUtils.js`.
 * @param {Date|string|number} dateLike
 * @returns {string} e.g. "2025-26"
 */
export const getFY = (dateLike) => {
  const d = new Date(dateLike);
  const year = d.getFullYear();
  const month = d.getMonth();
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
};

export const getCurrentFY = (dateLike = new Date()) => getFY(dateLike);
