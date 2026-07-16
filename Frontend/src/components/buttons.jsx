export const PrimaryButton = ({ onClick, children, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors cursor-pointer text-sm"
  >
    {children}
  </button>
);

export const DangerButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors cursor-pointer text-sm"
  >
    {children}
  </button>
);