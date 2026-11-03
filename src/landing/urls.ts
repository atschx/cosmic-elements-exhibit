/** URL helpers shared by the landing components (base-path aware, so they work under /cosmic-elements-exhibit/). */
export const BASE = import.meta.env.BASE_URL;

/** The exhibit page; `from=landing` is informational only and ignored by the exhibit. */
export const EXHIBIT_URL = `${BASE}exhibit/?from=landing`;

export const asset = (src: string): string => `${BASE}${src}`;
