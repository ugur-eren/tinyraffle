/**
 * Returns the value of the given CSS property for the body.
 *
 * #### Example:
 * `getCssPropValue("width");`
 *
 * `getCssPropValue("--font-size");`
 *
 * @param propName CSS property name
 * @returns string - Value of the CSS property for the body.
 */
export const getCssPropValue = (propName: string) => {
  return window
    .getComputedStyle(document.getElementsByTagName('body')[0])
    .getPropertyValue(propName);
};

/**
 * Replaces the given `parts` in `language` string
 *
 * Given string must include a part (`%part_key%`)
 *
 * #### Example:
 * String: `Today is %date%, send email to %email%`
 *
 * `parseLanguageParts(language.some_value, {date: Date.now(), email: 'mail[at]example.com'});`
 *
 * @param language Language string to be parsed.
 * @param parts Parts to be replaced with.
 * @returns string - parsed language string
 */
export const parseLanguageParts = (language: string, parts: Record<string, string>): string => {
  return Object.keys(parts).reduce((current, key) => {
    return current.replaceAll(`%${key}%`, parts[key]);
  }, language);
};
