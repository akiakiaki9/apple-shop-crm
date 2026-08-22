export default function Input({ label, type = 'text', error, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input type={type} {...props} />
      {error && <div className="error">{error}</div>}
    </div>
  );
}