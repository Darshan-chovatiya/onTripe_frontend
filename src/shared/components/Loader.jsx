const sizes = { sm: 'h-6 w-6 border-2', md: 'h-10 w-10 border-2', lg: 'h-12 w-12 border-b-2' }

export default function Loader({ size = 'md', text }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`animate-spin rounded-full border-primary-600 border-t-transparent ${sizes[size] || sizes.md}`}
        aria-hidden
      />
      {text ? <p className="text-sm text-gray-600">{text}</p> : null}
    </div>
  )
}
