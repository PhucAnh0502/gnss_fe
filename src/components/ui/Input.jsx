import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const icons = { email: Mail, password: Lock, user: User };

export const Input = ({ label, icon, type = 'text', disabled, error, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const Icon = icons[icon];
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className={`relative flex items-center transition-all ${disabled ? 'opacity-60' : ''}`}>
        {Icon && (
          <Icon className={`absolute left-4 w-5 h-5 pointer-events-none ${disabled ? 'text-slate-600' : 'text-slate-500'}`} />
        )}
        <input 
          type={inputType}
          disabled={disabled}
          className={`input-field ${Icon ? 'pl-12' : ''} ${isPasswordField ? 'pr-12' : ''} ${error ? 'input-field-error' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}
          {...props} 
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50 pointer-events-auto"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};