import { useLayoutEffect, useState } from 'react';

const getMatches = (query: string) => window.matchMedia(query).matches;

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => getMatches(query));

  const handleChange = () => {
    setMatches(getMatches(query));
  };

  useLayoutEffect(() => {
    const matchMedia = window.matchMedia(query);
    handleChange();

    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener('change', handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener('change', handleChange);
      }
    };
  }, [query]);

  return matches;
};

export const useIsMobile = () =>
  useMediaQuery('(pointer: coarse) or (max-width: 700px)');

export const getIsMobile = () =>
  getMatches('(pointer: coarse) or (max-width: 700px)');
