/**
 * Get Indian Financial Year (FY) from a date
 * FY starts from April 1st
 * @param {Date|string} date - Input date
 * @returns {string} - Financial year in format "2025-26"
 */
export const getFY = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed

  // Financial year starts in April (month 3)
  if (month >= 3) {
    // April onwards - current FY starts this year
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    // Before April - FY started last year
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
};

/**
 * Get period label for billing based on cycle
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @param {string} cycle - Billing cycle (monthly, quarterly, half_yearly, annual)
 * @returns {string} - Human-readable period label
 */
export const getPeriodLabel = (month, year, cycle) => {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  switch (cycle) {
    case 'monthly':
      return `${monthNames[month - 1]} ${year}`;

    case 'quarterly': {
      const q = Math.ceil(month / 3);
      const fy = getFY(new Date(year, month - 1, 1));
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;
      return `Q${q} FY ${fy} (${monthNames[startMonth - 1]}-${monthNames[endMonth - 1]})`;
    }

    case 'half_yearly': {
      const h = month >= 10 ? 2 : 1;
      const fy = getFY(new Date(year, month - 1, 1));
      if (h === 1) {
        return `H1 FY ${fy} (Apr-Sep ${year})`;
      } else {
        return `H2 FY ${fy} (Oct ${year}-Mar ${year + 1})`;
      }
    }

    case 'annual': {
      const fy = getFY(new Date(year, month - 1, 1));
      return `FY ${fy}`;
    }

    default:
      return `${monthNames[month - 1]} ${year}`;
  }
};

/**
 * Get all months in a financial year
 * @param {string} fy - Financial year (e.g., "2025-26")
 * @returns {Array} - Array of {month, year} for the FY
 */
export const getMonthsInFY = (fy) => {
  const [startYear, endYearStr] = fy.split('-');
  const startYearNum = parseInt(startYear);
  const endYearNum = startYearNum + 1;

  const months = [];

  // April to December of start year
  for (let month = 4; month <= 12; month++) {
    months.push({ month, year: startYearNum });
  }

  // January to March of end year
  for (let month = 1; month <= 3; month++) {
    months.push({ month, year: endYearNum });
  }

  return months;
};

/**
 * Get quarters in a financial year
 * @param {string} fy - Financial year (e.g., "2025-26")
 * @returns {Array} - Array of {quarter, months, label}
 */
export const getQuartersInFY = (fy) => {
  const [startYear, endYearStr] = fy.split('-');
  const startYearNum = parseInt(startYear);

  return [
    {
      quarter: 1,
      months: [
        { month: 4, year: startYearNum },
        { month: 5, year: startYearNum },
        { month: 6, year: startYearNum }
      ],
      label: `Q1 FY ${fy} (Apr-Jun)`
    },
    {
      quarter: 2,
      months: [
        { month: 7, year: startYearNum },
        { month: 8, year: startYearNum },
        { month: 9, year: startYearNum }
      ],
      label: `Q2 FY ${fy} (Jul-Sep)`
    },
    {
      quarter: 3,
      months: [
        { month: 10, year: startYearNum },
        { month: 11, year: startYearNum },
        { month: 12, year: startYearNum }
      ],
      label: `Q3 FY ${fy} (Oct-Dec)`
    },
    {
      quarter: 4,
      months: [
        { month: 1, year: startYearNum + 1 },
        { month: 2, year: startYearNum + 1 },
        { month: 3, year: startYearNum + 1 }
      ],
      label: `Q4 FY ${fy} (Jan-Mar)`
    }
  ];
};

/**
 * Check if a date falls within a financial year
 * @param {Date} date - Date to check
 * @param {string} fy - Financial year (e.g., "2025-26")
 * @returns {boolean}
 */
export const isDateInFY = (date, fy) => {
  const fyOfDate = getFY(date);
  return fyOfDate === fy;
};

/**
 * Next financial year
 * @param {string} fy - Current FY
 * @returns {string} - Next FY
 */
export const getNextFY = (fy) => {
  const [startYear, endYearStr] = fy.split('-');
  const startYearNum = parseInt(startYear) + 1;
  const endYearNum = startYearNum + 1;
  return `${startYearNum}-${endYearNum.toString().slice(-2)}`;
};

/**
 * Previous financial year
 * @param {string} fy - Current FY
 * @returns {string} - Previous FY
 */
export const getPreviousFY = (fy) => {
  const [startYear, endYearStr] = fy.split('-');
  const startYearNum = parseInt(startYear) - 1;
  const endYearNum = startYearNum + 1;
  return `${startYearNum}-${endYearNum.toString().slice(-2)}`;
};

/**
 * Get current financial year
 * @returns {string} - Current FY
 */
export const getCurrentFY = () => {
  return getFY(new Date());
};
