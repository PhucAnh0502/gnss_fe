const variantClasses = {
  primary: 'bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-slate-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 disabled:bg-red-900/60 text-white',
};

export const Button = ({
  children,
  isLoading,
  variant = 'primary',
  fullWidth = true,
  className = '',
  disabled,
  ...props
}) => (
  <button
    disabled={isLoading || disabled}
    className={`${fullWidth ? 'w-full' : 'w-auto'} ${variantClasses[variant] || variantClasses.primary} font-semibold py-4 rounded-xl transition-all flex justify-center items-center ${className}`}
    {...props}
  >
    {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
  </button>
);