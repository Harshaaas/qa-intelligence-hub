export default function TestCard({ title, result, rows, conclusion, children, footer }) {
  const ok = result && !result.error;
  return (
    <article className="test-card">
      <div className="test-card-head">
        <h3>{title}</h3>
        {ok && <span className={`pill ${result.significant ? "green" : "grey"}`}>{result.significant ? "Significant" : "Not Significant"}</span>}
      </div>
      {children}
      {ok ? (
        <>
          <dl>
            {rows.map((r) => (
              <div key={r.label} className="kv"><dt>{r.label}</dt><dd className={r.good ? "v good" : "v"}>{r.value}</dd></div>
            ))}
          </dl>
          <p className="conclusion"><strong>Conclusion:</strong> {conclusion}</p>
          {footer}
        </>
      ) : (
        <p className="muted">{result?.error ?? "Not enough data for this test."}</p>
      )}
    </article>
  );
}
