import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const icons = { email: Mail, password: Lock, user: User };

export const Input = ({ label, icon, type = 'text', disabled, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const Icon = icons[icon];
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className="w-full space-y-1.5">
      {label && <label className={`text-sm font-semibold ml-1 ${disabled ? 'text-slate-600' : 'text-slate-400'}`}>{label}</label>}
      <div className={`relative flex items-center bg-slate-900/80 border rounded-high-tech transition-all ${disabled ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue/50'}`}>
        {Icon && <Icon className={`absolute left-3.5 w-5 h-5 ${disabled ? 'text-slate-600' : 'text-slate-500'}`} />}
        <input 
          type={inputType}
          disabled={disabled}
          className={`w-full bg-transparent py-3.5 ${Icon ? 'pl-11' : 'pl-4'} ${isPasswordField ? 'pr-11' : 'pr-4'} text-slate-100 outline-none placeholder:text-slate-600 ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          {...props} 
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};