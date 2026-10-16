import { VILLAGE_INFO } from "@/lib/config";

export default function VillageInfo() {
  const { about, stats, scheduleTitle, schedule } = VILLAGE_INFO;
  return (
    <section className="village-info mb-4" aria-label="ग्राम पंचायत की जानकारी">
      <div className="civic-card about-card d-flex align-items-start gap-3 p-3 mb-3">
        <span className="material-symbols-outlined text-secondary-civic">location_on</span>
        <p className="mb-0 fw-semibold">{about}</p>
      </div>

      <div className="civic-card info-stats mb-4">
        {stats.map((s) => (
          <div className="info-stat" key={s.label}>
            <div className="info-stat-value">{s.value}</div>
            <div className="info-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-heading d-flex align-items-center gap-3 mb-3">
        <h2 className="mb-0">{scheduleTitle}</h2>
        <span className="section-rule" aria-hidden="true" />
      </div>
      <dl className="civic-card schedule-grid mb-0">
        {schedule.map((item, i) => (
          <div className={`schedule-item ${i === schedule.length - 1 && schedule.length % 2 === 1 ? "schedule-wide" : ""}`} key={item.label}>
            <dt>{item.label}</dt>
            <dd>
              {item.strong && <strong>{item.strong}</strong>}
              {item.text}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
