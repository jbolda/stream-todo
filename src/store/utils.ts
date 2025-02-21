export const getDuration = (allSeconds: number) => {
  const hours = Math.floor(allSeconds / 3600);
  const minutes = Math.floor((allSeconds % 3600) / 60);
  const seconds = Math.round(allSeconds % 60);
  return { hours, minutes, seconds };
};
