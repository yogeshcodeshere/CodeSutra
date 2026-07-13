import "./globals.css";

export const metadata = {
  title: "NAMASTE ICD-11 Demo",
  description: "Dual-coded terminology and Problem List demo"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
