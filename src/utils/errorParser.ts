import { ParsedPythonError, AppLanguage } from '../types';

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
      fix: 'Define the variable before using it or verify the spelling.',
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
      fix: 'Check for missing colons (:), unclosed parentheses, or misplaced keywords.',
    },
    uz: {
      simple: 'Python kodingizda sintaktik yoki yozish xatoligi mavjud.',
      fix: 'Ikki nuqta (:), yopilmagan qavslar yoki noto‘g‘ri kalit so‘zlarni tekshiring.',
    },
    ru: {
      simple: 'В вашем коде Python есть синтаксическая ошибка или опечатка.',
      fix: 'Проверьте пропущенные двоеточия (:), незакрытые скобки или ключевые слова.',
    },
    'uz-cyrl': {
      simple: 'Python кодингизда синтактик ёки ёзиш хатолиги мавжуд.',
      fix: 'Икки нуқта (:), ёпилмаган қавслар ёки нотўғри калит сўзларни текширинг.',
    },
  },
  IndentationError: {
    en: {
      simple: 'The spacing (indentation) at the beginning of a line is incorrect.',
      fix: 'Ensure consistent 4-space indentation for code blocks under if, for, while, def.',
    },
    uz: {
      simple: 'Qatordagi bo‘sh joy (surilish/indentation) noto‘g‘ri qo‘yilgan.',
      fix: 'if, for, while, def ostidagi bloklar uchun bir xil 4 ta probeldan foydalaning.',
    },
    ru: {
      simple: 'Неправильный отступ в начале строки.',
      fix: 'Используйте одинаковые 4 пробела для отступа блоков под if, for, def и т.д.',
    },
    'uz-cyrl': {
      simple: 'Қатордаги бўш жой (сурилиш/indentation) нотўғри қўйилган.',
      fix: 'if, for, while, def остидаги блоклар учун бир хил 4 та пробелдан фойдаланинг.',
    },
  },
  TypeError: {
    en: {
      simple: 'An operation was applied to an inappropriate type (e.g. adding text to a number).',
      fix: 'Convert types appropriately using str(), int(), or float().',
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
      simple: 'Мос келмайдиган маълумот турлари устида амал бажаришга уринилди (масалан матнга сон қўшиш).',
      fix: 'Маълумот турларини str(), int() ёки float() орқали тўғриланг.',
    },
  },
  ValueError: {
    en: {
      simple: 'A function received an argument with the right type but an inappropriate value.',
      fix: 'Check the input value passed (e.g. int("hello") will fail).',
    },
    uz: {
      simple: "Funksiya to'g'ri turdagi, ammo noto'g'ri qiymatdagi argument qabul qildi.",
      fix: 'Kiritilgan qiymatni tekshiring (masalan int("salom") xato beradi).',
    },
    ru: {
      simple: 'Функция получила аргумент правильного типа, но некорректного значения.',
      fix: 'Проверьте переданное значение (например, int("abc") вызовет ошибку).',
    },
    'uz-cyrl': {
      simple: 'Функция тўғри турдаги, аммо нотўғри қийматдаги аргумент қабул қилди.',
      fix: 'Киритилган қийматни текширинг (масалан int("салом") хато беради).',
    },
  },
  IndexError: {
    en: {
      simple: 'You are trying to access a list or sequence item that does not exist (index out of range).',
      fix: 'Verify the length of your list with len() before accessing items.',
    },
    uz: {
      simple: "Ro'yxatda mavjud bo'lmagan indeksdagi elementga murojaat qilindi.",
      fix: "Ro'yxat uzunligini len() bilan tekshiring va indeks chegaradan chiqmaganiga ishonch hosil qiling.",
    },
    ru: {
      simple: 'Попытка получить элемент по индексу вне диапазона списка.',
      fix: 'Проверьте длину списка через len() перед обращением по индексу.',
    },
    'uz-cyrl': {
      simple: 'Рўйхатда мавжуд бўлмаган индексдаги элементга мурожаат қилинди.',
      fix: 'Рўйхат узунлигини len() билан текширинг ва индекс чегарадан чиқмаганига ишонч ҳосил қилинг.',
    },
  },
  KeyError: {
    en: {
      simple: 'A dictionary key was not found in the dictionary.',
      fix: 'Check key spelling or use dict.get("key", default_value).',
    },
    uz: {
      simple: "Lug'atda (dict) ushbu kalit topilmadi.",
      fix: 'Kalit to‘g‘ri yozilganini tekshiring yoki dict.get("kalit") metodidan foydalaning.',
    },
    ru: {
      simple: 'Ключ не найден в словаре (dict).',
      fix: 'Проверьте правильность ключа или используйте dict.get("key", default).',
    },
    'uz-cyrl': {
      simple: 'Луғатда (dict) ушбу калит топилмади.',
      fix: 'Калит тўғри ёзилганини текширинг ёки dict.get("калит") методидан фойдаланинг.',
    },
  },
  AttributeError: {
    en: {
      simple: 'The object does not have the attribute or method you are trying to call.',
      fix: 'Check the object type and valid methods available for it.',
    },
    uz: {
      simple: "Obyektda siz chaqirmoqchi bo'lgan xususiyat yoki metod mavjud emas.",
      fix: "Obyekt turini va unga tegishli metodlarni tekshiring.",
    },
    ru: {
      simple: 'У объекта нет атрибута или метода, который вы пытаетесь вызвать.',
      fix: 'Проверьте тип объекта и доступные для него методы.',
    },
    'uz-cyrl': {
      simple: 'Объектда сиз чақирмоқчи бўлган хусусият ёки метод мавжуд эмас.',
      fix: 'Объект турини ва унга тегишли методларни текширинг.',
    },
  },
  ZeroDivisionError: {
    en: {
      simple: 'You cannot divide a number by zero.',
      fix: 'Add a check to verify the divisor is not zero before dividing.',
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
  ImportError: {
    en: {
      simple: 'Failed to import a module or a specific function from a module.',
      fix: 'Check the module name and ensure it is available in standard library.',
    },
    uz: {
      simple: "Modul yoki undan kerakli funksiyani import qilib bo'lmadi.",
      fix: "Modul nomi to'g'ri yozilganini tekshiring.",
    },
    ru: {
      simple: 'Не удалось импортировать модуль или объект из него.',
      fix: 'Проверьте правильность имени модуля.',
    },
    'uz-cyrl': {
      simple: 'Модул ёки ундан керакли функцияни импорт қилиб бўлмади.',
      fix: 'Модул номи тўғри ёзилганини текширинг.',
    },
  },
  ModuleNotFoundError: {
    en: {
      simple: 'The requested Python module is not installed or not found.',
      fix: 'Use Python standard library modules (e.g. math, random, json, re, datetime, os, sys, collections).',
    },
    uz: {
      simple: "So'ralgan Python moduli topilmadi.",
      fix: "Python standart kutubxona modullaridan foydalaning (masalan math, random, json, re, datetime, os, sys).",
    },
    ru: {
      simple: 'Запрошенный модуль Python не найден.',
      fix: 'Используйте стандартные модули Python (math, random, json, re, datetime, os, sys).',
    },
    'uz-cyrl': {
      simple: 'Сўралган Python модули топилмади.',
      fix: 'Python стандарт кутубхона модулларидан фойдаланинг (масалан math, random, json, re, datetime, os, sys).',
    },
  },
  FileNotFoundError: {
    en: {
      simple: 'The file or path you tried to open was not found.',
      fix: 'Check the file name and path or create the file before reading.',
    },
    uz: {
      simple: "Ochmoqchi bo'lgan fayl yoki yo'l topilmadi.",
      fix: "Fayl nomi va mavjudligini tekshiring.",
    },
    ru: {
      simple: 'Указанный файл не найден.',
      fix: 'Проверьте имя файла и путь к нему.',
    },
    'uz-cyrl': {
      simple: 'Очмоқчи бўлган файл ёки йўл топилмади.',
      fix: 'Файл номи ва мавжудлигини текширинг.',
    },
  },
  RecursionError: {
    en: {
      simple: 'A function called itself too many times without reaching a base stop condition.',
      fix: 'Ensure your recursive function has a valid base case to stop recursing.',
    },
    uz: {
      simple: 'Funksiya to‘xtash shartisiz o‘zini cheksiz chaqirdi (rekursiya xatosi).',
      fix: 'Rekursiv funksiyada to‘xtash bazaviy shartini (base case) to‘g‘ri qo‘ying.',
    },
    ru: {
      simple: 'Функция вызвала сама себя слишком много раз (бесконечная рекурсия).',
      fix: 'Добавьте базовый случай остановки в рекурсивную функцию.',
    },
    'uz-cyrl': {
      simple: 'Функция тўхташ шартисиз ўзини чексиз чақирди (рекурсия хатоси).',
      fix: 'Рекурсив функцияда тўхташ базавий шартини (base case) тўғри қўйинг.',
    },
  },
  UnboundLocalError: {
    en: {
      simple: 'A local variable was referenced before being assigned a value.',
      fix: 'Assign a value to the variable before reading it, or declare global if intended.',
    },
    uz: {
      simple: "Mahalliy o'zgaruvchiga qiymat berilmasdan oldin undan foydalanildi.",
      fix: "O'zgaruvchini ishlatishdan oldin unga qiymat bering.",
    },
    ru: {
      simple: 'Локальная переменная использована до того, как ей было присвоено значение.',
      fix: 'Присвойте значение переменной перед использованием.',
    },
    'uz-cyrl': {
      simple: 'Маҳаллий ўзгарувчига қиймат берилмасдан олдин ундан фойдаланилди.',
      fix: 'Ўзгарувчини ишлатишдан олдин унга қиймат беринг.',
    },
  },
  AssertionError: {
    en: {
      simple: 'An assert statement condition evaluated to False.',
      fix: 'Check the condition in your assert statement.',
    },
    uz: {
      simple: "assert tekshiruvi False qiymat qaytardi.",
      fix: "assert shartini va kutilgan qiymatlarni tekshiring.",
    },
    ru: {
      simple: 'Условие в инструкции assert оказалось ложным (False).',
      fix: 'Проверьте условие assert.',
    },
    'uz-cyrl': {
      simple: 'assert текшируви False қиймат қайтарди.',
      fix: 'assert шартини ва кутилган қийматларни текширинг.',
    },
  },
  RuntimeError: {
    en: {
      simple: 'A runtime error occurred during program execution.',
      fix: 'Review your program logic around the error line.',
    },
    uz: {
      simple: "Dastur bajarilishi vaqtida umumiy xatolik yuz berdi.",
      fix: "Xato qatori atrofidagi mantiqni tekshiring.",
    },
    ru: {
      simple: 'Ошибка во время выполнения программы.',
      fix: 'Проверьте логику программы вокруг строки с ошибкой.',
    },
    'uz-cyrl': {
      simple: 'Дастур бажарилиши вақтида умумий хатолик юз берди.',
      fix: 'Хато қатори атрофидаги мантиқни текширинг.',
    },
  },
};

export function parsePythonTraceback(
  tracebackText: string,
  targetFilename = 'main.py',
  lang: AppLanguage = 'en'
): ParsedPythonError | null {
  if (!tracebackText || !tracebackText.trim()) return null;

  // Check if text has Python traceback markers or syntax error
  const lines = tracebackText.split('\n');

  let errorType = 'Error';
  let errorMessage = '';
  let line = 1;
  let file = targetFilename;
  let source = '';

  // Look for: File "...", line X
  const fileLineRegex = /File\s+["']([^"']+)["'],\s+line\s+(\d+)(?:,\s+in\s+(.+))?/i;
  // Look for: ExceptionType: Message
  const exceptionRegex = /^([A-Za-z0-9_]+Error|[A-Za-z0-9_]+Exception|[A-Za-z0-9_]+Exit|AssertionError|KeyboardInterrupt)(?::\s*(.*))?$/;

  let foundFileLine = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();

    const fileMatch = lines[i].match(fileLineRegex);
    if (fileMatch) {
      file = fileMatch[1];
      line = parseInt(fileMatch[2], 10);
      foundFileLine = true;

      // The next line might be the source code
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

  // SyntaxError special check (often at bottom)
  if (!foundFileLine) {
    const syntaxMatch = tracebackText.match(/line\s+(\d+)/i);
    if (syntaxMatch) {
      line = parseInt(syntaxMatch[1], 10);
    }
  }

  if (errorType === 'Error' && !errorMessage) {
    // If no explicit exception found, check last line
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
    simple: `A ${errorType} occurred while running Python code.`,
    fix: 'Inspect line ' + line + ' and check the traceback details.',
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
