/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        field: "#f6f8f5",
        line: "#d7ddd4",
        leaf: "#2f6f4e",
        saffron: "#d88b25",
        clinic: "#f4fbff"
      }
    }
  },
  plugins: []
};
