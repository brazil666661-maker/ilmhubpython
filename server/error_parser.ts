export interface ParsedPythonError {
  type: string;
  message: string;
  file: string;
  line: number;
  column?: number;
  source?: string;
  traceback: string;
  simpleExplanation: string;
  suggestedFix: string;
}

const ERROR_EXPLANATIONS: Record<
  string,
  {
    en: { simple: string; fix: string };
    uz: { simple: string; fix: string };
    ru: { simple: string; fix: string };
    'uz-cyrl': { simple: string; fix: string };
  }
> = {
  NameError: {
    en: {
      simple: 'Python could not find the variable or function you are trying to use.',
      fix: 'Define the variable before using it or check for spelling mistakes.',
    },
    uz: {
      simple: "Python siz ishlatmoqchi bo'lgan o'zgaruvchi yoki funksiyani topa olmadi.",
      fix: "O'zgaruvchini ishlatishdan oldin e'lon qiling yoki yozilishini tekshiring.",
    },
    ru: {
      simple: 'Python не смог найти переменную или функцию, которую вы пытаетесь использовать.',
      fix: 'Объявите переменную перед ее использованием или проверьте правильность написания.',
    },
    'uz-cyrl': {
      simple: 'Python сиз ишлатмоқчи бўлган ўзгарувчи ёки функцияни топа олмади.',
      fix: 'Ўзгарувчини ишлатишдан олдин эълон қилинг ёки ёзилишини текширинг.',
    },
  },
  SyntaxError: {
    en: {
      simple: 'There is a grammatical or typing mistake in your Python code.',
      fix: 'Check for missing colons (:), unclosed quotes/brackets, or misplaced keywords.',
    },
    uz: {
      simple: 'Python kodingizda sintaktik yoki yozish xatoligi mavjud.',
      fix: 'Ikki nuqta (:), qo‘shtirnoq, qavslar yoki noto‘g‘ri kalit so‘zlarni tekshiring.',
    },
    ru: {
      simple: 'В вашем коде Python есть синтаксическая ошибка или опечатка.',
      fix: 'Проверьте пропущенные двоеточия (:), кавычки, незакрытые скобки или ключевые слова.',
    },
    'uz-cyrl': {
      simple: 'Python кодингизда синтактик ёки ёзиш хатолиги мавжуд.',
      fix: 'Икки нуқта (:), қўштирноқ, қавслар ёки нотўғри калит сўзларни текширинг.',
    },
  },
  IndentationError: {
    en: {
      simple: 'The spacing (indentation) at the beginning of a line is incorrect.',
      fix: 'Ensure consistent 4-space indentation for code blocks.',
    },
    uz: {
      simple: 'Qatordagi bo‘sh joy (surilish/indentation) noto‘g‘ri qo‘yilgan.',
      fix: 'Bloklar uchun bir xil 4 ta probeldan foydalaning.',
    },
    ru: {
      simple: 'Неправильный отступ в начале строки.',
      fix: 'Используйте одинаковые 4 пробела для отступа блоков.',
    },
    'uz-cyrl': {
      simple: 'Қатордаги бўш жой (сурилиш/indentation) нотўғри қўйилган.',
      fix: 'Блоклар учун бир хил 4 та пробелдан фойдаланинг.',
    },
  },
  TypeError: {
    en: {
      simple: 'An operation was applied to an inappropriate type (e.g. adding text to a number).',
      fix: 'Convert data types using str(), int(), or float().',
    },
    uz: {
      simple: "Mos kelmaydigan ma'lumot turlari ustida amal bajarishga urinildi (masalan matnga son qo'shish).",
      fix: "Ma'lumot turlarini str(), int() yoki float() orqali to'g'rilang.",
    },
    ru: {
      simple: 'Операция применена к неподходящему типу (например, сложение строки и числа).',
      fix: 'Преобразуйте типы с помощью str(), int() или float().',
    },
    'uz-cyrl': {
      simple: 'Мос келмайдиган маълумот турлари устида амал бажаришга уринилди.',
      fix: 'Маълумот турларини str(), int() ёки float() орқали тўғриланг.',
    },
  },
  ValueError: {
    en: {
      simple: 'A function received an argument with the right type but an inappropriate value.',
      fix: 'Check the input value passed (e.g. int("abc") will fail).',
    },
    uz: {
      simple: "Funksiya to'g'ri turdagi, ammo noto'g'ri qiymatdagi argument qabul qildi.",
      fix: 'Kiritilgan qiymatni tekshiring (masalan int("salom") xato beradi).',
    },
    ru: {
      simple: 'Функция получила аргумент правильного типа, но некорректного значения.',
      fix: 'Проверьте переданное значение.',
    },
    'uz-cyrl': {
      simple: 'Функция тўғри турдаги, аммо нотўғри қийматдаги аргумент қабул қилди.',
      fix: 'Киритилган қийматни текширинг.',
    },
  },
  IndexError: {
    en: {
      simple: 'You are trying to access a list item with an index that is out of range.',
      fix: 'Verify the length of your list with len() before indexing.',
    },
    uz: {
      simple: "Ro'yxatda mavjud bo'lmagan indeksdagi elementga murojaat qilindi.",
      fix: "Ro'yxat uzunligini len() bilan tekshiring.",
    },
    ru: {
      simple: 'Попытка получить элемент по индексу вне диапазона списка.',
      fix: 'Проверьте длину списка через len() перед обращением по индексу.',
    },
    'uz-cyrl': {
      simple: 'Рўйхатда мавжуд бўлмаган индексдаги элементга мурожаат қилинди.',
      fix: 'Рўйхат узунлигини len() билан текширинг.',
    },
  },
  ZeroDivisionError: {
    en: {
      simple: 'Division by zero is mathematically undefined.',
      fix: 'Check that your denominator/divisor is not equal to zero.',
    },
    uz: {
      simple: "Sonni 0 ga bo'lib bo'lmaydi.",
      fix: "Bo'lishdan oldin maxraj 0 emasligini if orqali tekshiring.",
    },
    ru: {
      simple: 'Деление на ноль невозможно.',
      fix: 'Добавьте проверку делителя на ноль перед делением.',
    },
    'uz-cyrl': {
      simple: 'Сонни 0 га бўлиб бўлмайди.',
      fix: 'Бўлишдан олдин махраж 0 эмаслигини if орқали текширинг.',
    },
  },
};

