import { Link } from "react-router-dom";
import { formatDate, formatDuration, formatViews } from "../lib/format";

export default function VideoCard({ video, featured = false }) {
  return (
    <Link className={`video-card ${featured ? "video-card-featured" : ""}`} to={`/watch/${video._id}`}>
      <div className="thumbnail-wrap">
        {video.Thumbnail ? <img className="thumbnail" src={video.Thumbnail} alt="" loading="lazy" /> : <div className="thumbnail thumbnail-empty">No thumbnail</div>}
        <span className="duration">{formatDuration(video.duration)}</span>
      </div>
      <div className="video-card-body">
        <div className="channel-avatar">{video.owner?.avatar ? <img src={video.owner.avatar} alt="" loading="lazy" /> : video.owner?.username?.[0]?.toUpperCase()}</div>
        <div className="video-copy">
          <h3>{video.title}</h3>
          <p>{video.owner?.fullName || video.owner?.username || "Unknown creator"}</p>
          <span>{formatViews(video.views)} views · {formatDate(video.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
