export default function Select({ label, options, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <select {...props}>
        <option value="">Выберите...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="error">{error}</div>}
    </div>
  );
}