export function parsePythonTraceback(
  tracebackText: string,
  targetFilename = 'main.py',
  lang: 'en' | 'uz' | 'ru' | 'uz-cyrl' = 'en'
): ParsedPythonError | null {
  if (!tracebackText || !tracebackText.trim()) return null;

  const lines = tracebackText.split('\n');
  let errorType = 'Error';
  let errorMessage = '';
  let line = 1;
  let file = targetFilename;
  let source = '';

  const fileLineRegex = /File\s+["']([^"']+)["'],\s+line\s+(\d+)(?:,\s+in\s+(.+))?/i;
  const exceptionRegex = /^([A-Za-z0-9_]+Error|[A-Za-z0-9_]+Exception|[A-Za-z0-9_]+Exit|AssertionError|KeyboardInterrupt)(?::\s*(.*))?$/;

  let foundFileLine = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const fileMatch = lines[i].match(fileLineRegex);
    if (fileMatch) {
      file = fileMatch[1];
      line = parseInt(fileMatch[2], 10);
      foundFileLine = true;

      if (i + 1 < lines.length && !lines[i + 1].trim().startsWith('File ') && !lines[i + 1].match(exceptionRegex)) {
        source = lines[i + 1].trim();
      }
    }

    const exMatch = l.match(exceptionRegex);
    if (exMatch) {
      errorType = exMatch[1];
      errorMessage = exMatch[2] ? exMatch[2].trim() : '';
    }
  }

  if (!foundFileLine) {
    const syntaxMatch = tracebackText.match(/line\s+(\d+)/i);
    if (syntaxMatch) {
      line = parseInt(syntaxMatch[1], 10);
    }
  }

  if (errorType === 'Error' && !errorMessage) {
    const lastLine = lines.filter((x) => x.trim().length > 0).pop() || '';
    if (lastLine.includes(':')) {
      const parts = lastLine.split(':');
      errorType = parts[0].trim();
      errorMessage = parts.slice(1).join(':').trim();
    } else {
      errorMessage = lastLine;
    }
  }

  const expInfo = ERROR_EXPLANATIONS[errorType]?.[lang] || ERROR_EXPLANATIONS[errorType]?.en || {
    simple: `A ${errorType} occurred while running your Python code.`,
    fix: 'Review line ' + line + ' and check the traceback details.',
  };

  return {
    type: errorType,
    message: errorMessage || 'An error occurred during execution.',
    file: file.includes('/') ? file.split('/').pop() || file : file,
    line: isNaN(line) ? 1 : line,
    source,
    traceback: tracebackText,
    simpleExplanation: expInfo.simple,
    suggestedFix: expInfo.fix,
  };
}
