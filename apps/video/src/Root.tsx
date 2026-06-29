import { Composition } from "remotion";

import { ClasificatoriaPorDia } from "./ClasificatoriaPorDia";
import snapshot from "../public/standings-snapshot.json";

const fps = 30;
const framesPerDay = 90;

export const RemotionRoot = () => {
  return (
    <Composition
      component={ClasificatoriaPorDia}
      defaultProps={{ days: snapshot.days }}
      durationInFrames={snapshot.days.length * framesPerDay + 60}
      fps={fps}
      height={1080}
      id="ClasificatoriaPorDia"
      width={1920}
    />
  );
};
