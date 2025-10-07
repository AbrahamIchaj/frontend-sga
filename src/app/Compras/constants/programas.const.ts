export interface ProgramaOption {
  value: number;
  label: string;
}

export const PROGRAMAS_DISPONIBLES: ProgramaOption[] = [
  { value: 13, label: 'Programa 13 Recuperación de la salud' },
  { value: 14, label: 'Programa 14 Prevención de la mortalidad de la niñez y de la desnutrición crónica' },
  { value: 15, label: 'Programa 15 Prevención de la mortalidad materna y neonatal' },
  { value: 16, label: 'Programa 16 Prevención y control del ITS, VIH/SIDA' },
  { value: 94, label: 'Programa 94 Atención por desastres naturales y calamidades públicas' }
];
