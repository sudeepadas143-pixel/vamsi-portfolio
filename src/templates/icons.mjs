// Inline SVGs recovered from the original page's symbol sprite / data URIs.

export const sparkle = (cls = 'sparkle') =>
  `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true"><path d="M22.75 48C20.903 37.41 10.483 27.457 0 25.25v-2.625C10.549 20.105 20.686 10.941 22.75 0h2.625c1.794 10.66 12.167 20.343 22.625 22.625v2.625C37.735 27.377 27.106 37.364 25.375 48Z" fill="currentColor"/></svg>`;

export const linkedin = (cls = 'icon-linkedin') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 21A.75.75 0 0 1 3 20.25V3.75A.75.75 0 0 1 3.75 3h16.5a.75.75 0 0 1 .75.75v16.5a.75.75 0 0 1-.75.75Z"/><path d="M11.25 10.5v6M8.25 10.5v6M11.25 13.125a2.625 2.625 0 0 1 5.25 0V16.5"/><circle cx="8.25" cy="7.875" r="1.125" fill="currentColor" stroke="none"/></svg>`;

export const signature = (cls = 'signature') =>
  `<svg class="${cls}" viewBox="0 0 147 118" aria-hidden="true"><path d="M143 71.23c-15.09 0-19.282-11.546-23.473-23.535-2.515 5.884-7.545 23.534-16.767 23.534-9.123 0-11.82-16.544-15.09-23.532-8.992 11.645-18.443 25.01-31.856 23.532C38.094 69.277 42.4 4 64.197 4c21.796 0-25.338 93.05-38.614 108.092-13.471 15.263-34.584-65.786-10.853-74.477" pathLength="1" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Two rounded bars rotated ±35° form the "back" chevron of the sub-page navigation.
export const back = () => `<span class="back-chevron" aria-hidden="true"><i></i><i></i></span>`;

export const arrowUpRight = (cls = 'icon-arrow') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
