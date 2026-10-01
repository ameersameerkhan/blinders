import { Composition, Still } from "remotion";
import { Promo } from "./Promo";
import { Thumbnail } from "./Thumbnail";
import { DURATION, FPS } from "./theme";

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
  </>
);
