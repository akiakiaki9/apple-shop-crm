export default function Button({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  loading = false,
  ...props 
}) {
  const variants = {
    primary: 'btn btn-primary',
    success: 'btn btn-success',
    danger: 'btn btn-danger',
    secondary: 'btn btn-secondary',
  };

  return (
    <button
      type={type}
      className={variants[variant]}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Загрузка...' : children}
    </button>
  );
}