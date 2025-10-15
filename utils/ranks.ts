
export const RANKS = [
  'Director-General',
  'Deputy Director-General',
  'Director I',
  'Director II',
  'Deputy Director',
  'Assistant Director I',
  'Assistant Director II',
  'Principal Superintendent',
  'Senior Superintendent I',
  'Senior Superintendent II',
  'Superintendent I',
  'Superintendent II',
  'Teacher',
  'Chief Administrative Officer',
  'Deputy Chief Administrative Officer',
  'Principal Administrative Officer',
  'Senior Administrative Officer',
  'Administrative Officer',
  'Assistant Administrative Officer',
  'Senior Administrative Assistant',
  'Administrative Assistant',
  'Junior Administrative Assistant',
  'Chief Accountant',
  'Deputy Chief Accountant',
  'Principal Accountant',
  'Senior Accountant',
  'Accountant',
  'Assistant Accountant',
  'Senior Accounts Assistant',
  'Accounts Assistant',
  'Junior Accounts Assistant',
  'Chief Internal Auditor',
  'Deputy Chief Internal Auditor',
  'Principal Internal Auditor',
  'Senior Internal Auditor',
  'Internal Auditor',
  'Assistant Internal Auditor',
  'Senior Audit Assistant',
  'Audit Assistant',
  'Junior Audit Assistant',
  'Chief Domestic Bursar',
  'Deputy Chief Domestic Bursar',
  'Principal Domestic Bursar',
  'Senior Domestic Bursar',
  'Domestic Bursar',
  'Assistant Domestic Bursar',
  'Senior Matron',
  'Matron',
  'Chief Cook',
  'Cook',
  'Assistant Cook',
  'Head Steward',
  'Steward',
  'Head Laundry Man',
  'Laundry Man',
  'Head Pantry Hand',
  'Pantry Hand',
  'Senior House Mother',
  'House Mother',
  'Chief Librarian',
  'Deputy Chief Librarian',
  'Principal Librarian',
  'Senior Librarian',
  'Librarian',
  'Assistant Librarian',
  'Senior Library Assistant',
  'Library Assistant',
  'Junior Library Assistant',
  'Chief Laboratory Technician',
  'Deputy Chief Lab Technician',
  'Principal Lab Technician',
  'Senior Lab Technician',
  'Laboratory Technician',
  'Assistant Lab Technician',
  'Senior Lab Assistant',
  'Laboratory Assistant Grade I',
  'Laboratory Assistant Grade II',
  'Principal Private Secretary',
  'Senior Private Secretary',
  'Private Secretary',
  'Stenographer Secretary',
  'Stenographer Grade I',
  'Stenographer Grade II',
  'Principal Typist',
  'Senior Typist',
  'Typist Grade I',
  'Typist Grade II',
  'Ungraded Typist',
  'Senior Rota Print Operator',
  'Rota Print Operator',
  'Chief Technical Officer',
  'Deputy Chief Technical Officer',
  'Principal Technical Officer',
  'Senior Technical Officer',
  'Technical Officer',
  'Assistant Technical Officer',
  'Senior Technical Assistant',
  'Workshop Supervisor',
  'Foreman',
  'Junior Foreman',
  'Artisan',
  'Supervisory Tradesman',
  'Tradesman Grade I',
  'Tradesman Grade II',
  'Chief Supply Officer',
  'Deputy Chief Supply Officer',
  'Principal Supply Officer',
  'Senior Supply Officer',
  'Supply Officer',
  'Principal Storekeeper',
  'Senior Storekeeper',
  'Storekeeper',
  'Assistant Storekeeper',
  'Store Assistant',
  'Chief Security Officer',
  'Deputy Chief Security Officer',
  'Principal Security Officer',
  'Senior Security Officer',
  'Security Officer',
  'Assistant Security Officer',
  'Head Porter',
  'Principal Porter',
  'Senior Porter',
  'Porter',
  'Assistant Porter',
  'Junior Porter',
  'Supervising Caretaker',
  'Senior Caretaker',
  'Caretaker',
  'Head Watchman/Gateman',
  'Senior Watchman/Gateman',
  'Night Watchman/Gateman',
  'Day Watchman/Gateman'
];

// A pre-computed set for quick lookups in isStandardRank
const STANDARD_RANKS_SET = new Set(RANKS);

// A map for common variations to the standard form.
// Key: a common, non-standard variation (in lowercase).
// Value: the correct, standard rank from the RANKS array.
const RANK_VARIATIONS_MAP: { [key: string]: string } = {
  'teacher': 'Teacher',
  'assistant director i': 'Assistant Director I',
  'assistant director 1': 'Assistant Director I',
  'assistant director ii': 'Assistant Director II',
  'assistant director 2': 'Assistant Director II',
  'senior superintendent i': 'Senior Superintendent I',
  'senior superintendent 1': 'Senior Superintendent I',
  'senior superintendent ii': 'Senior Superintendent II',
  'senior superintendent 2': 'Senior Superintendent II',
  'superintendent i': 'Superintendent I',
  'superintendent 1': 'Superintendent I',
  'superintendent ii': 'Superintendent II',
  'superintendent 2': 'Superintendent II',
  'laboratory assistant grade i': 'Laboratory Assistant Grade I',
  'laboratory assistant grade 1': 'Laboratory Assistant Grade I',
  'laboratory assistant grade ii': 'Laboratory Assistant Grade II',
  'laboratory assistant grade 2': 'Laboratory Assistant Grade II',
  'stenographer grade i': 'Stenographer Grade I',
  'stenographer grade 1': 'Stenographer Grade I',
  'stenographer grade ii': 'Stenographer Grade II',
  'stenographer grade 2': 'Stenographer Grade II',
  'typist grade i': 'Typist Grade I',
  'typist grade 1': 'Typist Grade I',
  'typist grade ii': 'Typist Grade II',
  'typist grade 2': 'Typist Grade II',
  'tradesman grade i': 'Tradesman Grade I',
  'tradesman grade 1': 'Tradesman Grade I',
  'tradesman grade ii': 'Tradesman Grade II',
  'tradesman grade 2': 'Tradesman Grade II',
};


/**
 * Attempts to normalize various rank inputs to the standardized list for grouping/display.
 * It handles common variations like casing and roman/arabic numerals.
 */
export const getStandardizedRank = (rank?: string): string => {
    if (!rank || typeof rank !== 'string') return 'Unspecified';

    const trimmedRank = rank.trim();
    
    // 1. Check for an exact match first.
    if (STANDARD_RANKS_SET.has(trimmedRank)) {
        return trimmedRank;
    }
    
    // 2. Check our pre-defined map of common variations.
    const lowerRank = trimmedRank.toLowerCase();
    if (RANK_VARIATIONS_MAP[lowerRank]) {
        return RANK_VARIATIONS_MAP[lowerRank];
    }
    
    // 3. If no mapping is found, return the original (but trimmed) value.
    // The UI will flag this as non-standard.
    return trimmedRank;
};

/**
 * Checks if a given rank is on the official, standard list.
 * This is used for validation and UI flagging. It requires an exact match.
 */
export const isStandardRank = (rank?: string): boolean => {
    if (!rank) return false;
    return STANDARD_RANKS_SET.has(rank.trim());
};
