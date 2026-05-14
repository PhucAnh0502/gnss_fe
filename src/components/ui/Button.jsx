const variantClasses = {
  primary: 'btn-primary',
  primarySm: 'btn-primary-sm',
  primaryMd: 'btn-primary-md',
  primaryLg: 'btn-primary-lg',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  success: 'btn-success',
  danger: 'btn-danger',
  warning: 'btn-warning',
};

export const Button = ({
  children,
  isLoading,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  className = '',
  disabled,
  icon: Icon,
  ...props
}) => {
  const variantKey = size !== 'md' && variant === 'primary' 
    ? `${variant}${size.charAt(0).toUpperCase() + size.slice(1)}`
    : variant;
  
  return (
    <button
      disabled={isLoading || disabled}
      className={`${variantClasses[variantKey] || variantClasses.primary} ${fullWidth ? 'w-full' : 'w-auto'} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="spinner" />
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </button>
  );
};