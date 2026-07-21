import type { FollowUpItem } from "../types/dashboard";

type FollowUpsCardProps = {
  followUps: FollowUpItem[];
};

export function FollowUpsCard({ followUps }: FollowUpsCardProps) {
  return (
    <section className="dashboard-card">
      <h2>Today&apos;s follow-ups</h2>

      {followUps.length === 0 ? (
        <p className="dashboard-empty">
          No follow-ups due today. Enjoy the clear list.
        </p>
      ) : (
        <ul className="dashboard-list">
          {followUps.map((item) => (
            <li key={item.id} className="dashboard-list-item dashboard-follow-up-item">
              <p className="dashboard-item-title">{item.missionaryName}</p>
              <p className="dashboard-item-meta">District {item.districtName}</p>
              <p className="dashboard-item-meta">
                Follow-up: {item.followUpLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
