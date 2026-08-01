import { useEffect, useState } from "react";

import PlaceholderImage from "../components/PlaceholderImage";

interface ContainerProps {
  imageUrl: string;
}

const LocalImage: React.FC<ContainerProps> = ({ imageUrl }) => {
  const [imageState, setImageState] = useState<
    "loading" | "loaded" | "missing"
  >("loading");

  useEffect(() => setImageState("loading"), [imageUrl]);

  return (
    <div className="local-image">
      {imageState !== "loaded" && (
        <PlaceholderImage isMissing={imageState === "missing"} />
      )}

      {imageState !== "missing" && (
        <img
          src={imageUrl}
          alt=""
          onLoad={() => setImageState("loaded")}
          onError={() => setImageState("missing")}
        />
      )}
    </div>
  );
};

export default LocalImage;
