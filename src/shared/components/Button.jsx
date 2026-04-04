import { forwardRef } from 'react'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'text-primary-600 hover:bg-primary-50 font-medium py-2 px-4 rounded-lg transition-colors',
}

const Button = forwardRef(function Button(
  { className = '', variant = 'primary', type = 'button', disabled, children, ...rest },
  ref
) {
  const v = variants[variant] || variants.primary
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${v} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
})

export default Button
