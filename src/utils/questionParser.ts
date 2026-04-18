export interface ParsedQuestion {
  questionText: string;
  options: string[];
  detected: boolean;
}

const OPTION_PREFIX_REGEX = /^[\s]*(?:\(([A-Ea-e1-5])\)|([A-Ea-e1-5])[.)]\s+)/;

export function parseQuestionFromPaste(rawText: string): ParsedQuestion {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length < 3) {
    return { questionText: rawText, options: [], detected: false };
  }

  const optionStartIndex = lines.findIndex(line => OPTION_PREFIX_REGEX.test(line));

  if (optionStartIndex <= 0) {
    return { questionText: rawText, options: [], detected: false };
  }

  const questionText = lines.slice(0, optionStartIndex).join('\n').trim();
  const rawOptionLines = lines.slice(optionStartIndex);

  const options: string[] = [];
  let current = '';

  for (const line of rawOptionLines) {
    if (OPTION_PREFIX_REGEX.test(line)) {
      if (current) options.push(current.trim());
      current = line.replace(OPTION_PREFIX_REGEX, '').trim();
    } else {
      current += (current ? ' ' : '') + line;
    }
  }
  if (current) options.push(current.trim());

  if (options.length < 2) {
    return { questionText: rawText, options: [], detected: false };
  }

  return { questionText, options, detected: true };
}
