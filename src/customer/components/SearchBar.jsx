export default function SearchBar({ value, onChange, placeholder = 'Search trips…' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="input-field max-w-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
    />
  )
}
