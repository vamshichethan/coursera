import React from "react";

type VideolayerProps = {
  videoId: string;
  title: string;
};

const getYoutubeEmbedUrl = (videoId: string) => {
  try {
    const url = new URL(videoId);

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.split("/").pop();
      return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    const id = videoId.split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  return `https://www.youtube.com/embed/${videoId}`;
};

const Videolayer = ({ videoId, title }: VideolayerProps) => {
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg">
      <iframe
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        src={getYoutubeEmbedUrl(videoId)}
        className="w-full h-full"
      ></iframe>
    </div>
  );
};

export default Videolayer;
