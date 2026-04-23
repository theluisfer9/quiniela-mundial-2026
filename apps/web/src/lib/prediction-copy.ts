export type PredictionSaveState = "idle" | "saving" | "saved" | "error" | "locked";

const PREDICTION_STATUS_LABELS: Record<PredictionSaveState, string> = {
  idle: "Listo para guardar",
  saving: "Guardando pronostico...",
  saved: "Pronostico guardado",
  error: "No se pudo guardar. Intenta otra vez.",
  locked: "Pronostico cerrado: ya no se puede editar desde aqui.",
};

export function getPredictionStatusLabel(state: PredictionSaveState) {
  return PREDICTION_STATUS_LABELS[state];
}
