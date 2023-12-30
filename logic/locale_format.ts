const locales = [...navigator.languages, "en-US"];

export const DateFormat = new Intl.DateTimeFormat(locales);
export const NumberFormatDefault = new Intl.NumberFormat(locales);
export const NumberFormatDecimal = new Intl.NumberFormat(locales, {
	minimumFractionDigits: 1,
	maximumFractionDigits: 2,
});
export const NumberFormatFileSize = new Intl.NumberFormat(locales, {
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
});
