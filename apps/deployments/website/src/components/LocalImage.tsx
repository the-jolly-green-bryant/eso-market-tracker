import { useEffect, useRef, useState } from "react";

import PlaceholderImage from "../components/PlaceholderImage";

interface ContainerProps {
  imageUrl: string;
}

const LocalImage: React.FC<ContainerProps> = ({ imageUrl }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageState, setImageState] = useState<
    "loading" | "loaded" | "missing"
  >("loading");

  useEffect(() => {
    const image = imageRef.current;
    setImageState("loading");

    // Cached images can finish before React attaches the load handler. Check
    // the element after the URL changes so the loading state cannot get stuck.
    if (image?.complete) {
      setImageState(image.naturalWidth > 0 ? "loaded" : "missing");
    }
  }, [imageUrl]);

  return (
    <div className="local-image">
      {imageState !== "loaded" && (
        <PlaceholderImage isMissing={imageState === "missing"} />
      )}

      {imageState !== "missing" && (
        <img
          ref={imageRef}
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
