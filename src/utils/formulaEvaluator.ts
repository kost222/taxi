// Safe formula evaluator to replace dangerous eval() usage
interface FormulaVariables {
  [key: string]: number | string;
}
export class SafeFormulaEvaluator {
  private static readonly ALLOWED_OPERATORS = ['+', '-', '*', '/', '(', ')', '.'];
  private static readonly ALLOWED_FUNCTIONS = ['Math.floor', 'Math.ceil', 'Math.round', 'Math.abs'];
  static evaluateFormula(formula: string, variables: FormulaVariables): number {
    try {
      // Sanitize the formula
      let sanitizedFormula = formula.trim();
      // Replace variables with their values
      Object.entries(variables).forEach(([key, value]) => {
        const numValue = this.toNumber(value);
        sanitizedFormula = sanitizedFormula.replace(
          new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          numValue.toString()
        );
      });
      // Validate formula contains only safe characters
      if (!this.isFormulaSafe(sanitizedFormula)) {
        throw new Error('Formula contains unsafe characters or operations');
      }
      // Use a simple mathematical expression evaluator instead of eval()
      const result = this.evaluateMathExpression(sanitizedFormula);
      return Math.trunc(result);
    } catch (error) {
      return 0;
    }
  }
  private static toNumber(value: number | string): number {
    if (typeof value === 'number') return value;
    const num = parseFloat(value.toString());
    return isNaN(num) ? 0 : num;
  }
  private static isFormulaSafe(formula: string): boolean {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval/i,
      /function/i,
      /new/i,
      /import/i,
      /require/i,
      /document/i,
      /window/i,
      /global/i,
      /process/i,
      /constructor/i,
      /__proto__/i,
      /prototype/i
    ];
    if (dangerousPatterns.some(pattern => pattern.test(formula))) {
      return false;
    }
    // Only allow numbers, operators, and safe functions
    const allowedChars = /^[\d\+\-\*\/\(\)\.\s]+$/;
    return allowedChars.test(formula);
  }
  private static evaluateMathExpression(expression: string): number {
    // Simple recursive descent parser for basic math expressions
    // This replaces the dangerous eval() with a controlled evaluator
    const tokens = this.tokenize(expression);
    let index = 0;
    const parseExpression = (): number => {
      let result = parseTerm();
      while (index < tokens.length && (tokens[index] === '+' || tokens[index] === '-')) {
        const operator = tokens[index++];
        const operand = parseTerm();
        result = operator === '+' ? result + operand : result - operand;
      }
      return result;
    };
    const parseTerm = (): number => {
      let result = parseFactor();
      while (index < tokens.length && (tokens[index] === '*' || tokens[index] === '/')) {
        const operator = tokens[index++];
        const operand = parseFactor();
        result = operator === '*' ? result * operand : result / operand;
      }
      return result;
    };
    const parseFactor = (): number => {
      if (index >= tokens.length) return 0;
      if (tokens[index] === '(') {
        index++; // skip '('
        const result = parseExpression();
        if (tokens[index] === ')') index++; // skip ')'
        return result;
      }
      if (tokens[index] === '-') {
        index++;
        return -parseFactor();
      }
      const num = parseFloat(tokens[index]);
      if (!isNaN(num)) {
        index++;
        return num;
      }
      return 0;
    };
    return parseExpression();
  }
  private static tokenize(expression: string): string[] {
    const tokens: string[] = [];
    let current = '';
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      if (/\s/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }
      if (/[\+\-\*\/\(\)]/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else {
        current += char;
      }
    }
    if (current) {
      tokens.push(current);
    }
    return tokens;
  }
}